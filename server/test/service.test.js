import test from 'node:test'
import assert from 'node:assert/strict'
import {
  initiatePayment,
  handleCallback,
  getPaymentStatusByRef,
} from '../payments/swich/service.js'
import { callbackChecksum } from '../payments/swich/checksum.js'

test('Swich service integration tests', async (t) => {
  const secretKey = 'test_secret_for_integration'
  const config = {
    enabled: true,
    env: 'sandbox',
    clientId: 'test_client_id',
    clientSecret: 'test_client_secret',
    secretKey,
    apiBase: 'https://sandbox-api.swichnow.com',
    pwaGetUrl: 'https://sandbox-payin-pwa.swichnow.com/',
    siteUrl: 'https://store.example',
    minAmount: 10,
    maxAmount: 50000,
    attemptTtlMinutes: 60,
  }

  // Mock DB state
  const mockOrders = new Map([
    [
      'order-1',
      {
        id: 'order-1',
        user_id: 'user-1',
        total_price: 2500,
        status: 'pending',
        payment_status: 'unpaid',
        shipping_info: {
          fullName: 'Zainab Bibi',
          email: 'zainab@example.com',
          phone: '+923331234567',
        },
        order_items: [{ price: 2500, quantity: 1, name: 'Bridal Set' }],
        public_payment_ref: 'ref_zainab_123',
      },
    ],
  ])

  const mockAttempts = new Map()
  const mockEvents = []

  const mockSupabase = {
    from: (table) => ({
      select: (cols) => {
        const query = {
          _col: null,
          _val: null,
          _inCol: null,
          _inVals: null,
          eq(col, val) {
            this._col = col
            this._val = val
            return this
          },
          in(col, vals) {
            this._inCol = col
            this._inVals = vals
            return this
          },
          order() {
            return this
          },
          limit(n) {
            return this
          },
          async single() {
            if (table === 'orders') {
              for (const o of mockOrders.values()) {
                if (o[this._col] === this._val) return { data: o, error: null }
              }
              return { data: null, error: { message: 'Not found' } }
            }
            if (table === 'payment_attempts') {
              for (const a of mockAttempts.values()) {
                if (a[this._col] === this._val) return { data: a, error: null }
              }
              return { data: null, error: { message: 'Not found' } }
            }
            return { data: null, error: null }
          },
          then(resolve) {
            let results = []
            if (table === 'orders') results = Array.from(mockOrders.values())
            if (table === 'payment_attempts') results = Array.from(mockAttempts.values())

            if (this._col && this._val) {
              results = results.filter((r) => r[this._col] === this._val)
            }
            if (this._inCol && this._inVals) {
              results = results.filter((r) => this._inVals.includes(r[this._inCol]))
            }
            resolve({ data: results, error: null })
          },
        }
        return query
      },
      insert: (rows) => ({
        select: () => ({
          data: rows,
          error: null,
        }),
        then: (resolve) => {
          if (table === 'payment_attempts') {
            for (const r of rows) {
              const id = `att_${mockAttempts.size + 1}`
              mockAttempts.set(r.customer_transaction_id, { id, ...r, created_at: new Date().toISOString() })
            }
          }
          if (table === 'payment_events') {
            for (const r of rows) {
              // Deduplication check
              if (mockEvents.some((e) => e.dedupe_key === r.dedupe_key)) {
                return resolve({ error: { code: '23505', message: 'duplicate key' } })
              }
              mockEvents.push(r)
            }
          }
          resolve({ data: rows, error: null })
        },
      }),
      update: (fields) => ({
        eq: async (col, val) => {
          if (table === 'payment_attempts') {
            for (const [key, a] of mockAttempts.entries()) {
              if (a[col] === val) {
                mockAttempts.set(key, { ...a, ...fields })
              }
            }
          }
          if (table === 'orders') {
            const o = mockOrders.get(val)
            if (o) mockOrders.set(val, { ...o, ...fields })
          }
          return { error: null }
        },
      }),
    }),
    rpc: async (fnName, params) => {
      if (fnName === 'apply_payment_status') {
        const att = mockAttempts.get(params.p_customer_transaction_id)
        if (att) {
          att.status = params.p_new_status
          att.swich_order_id = params.p_swich_order_id
        }
        const o = mockOrders.get('order-1')
        if (o && params.p_new_status === 'paid') {
          o.payment_status = 'paid'
          o.status = 'paid'
        }
        return { data: [{ transitioned: true }], error: null }
      }
      return { data: null, error: null }
    },
  }

  await t.test('initiatePayment successfully generates redirect URL and stores attempt', async () => {
    const res = await initiatePayment({
      orderId: 'order-1',
      user: { id: 'user-1' },
      supabase: mockSupabase,
      config,
    })

    assert.ok(res.redirectUrl)
    assert.match(res.redirectUrl, /sandbox-payin-pwa\.swichnow\.com/)
    assert.match(res.redirectUrl, /amount=2500/)
    assert.match(res.redirectUrl, /MSISDN=03331234567/)
    assert.equal(res.customerTransactionId.length, 32)
    assert.equal(res.reused, false)

    // Stored attempt verified
    const stored = mockAttempts.get(res.customerTransactionId)
    assert.ok(stored)
    assert.equal(stored.amount, 2500)
    assert.equal(stored.status, 'redirected')
  })

  await t.test('initiatePayment reuses active attempt on rapid second click', async () => {
    const res2 = await initiatePayment({
      orderId: 'order-1',
      user: { id: 'user-1' },
      supabase: mockSupabase,
      config,
    })

    assert.equal(res2.reused, true)
  })

  await t.test('initiatePayment rejects unauthorized user', async () => {
    await assert.rejects(
      async () => {
        await initiatePayment({
          orderId: 'order-1',
          user: { id: 'wrong-user-999' },
          supabase: mockSupabase,
          config,
        })
      },
      (err) => err.status === 403
    )
  })

  await t.test('handleCallback processes valid success callback and transitions order to paid', async () => {
    const activeTxnId = Array.from(mockAttempts.keys())[0]
    const orderId = 'SW_ORDER_789'
    const amount = '2500.00'
    const status = 'success'

    const checksum = callbackChecksum(secretKey, activeTxnId, orderId, amount, status)

    const query = {
      PaymentType: 'Card',
      Status: status,
      OrderId: orderId,
      CustomerTransactionId: activeTxnId,
      Amount: amount,
      Checksum: checksum,
    }

    const callbackRes = await handleCallback({
      query,
      rawQuery: 'test_query_string',
      supabase: mockSupabase,
      config,
    })

    assert.equal(callbackRes.statusCode, 200)
    assert.deepEqual(callbackRes.body, { status: 'success' })

    // Verify order is marked paid
    const updatedOrder = mockOrders.get('order-1')
    assert.equal(updatedOrder.payment_status, 'paid')
  })

  await t.test('handleCallback rejects invalid checksum with 401', async () => {
    const activeTxnId = Array.from(mockAttempts.keys())[0]
    const query = {
      PaymentType: 'Card',
      Status: 'success',
      OrderId: 'SW_111',
      CustomerTransactionId: activeTxnId,
      Amount: '2500.00',
      Checksum: 'invalid_checksum_value_here',
    }

    const callbackRes = await handleCallback({
      query,
      rawQuery: 'invalid_checksum_call',
      supabase: mockSupabase,
      config,
    })

    assert.equal(callbackRes.statusCode, 401)
  })

  await t.test('handleCallback is idempotent: replayed callback returns 200 without error', async () => {
    const activeTxnId = Array.from(mockAttempts.keys())[0]
    const orderId = 'SW_ORDER_789'
    const amount = '2500.00'
    const status = 'success'
    const checksum = callbackChecksum(secretKey, activeTxnId, orderId, amount, status)

    const query = {
      PaymentType: 'Card',
      Status: status,
      OrderId: orderId,
      CustomerTransactionId: activeTxnId,
      Amount: amount,
      Checksum: checksum,
    }

    // Call again with same rawQuery (which generates same dedupeKey)
    const callbackRes = await handleCallback({
      query,
      rawQuery: 'test_query_string',
      supabase: mockSupabase,
      config,
    })

    assert.equal(callbackRes.statusCode, 200)
    assert.deepEqual(callbackRes.body, { status: 'success' })
  })

  await t.test('getPaymentStatusByRef returns safe status without PII', async () => {
    const statusData = await getPaymentStatusByRef({
      ref: 'ref_zainab_123',
      supabase: mockSupabase,
    })

    assert.equal(statusData.orderId, 'order-1')
    assert.equal(statusData.paymentStatus, 'paid')
    assert.equal(statusData.total, 2500)
    assert.equal(statusData.customerName, undefined)
    assert.equal(statusData.email, undefined)
  })
})
