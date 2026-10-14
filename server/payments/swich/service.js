import { randomUUID, createHash } from 'node:crypto'
import { getSwichConfig } from './config.js'
import { verifyCallbackChecksum } from './checksum.js'
import { buildLandingGetUrl, normaliseMsisdn, sanitiseItem } from './landing.js'
import { mapSwichStatus, isTerminalStatus } from './status-map.js'
import { inquireByCustomerTransactionId } from './inquire.js'
import { logger } from './logger.js'

/**
 * Initiates a Swich payment attempt for an order.
 * Reference: docs/implementation.prd.md §5.2 & §8.2
 */
export async function initiatePayment({ orderId, user, supabase, config = getSwichConfig() }) {
  if (!config.enabled) {
    const err = new Error('Online payment via Swich is currently disabled')
    err.status = 503
    err.code = 'payment_provider_unavailable'
    throw err
  }

  if (!orderId) {
    const err = new Error('orderId is required')
    err.status = 400
    err.code = 'missing_order_id'
    throw err
  }

  // 1. Load order from DB and verify ownership
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    const err = new Error('Order not found')
    err.status = 404
    err.code = 'order_not_found'
    throw err
  }

  // Verify ownership if order is associated with a user
  if (order.user_id && user?.id && order.user_id !== user.id) {
    const err = new Error('Unauthorized to pay for this order')
    err.status = 403
    err.code = 'unauthorized'
    throw err
  }

  if (order.payment_status === 'paid' || order.status === 'paid') {
    const err = new Error('Order is already paid')
    err.status = 409
    err.code = 'already_paid'
    throw err
  }

  // 2. Recompute payable amount from database (prevents price tampering)
  let computedAmount = 0
  if (Array.isArray(order.order_items) && order.order_items.length > 0) {
    computedAmount = order.order_items.reduce((sum, item) => {
      const p = Number(item.price) || 0
      const q = Number(item.quantity) || 1
      return sum + p * q
    }, 0)
  }

  // Fallback to order.total_price if order_items total is zero
  if (computedAmount <= 0) {
    computedAmount = Number(order.total_price) || 0
  }

  if (computedAmount < config.minAmount || computedAmount > config.maxAmount) {
    const err = new Error(`Order amount (PKR ${computedAmount}) is outside the accepted range [${config.minAmount}, ${config.maxAmount}]`)
    err.status = 422
    err.code = 'amount_out_of_range'
    throw err
  }

  // 3. Validate customer information
  const shipping = order.shipping_info || {}
  const payeeName = shipping.fullName || user?.user_metadata?.full_name || 'Customer'
  const email = shipping.email || user?.email || ''
  const rawPhone = shipping.phone || user?.phone || ''
  const phone = normaliseMsisdn(rawPhone)

  if (!phone) {
    const err = new Error('A valid Pakistani mobile phone number (03xxxxxxxxx) is required for online payment')
    err.status = 422
    err.code = 'phone_required'
    throw err
  }

  // Ensure public payment ref exists on the order for safe status polling
  let publicPaymentRef = order.public_payment_ref
  if (!publicPaymentRef) {
    publicPaymentRef = randomUUID().replace(/-/g, '').slice(0, 24)
    await supabase
      .from('orders')
      .update({ public_payment_ref: publicPaymentRef })
      .eq('id', order.id)
  }

  // 4. Reuse rule (§8.2 step 4)
  const now = new Date()
  const { data: existingAttempts } = await supabase
    .from('payment_attempts')
    .select('*')
    .eq('order_id', order.id)
    .in('status', ['initiated', 'redirected', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)

  const activeAttempt = existingAttempts?.[0]
  if (activeAttempt && activeAttempt.expires_at) {
    const expiresAt = new Date(activeAttempt.expires_at)
    const marginMs = 5 * 60 * 1000
    if (now.getTime() < expiresAt.getTime() - marginMs) {
      logger.info('Reusing active payment attempt for order', {
        orderId: order.id,
        customerTransactionId: activeAttempt.customer_transaction_id,
      })

      const redirectUrl = buildLandingGetUrl(config, {
        customerTransactionId: activeAttempt.customer_transaction_id,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        amount: computedAmount,
        payeeName,
        email,
        phone,
        publicPaymentRef,
      })

      return {
        redirectUrl,
        customerTransactionId: activeAttempt.customer_transaction_id,
        reused: true,
      }
    }
  }

  // 5. Create fresh payment attempt (32-char UUID hex, max 50 chars)
  const customerTransactionId = randomUUID().replace(/-/g, '')
  const expiresAt = new Date(Date.now() + config.attemptTtlMinutes * 60 * 1000).toISOString()

  const { error: insertErr } = await supabase
    .from('payment_attempts')
    .insert([{
      order_id: order.id,
      customer_transaction_id: customerTransactionId,
      amount: computedAmount,
      currency: 'PKR',
      status: 'initiated',
      provider: 'swich',
      method: 'landing_page',
      expires_at: expiresAt,
    }])

  if (insertErr) {
    logger.error('Failed to create payment attempt in DB', { error: insertErr.message })
    const err = new Error('Could not initiate payment session')
    err.status = 500
    throw err
  }

  // Build landing URL (GET)
  const redirectUrl = buildLandingGetUrl(config, {
    customerTransactionId,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    amount: computedAmount,
    payeeName,
    email,
    phone,
    publicPaymentRef,
  })

  // Mark status as 'redirected'
  await supabase
    .from('payment_attempts')
    .update({ status: 'redirected', redirected_at: new Date().toISOString() })
    .eq('customer_transaction_id', customerTransactionId)

  logger.info('Payment attempt created and redirected', {
    orderId: order.id,
    customerTransactionId,
    amount: computedAmount,
  })

  return {
    redirectUrl,
    customerTransactionId,
    reused: false,
  }
}

/**
 * Handles incoming Swich callback (HTTP GET from Swich).
 * Reference: docs/implementation.prd.md §4.6, §5.2 & §8.4
 */
export async function handleCallback({ query, rawQuery = '', supabase, config = getSwichConfig() }) {
  const {
    PaymentType,
    Status,
    OrderId,
    CustomerTransactionId,
    Amount,
    Checksum,
  } = query

  // 1. Validate required fields
  if (!Status || !CustomerTransactionId || !Amount || !Checksum) {
    logger.warn('Callback missing required parameters', { query })
    return {
      statusCode: 400,
      body: { error: 'Missing required callback parameters' },
    }
  }

  // 2. Checksum verification
  const verification = verifyCallbackChecksum(config.secretKey, {
    customerTransactionId: CustomerTransactionId,
    orderId: OrderId || '',
    amount: Amount,
    status: Status,
    checksum: Checksum,
  })

  // Compute dedupe key to ensure idempotency: sha256("callback" + rawQuery)
  const dedupeKey = createHash('sha256')
    .update(`callback:${rawQuery || JSON.stringify(query)}`)
    .digest('hex')

  // 3. Record event in payment_events (handles duplicate deliveries gracefully)
  const { error: eventErr } = await supabase
    .from('payment_events')
    .insert([{
      customer_transaction_id: CustomerTransactionId,
      source: 'callback',
      provider_status: Status,
      checksum_valid: verification.valid,
      payload: query,
      dedupe_key: dedupeKey,
    }])

  // Duplicate callback already handled
  if (eventErr && (eventErr.code === '23505' || eventErr.message?.includes('unique'))) {
    logger.info('Duplicate callback received and acknowledged', { CustomerTransactionId, dedupeKey })
    return {
      statusCode: 200,
      body: { status: 'success' },
    }
  }

  // Reject invalid checksum
  if (!verification.valid) {
    logger.error('Callback checksum mismatch', {
      CustomerTransactionId,
      Status,
      Amount,
    })
    return {
      statusCode: 401,
      body: { error: 'Invalid checksum' },
    }
  }

  // 4. Load attempt
  const { data: attempt, error: attemptErr } = await supabase
    .from('payment_attempts')
    .select('*')
    .eq('customer_transaction_id', CustomerTransactionId)
    .single()

  if (attemptErr || !attempt) {
    logger.error('Payment attempt not found for callback', { CustomerTransactionId })
    return {
      statusCode: 404,
      body: { error: 'Payment attempt not found' },
    }
  }

  // Map status
  const mappedStatus = mapSwichStatus(Status) || 'needs_review'

  // 5. If Status maps to 'paid', verify with Inquire (defense-in-depth)
  let confirmedStatus = mappedStatus
  if (mappedStatus === 'paid') {
    try {
      const inquireRes = await inquireByCustomerTransactionId(CustomerTransactionId, config)
      if (inquireRes.success && inquireRes.transactionStatus) {
        const inqMapped = mapSwichStatus(inquireRes.transactionStatus)
        if (inqMapped !== 'paid') {
          logger.warn('Inquire status contradicts callback success', {
            callbackStatus: Status,
            inquireStatus: inquireRes.transactionStatus,
          })
          confirmedStatus = 'needs_review'
        }
      }
    } catch (inqErr) {
      // Inquire failure does not block authentic checksum callback, but logs warning
      logger.warn('Inquire check failed during callback, proceeding on verified HMAC', {
        error: inqErr.message,
      })
    }
  }

  // 6. Transition state in DB
  const { data: transitionRes, error: rpcErr } = await supabase.rpc('apply_payment_status', {
    p_customer_transaction_id: CustomerTransactionId,
    p_new_status: confirmedStatus,
    p_provider_status: Status,
    p_provider_code: '0000',
    p_provider_message: 'Callback received',
    p_swich_order_id: OrderId || null,
    p_amount: Number(Amount),
    p_payment_type: PaymentType || null,
  })

  // If RPC is missing in local/test setup, fallback to direct table updates
  if (rpcErr) {
    logger.warn('apply_payment_status RPC fallback to direct updates', { error: rpcErr.message })
    await applyPaymentStatusFallback(supabase, {
      attempt,
      newStatus: confirmedStatus,
      providerStatus: Status,
      swichOrderId: OrderId,
      amount: Number(Amount),
      paymentType: PaymentType,
    })
  }

  logger.info('Callback processed successfully', {
    CustomerTransactionId,
    confirmedStatus,
    OrderId,
  })

  // 7. Answer HTTP 200 with required JSON body
  return {
    statusCode: 200,
    body: { status: 'success' },
  }
}

/**
 * Fallback application of payment status if the database RPC is not yet registered.
 */
async function applyPaymentStatusFallback(supabase, {
  attempt,
  newStatus,
  providerStatus,
  swichOrderId,
  amount,
  paymentType,
}) {
  // Amount guard
  if (newStatus === 'paid' && amount !== Number(attempt.amount)) {
    await supabase
      .from('payment_attempts')
      .update({ status: 'needs_review', failure_reason: 'amount_mismatch', updated_at: new Date().toISOString() })
      .eq('id', attempt.id)
    await supabase
      .from('orders')
      .update({ payment_status: 'needs_review' })
      .eq('id', attempt.order_id)
    return
  }

  // Monotonic guard
  if (['paid', 'partially_refunded', 'refunded'].includes(attempt.status) && ['initiated', 'redirected', 'pending', 'failed', 'expired'].includes(newStatus)) {
    return
  }

  await supabase
    .from('payment_attempts')
    .update({
      status: newStatus,
      provider_status: providerStatus,
      swich_order_id: swichOrderId || attempt.swich_order_id,
      payment_type: paymentType || attempt.payment_type,
      completed_at: isTerminalStatus(newStatus) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attempt.id)

  if (newStatus === 'paid') {
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', attempt.order_id)

    // Insert outbox notification for exactly-once email/side-effect
    await supabase
      .from('notification_outbox')
      .insert([{
        event_type: 'order_paid',
        order_id: attempt.order_id,
        attempt_id: attempt.id,
        payload: {
          customer_transaction_id: attempt.customer_transaction_id,
          amount,
          swich_order_id: swichOrderId,
        },
      }])
  }
}

/**
 * Safe order payment status query for return page polling.
 * Returns only safe fields, never exposing PII or internal credentials.
 * Reference: docs/implementation.prd.md §5.2 & §9.2
 */
export async function getPaymentStatusByRef({ ref, supabase }) {
  if (!ref) {
    const err = new Error('Public payment ref is required')
    err.status = 400
    throw err
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, total_price, status, payment_status, paid_at')
    .eq('public_payment_ref', ref)
    .single()

  if (orderErr || !order) {
    const err = new Error('Payment reference not found')
    err.status = 404
    throw err
  }

  const { data: attempts } = await supabase
    .from('payment_attempts')
    .select('status, provider_status, provider_message, created_at, completed_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const latest = attempts?.[0]

  return {
    orderId: order.id,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    total: order.total_price,
    paymentStatus: order.payment_status || 'unpaid',
    orderStatus: order.status,
    attemptStatus: latest?.status || 'initiated',
    paidAt: order.paid_at,
    providerMessage: latest?.provider_message || null,
  }
}

/**
 * Cron reconciliation job for pending Swich payment attempts.
 * Inquires attempts older than 10 minutes that haven't reached a terminal state.
 * Reference: docs/implementation.prd.md §6 (FR-8) & §8.5
 */
export async function reconcilePendingAttempts({ supabase, config = getSwichConfig() }) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: attempts, error } = await supabase
    .from('payment_attempts')
    .select('*')
    .in('status', ['initiated', 'redirected', 'pending'])
    .lt('initiated_at', tenMinutesAgo)
    .order('initiated_at', { ascending: true })
    .limit(50)

  if (error || !attempts) {
    logger.error('Failed to fetch pending attempts for reconciliation', { error: error?.message })
    return { reconciled: 0, errors: [error?.message] }
  }

  let reconciledCount = 0
  const errors = []

  for (const attempt of attempts) {
    try {
      const inq = await inquireByCustomerTransactionId(attempt.customer_transaction_id, config)
      const now = new Date()
      const isPastTtl = attempt.expires_at && now > new Date(attempt.expires_at)

      if (inq.success && inq.transactionStatus) {
        const mapped = mapSwichStatus(inq.transactionStatus)
        if (mapped && mapped !== attempt.status) {
          await supabase.rpc('apply_payment_status', {
            p_customer_transaction_id: attempt.customer_transaction_id,
            p_new_status: mapped,
            p_provider_status: inq.transactionStatus,
            p_provider_code: inq.code,
            p_provider_message: inq.message,
            p_swich_order_id: inq.swichOrderId,
            p_amount: inq.amount,
          })
          reconciledCount++
        }
      } else if (isPastTtl) {
        // Expired past TTL with no success reported
        await supabase.rpc('apply_payment_status', {
          p_customer_transaction_id: attempt.customer_transaction_id,
          p_new_status: 'expired',
          p_provider_status: 'expired_by_reconcile',
          p_provider_code: null,
          p_provider_message: 'Attempt expired past TTL',
          p_swich_order_id: null,
          p_amount: null,
        })
        reconciledCount++
      }

      await supabase
        .from('payment_attempts')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', attempt.id)
    } catch (err) {
      errors.push({ id: attempt.id, error: err.message })
    }
  }

  return { reconciled: reconciledCount, totalChecked: attempts.length, errors }
}
