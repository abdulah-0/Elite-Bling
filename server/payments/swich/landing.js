import { landingChecksum } from './checksum.js'

/**
 * Sanitises the item string.
 * Strips everything except A-Za-z0-9 and space, collapses spaces, trims, max 500 chars.
 * Reference: docs/implementation.prd.md §4.3 & §8.2 step 5.
 */
export function sanitiseItem(rawItem) {
  if (!rawItem || typeof rawItem !== 'string') return 'Order'
  const cleaned = rawItem.replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  return (cleaned || 'Order').slice(0, 500)
}

/**
 * Normalises Pakistani MSISDN to 03xxxxxxxxx format.
 * Accepts +92345..., 92345..., 0345..., 345...
 * Reference: docs/implementation.prd.md §4.3, §8.2 & §13.1
 */
export function normaliseMsisdn(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return null
  const digits = rawPhone.replace(/\D/g, '')

  // 923xxxxxxxxx (12 digits)
  if (digits.startsWith('923') && digits.length === 12) {
    return `0${digits.slice(2)}`
  }
  // 03xxxxxxxxx (11 digits)
  if (digits.startsWith('03') && digits.length === 11) {
    return digits
  }
  // 3xxxxxxxxx (10 digits)
  if (digits.startsWith('3') && digits.length === 10) {
    return `0${digits}`
  }

  return null
}

/**
 * Builds the Swich Hosted Landing Page GET URL.
 * Reference: docs/implementation.prd.md §4.3 & §8.3
 *
 * @param {object} config - Swich configuration
 * @param {object} params - { customerTransactionId, orderNumber, amount, payeeName, email, phone, publicPaymentRef }
 * @returns {string} Fully formed redirect URL
 */
export function buildLandingGetUrl(config, {
  customerTransactionId,
  orderNumber,
  amount,
  payeeName,
  email,
  phone,
  publicPaymentRef,
}) {
  if (!config.clientId) throw new Error('clientId is required')
  if (!customerTransactionId) throw new Error('customerTransactionId is required')

  const item = sanitiseItem(`Order ${orderNumber}`)
  const amountStr = Number(amount).toFixed(2)
  const normalisedPhone = normaliseMsisdn(phone)
  if (!normalisedPhone) {
    throw new Error('Valid Pakistani mobile number (03xxxxxxxxx) is required')
  }

  // Compute checksum using raw un-encoded values
  const checksum = landingChecksum(config.secretKey, customerTransactionId, item, amountStr)

  const successRedirectUrl = `${config.siteUrl}/checkout/payment-return?ref=${encodeURIComponent(publicPaymentRef)}`

  const url = new URL(config.pwaGetUrl)
  url.searchParams.set('clientId', config.clientId)
  url.searchParams.set('customerTransactionId', customerTransactionId)
  url.searchParams.set('item', item)
  url.searchParams.set('amount', amountStr)
  url.searchParams.set('channel', '0')
  url.searchParams.set('checksum', checksum)
  url.searchParams.set('description', `Payment for order ${orderNumber}`)
  url.searchParams.set('billReferenceNo', String(orderNumber))
  url.searchParams.set('PayeeName', payeeName || 'Customer')
  url.searchParams.set('Email', email || '')
  url.searchParams.set('MSISDN', normalisedPhone)
  url.searchParams.set('currency', 'PKR')
  url.searchParams.set('successRedirectUrl', successRedirectUrl)

  if (config.transactionType) {
    url.searchParams.set('transactionType', config.transactionType)
  }

  return url.toString()
}

/**
 * Builds the Swich Hosted Landing Page POST Form (AES mode).
 * Reference: docs/implementation.prd.md §4.4
 *
 * TODO(VERIFY): AES mode, key/IV encoding, padding, output encoding not confirmed by Swich yet.
 */
export function buildLandingPostForm(config, params) {
  if (config.landingMode !== 'post') {
    throw new Error('POST mode is not active')
  }
  // TODO(VERIFY): Implement AES token encryption once Swich provides specific cipher specifications
  throw new Error('Swich POST mode AES encryption requires confirmed parameters from Swich (§16 item 4)')
}
