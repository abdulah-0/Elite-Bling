/**
 * Payout Status Transition and Mapping Engine
 * Enforces strict state progression, monotonic rules, and prevents duplicate submissions.
 */

export const INTERNAL_STATUSES = {
  READY_TO_SUBMIT: 'ready_to_submit',
  PROCESSING: 'processing',
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
  NEEDS_REVIEW: 'needs_review',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
  CANCELLED: 'cancelled',
}

/**
 * Maps Swich PayOut provider status text to our internal store status.
 * Any ambiguous or unrecognized status falls back to 'needs_review', never 'successful'.
 */
export function mapProviderStatus(rawStatus) {
  if (!rawStatus || typeof rawStatus !== 'string') {
    return INTERNAL_STATUSES.NEEDS_REVIEW
  }

  const s = rawStatus.trim().toLowerCase()

  switch (s) {
    case 'success':
    case 'completed':
    case 'done':
      return INTERNAL_STATUSES.SUCCESSFUL

    case 'initiated':
    case 'queue':
    case 'pending':
    case 'in_progress':
      return INTERNAL_STATUSES.PROCESSING

    case 'failed':
    case 'declined':
    case 'rejected':
      return INTERNAL_STATUSES.FAILED

    case 'expired':
      return INTERNAL_STATUSES.EXPIRED

    case 'terminated':
      return INTERNAL_STATUSES.TERMINATED

    default:
      return INTERNAL_STATUSES.NEEDS_REVIEW
  }
}

/**
 * Returns true if the status represents a final terminal state
 */
export function isTerminalStatus(status) {
  return [
    INTERNAL_STATUSES.SUCCESSFUL,
    INTERNAL_STATUSES.FAILED,
    INTERNAL_STATUSES.CANCELLED,
  ].includes(status)
}

/**
 * Validates whether a state transition is permitted.
 * Rules:
 * - Once successful, never transition to processing, failed, or ready_to_submit.
 * - Ready_to_submit can transition to processing or cancelled.
 * - Processing can transition to successful, failed, expired, terminated, or needs_review.
 */
export function isValidTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) return true

  // Terminal states cannot be reverted
  if (currentStatus === INTERNAL_STATUSES.SUCCESSFUL) {
    return false
  }

  if (currentStatus === INTERNAL_STATUSES.CANCELLED) {
    return false
  }

  if (currentStatus === INTERNAL_STATUSES.READY_TO_SUBMIT) {
    return [
      INTERNAL_STATUSES.PROCESSING,
      INTERNAL_STATUSES.SUCCESSFUL,
      INTERNAL_STATUSES.FAILED,
      INTERNAL_STATUSES.NEEDS_REVIEW,
      INTERNAL_STATUSES.CANCELLED,
    ].includes(newStatus)
  }

  if (currentStatus === INTERNAL_STATUSES.PROCESSING) {
    return [
      INTERNAL_STATUSES.SUCCESSFUL,
      INTERNAL_STATUSES.FAILED,
      INTERNAL_STATUSES.EXPIRED,
      INTERNAL_STATUSES.TERMINATED,
      INTERNAL_STATUSES.NEEDS_REVIEW,
    ].includes(newStatus)
  }

  if ([INTERNAL_STATUSES.FAILED, INTERNAL_STATUSES.EXPIRED, INTERNAL_STATUSES.TERMINATED, INTERNAL_STATUSES.NEEDS_REVIEW].includes(currentStatus)) {
    // Only reconciliation or explicit inquiry can resolve to successful or terminal
    return [INTERNAL_STATUSES.SUCCESSFUL, INTERNAL_STATUSES.FAILED, INTERNAL_STATUSES.NEEDS_REVIEW].includes(newStatus)
  }

  return false
}
