import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Generates an HMAC-SHA256 lowercase hex digest.
 */
export const hmacSha256 = (key, msg) => {
  if (!key) throw new Error('SecretKey is required for checksum computation')
  return createHmac('sha256', key).update(msg, 'utf8').digest('hex').toLowerCase()
}

/**
 * Computes landing page checksum.
 * Formula: HMAC_SHA256(SecretKey, "Swich:{customerTransactionId}:{item}:{amount}")
 */
export const landingChecksum = (key, txnId, item, amount) => {
  return hmacSha256(key, `Swich:${txnId}:${item}:${amount}`)
}

/**
 * Computes callback checksum.
 * Formula: HMAC_SHA256(SecretKey, "SWCallback:{CustomerTransactionId}:{OrderId}:{Amount}:{Status}")
 */
export const callbackChecksum = (key, txnId, orderId, amount, status) => {
  return hmacSha256(key, `SWCallback:${txnId}:${orderId}:${amount}:${status}`)
}

/**
 * Constant-time comparison for hex strings to prevent timing attacks.
 */
export const safeEqualHex = (a, b) => {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false
  const cleanA = a.trim().toLowerCase()
  const cleanB = b.trim().toLowerCase()
  if (cleanA.length !== cleanB.length) return false
  try {
    const bufA = Buffer.from(cleanA, 'hex')
    const bufB = Buffer.from(cleanB, 'hex')
    if (bufA.length === 0 || bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Verifies callback checksum.
 * Tries raw string first, then amount format variations (e.g. 10 vs 10.00 vs 10.0000) per §4.5 & §8.4.
 *
 * @param {string} key - SecretKey
 * @param {object} params - { customerTransactionId, orderId, amount, status, checksum }
 * @returns {{ valid: boolean, matchedVariant: string|null }}
 */
export const verifyCallbackChecksum = (key, { customerTransactionId, orderId, amount, status, checksum }) => {
  if (!key || !checksum) return { valid: false, matchedVariant: null }

  const rawAmount = String(amount ?? '')

  // 1. Raw string match
  const rawExpected = callbackChecksum(key, customerTransactionId, orderId, rawAmount, status)
  if (safeEqualHex(checksum, rawExpected)) {
    return { valid: true, matchedVariant: 'raw' }
  }

  // 2. Variations: Number.toString(), toFixed(2), toFixed(4)
  const num = Number(rawAmount)
  if (!isNaN(num)) {
    const variants = [
      { name: 'number_string', val: num.toString() },
      { name: 'fixed_2', val: num.toFixed(2) },
      { name: 'fixed_4', val: num.toFixed(4) },
      { name: 'fixed_0', val: Math.round(num).toString() },
    ]

    for (const v of variants) {
      if (v.val === rawAmount) continue
      const expected = callbackChecksum(key, customerTransactionId, orderId, v.val, status)
      if (safeEqualHex(checksum, expected)) {
        return { valid: true, matchedVariant: v.name }
      }
    }
  }

  return { valid: false, matchedVariant: null }
}
