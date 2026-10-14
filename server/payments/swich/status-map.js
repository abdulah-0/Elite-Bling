/**
 * Maps Swich transaction status strings (callback Status / Inquire transactionStatus)
 * to internal payment_attempt_status.
 * Reference: docs/implementation.prd.md §7.8
 */

const STATUS_MAP = {
  'pending': 'pending',
  'queue': 'pending',
  'otp send': 'pending',
  'success': 'paid',
  'failed': 'failed',
  'block': 'failed',
  'terminated': 'failed',
  'block/expired': 'expired',
  'expired': 'expired',
  'dispute': 'disputed',
  'refund': 'refunded',
  'partial refund': 'partially_refunded',
}

/**
 * Normalises and maps a Swich status string.
 *
 * @param {string} swichStatus - Raw status string from Swich
 * @returns {string|null} internal payment_attempt_status or null if unrecognized
 */
export function mapSwichStatus(swichStatus) {
  if (!swichStatus || typeof swichStatus !== 'string') return null
  const cleaned = swichStatus.trim().toLowerCase()
  return STATUS_MAP[cleaned] ?? null
}

/**
 * Returns true if the status is a final/terminal state.
 */
export function isTerminalStatus(status) {
  return ['paid', 'failed', 'expired', 'refunded', 'partially_refunded', 'disputed'].includes(status)
}
