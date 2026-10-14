/**
 * Swich Response Codes & Error Handling Map
 * Reference: docs/implementation.prd.md §4.8 & §11
 *
 * All response codes are parsed and compared as strings.
 */

export function mapResponseCode(endpoint, rawCode, message = '') {
  const code = String(rawCode ?? '').trim()
  const msgLower = String(message ?? '').toLowerCase()

  // 1. Success codes
  if (code === '0000' || code === '00001' || code === '0') {
    return {
      kind: 'success',
      retryable: false,
      userMessage: 'Payment processed successfully',
      alertOps: false,
    }
  }

  // 2. Duplicate transaction ID
  if (code === '0001') {
    return {
      kind: 'duplicate',
      retryable: true,
      userMessage: 'Transaction duplicate detected. Please try again.',
      alertOps: false,
    }
  }

  // 3. Overlapping codes: 0009 & 0014
  if (code === '0009') {
    if (endpoint === 'refund' || msgLower.includes('refund')) {
      return {
        kind: 'not_refundable',
        retryable: false,
        userMessage: "This payment method can't be refunded online — please refund manually.",
        alertOps: false,
      }
    }
    return {
      kind: 'system_error',
      retryable: false,
      userMessage: 'Payment provider system error. Please try another method.',
      alertOps: true,
    }
  }

  if (code === '0014') {
    if (endpoint === 'refund' || msgLower.includes('refund')) {
      return {
        kind: 'refund_exceeds_amount',
        retryable: false,
        userMessage: 'Refund amount exceeds original transaction balance.',
        alertOps: false,
      }
    }
    return {
      kind: 'invalid_bundle_amount',
      retryable: false,
      userMessage: 'Invalid transaction amount.',
      alertOps: false,
    }
  }

  // 4. Validation errors
  if (['0002', '0008', '0012', '0013'].includes(code)) {
    return {
      kind: 'validation',
      retryable: false,
      userMessage: 'Please check your details or amount.',
      alertOps: false,
    }
  }

  // 5. Config / Integration errors (IP, Client, Vendor) -> Page on-call
  if (['0003', '0004', '0005', '0007', '0010', '0015', '0016', '0017', '0018', '0026', '0027', '0028'].includes(code)) {
    return {
      kind: 'integration_error',
      retryable: false,
      userMessage: 'Payment is temporarily unavailable. Please try another method.',
      alertOps: true,
    }
  }

  // 6. Blocked user/account/card
  if (['0011', '0019', '0020', '0021', '0022', '0023'].includes(code)) {
    return {
      kind: 'blocked',
      retryable: false,
      userMessage: "We couldn't process this payment. Please use another method or contact support.",
      alertOps: false,
    }
  }

  // 7. Daily limits
  if (['0024', '0025'].includes(code)) {
    return {
      kind: 'limit_reached',
      retryable: false,
      userMessage: 'Daily transaction limit reached. Please try again tomorrow or use another method.',
      alertOps: false,
    }
  }

  // 8. Issuer decline (0031)
  if (code === '0031') {
    return {
      kind: 'issuer_decline',
      retryable: false,
      userMessage: message || 'Transaction declined by your issuing bank. Please check your card or try another.',
      alertOps: false,
    }
  }

  // 9. Vendor / OTP failure (9900)
  if (code === '9900') {
    return {
      kind: 'vendor_failure',
      retryable: true,
      userMessage: "The bank/wallet didn't confirm. Please try again.",
      alertOps: false,
    }
  }

  // Default fallback for unknown codes
  return {
    kind: 'unknown_error',
    retryable: false,
    userMessage: message || 'Payment processing failed. Please try again or choose another method.',
    alertOps: true,
  }
}
