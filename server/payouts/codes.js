/**
 * Swich PayOut Response Code Catalog and Action Registry
 * Reference: Implementation Plan §2.7 & §10
 */

export const PROVIDER_CODES = {
  '0000': {
    meaning: 'Payment completed',
    adminMessage: 'Payout completed successfully.',
    action: 'Confirm and reconcile.',
    category: 'success',
  },
  '0001': {
    meaning: 'Customer Transaction Id duplicated',
    adminMessage: 'Duplicate transaction ID detected by Swich.',
    action: 'Inquire original reference; do not submit a new payout.',
    category: 'duplicate',
  },
  '0002': {
    meaning: 'Invalid/missing Parameter',
    adminMessage: 'Invalid or missing request parameter.',
    action: 'Verify recipient parameters and correct request.',
    category: 'client_error',
  },
  '0003': {
    meaning: 'Invalid IP Address',
    adminMessage: 'Server outbound IP address is not whitelisted at Swich.',
    action: 'Contact Swich operations to register the production server IP.',
    category: 'network_whitelist',
  },
  '0004': {
    meaning: 'Invalid client Id',
    adminMessage: 'Authentication credentials rejected by Swich.',
    action: 'Check SWICH_PAYOUT_CLIENT_ID configuration.',
    category: 'auth_error',
  },
  '0005': {
    meaning: 'Merchant account expired/invalid/deactivated',
    adminMessage: 'Merchant account is inactive or expired at Swich.',
    action: 'Contact Swich account manager to reactivate.',
    category: 'account_error',
  },
  '0006': {
    meaning: 'Low Balance',
    adminMessage: 'Insufficient merchant balance in Swich PayOut wallet.',
    action: 'Top up Swich disbursement wallet balance.',
    category: 'balance_error',
  },
  '0007': {
    meaning: 'Not Found',
    adminMessage: 'Transaction record not found by Swich.',
    action: 'Verify CustomerTransactionId and inquiry timing.',
    category: 'not_found',
  },
  '0008': {
    meaning: 'Bad Request',
    adminMessage: 'Malformed request rejected by Swich.',
    action: 'Review request structure and field formatting.',
    category: 'client_error',
  },
  '0009': {
    meaning: 'Internal Server Error',
    adminMessage: 'Swich internal service error occurred.',
    action: 'Perform inquiry to check if transfer was recorded before retrying.',
    category: 'provider_error',
  },
  '0010': {
    meaning: 'Invalid/Not Allowed Channel',
    adminMessage: 'Target bank or wallet channel is not enabled for merchant.',
    action: 'Verify bank routing code with Swich channel list.',
    category: 'channel_error',
  },
  '0011': {
    meaning: 'CNIC blocked by State Bank of Pakistan',
    adminMessage: 'Recipient CNIC is restricted by the State Bank of Pakistan.',
    action: 'Do not retry; follow regulatory compliance procedures.',
    category: 'compliance_blocked',
  },
  '0012': {
    meaning: 'Minimum amount not allowed',
    adminMessage: 'Payout amount is below the minimum allowed limit.',
    action: 'Increase payout amount to meet Swich minimum threshold.',
    category: 'amount_limit',
  },
  '0013': {
    meaning: 'Maximum amount not allowed',
    adminMessage: 'Payout amount exceeds the maximum per-transaction limit.',
    action: 'Split payout or request limit increase from Swich.',
    category: 'amount_limit',
  },
  '0014': {
    meaning: 'Amount not found in bundle',
    adminMessage: 'Payout amount not permitted within configured merchant bundle.',
    action: 'Verify merchant bundle specifications with Swich.',
    category: 'amount_limit',
  },
  '2002': {
    meaning: 'Service to merchant not allowed',
    adminMessage: 'PayOut service has not been activated on this merchant account.',
    action: 'Request PayOut API activation from Swich support.',
    category: 'permission_error',
  },
  '2007': {
    meaning: 'Account title not fetched',
    adminMessage: 'Recipient account title verification failed or was not completed.',
    action: 'Fetch account title first and verify recipient name.',
    category: 'title_error',
  },
  '2011': {
    meaning: 'Channel disabled',
    adminMessage: 'The selected bank/wallet channel is currently disabled.',
    action: 'Choose an alternate bank or await channel restoration.',
    category: 'channel_error',
  },
  '2012': {
    meaning: 'Channel to merchant not allowed',
    adminMessage: 'The selected channel is not authorized for this merchant profile.',
    action: 'Contact Swich to enable this bank channel.',
    category: 'channel_error',
  },
  '2013': {
    meaning: 'Per-day transaction limit exceeded',
    adminMessage: 'Merchant daily payout limit has been reached.',
    action: 'Wait for next settlement day or request limit increase.',
    category: 'limit_exceeded',
  },
  '2014': {
    meaning: 'Customer per-transaction amount limit exceeded',
    adminMessage: 'Recipient account daily/monthly receiving limit exceeded.',
    action: 'Notify recipient to use an alternate bank account.',
    category: 'recipient_limit',
  },
  '5015': {
    meaning: 'Transaction timeout',
    adminMessage: 'Provider timeout during IBFT processing.',
    action: 'Outcome is unknown. Inquire with CustomerTransactionId; DO NOT retry IBFT.',
    category: 'timeout',
  },
  '5016': {
    meaning: 'Duplicate transaction ID',
    adminMessage: 'Duplicate transaction reference rejected by 1Link/Swich.',
    action: 'Investigate transaction status via inquiry.',
    category: 'duplicate',
  },
  '9900': {
    meaning: 'Transaction failed',
    adminMessage: 'IBFT transfer failed at banking network.',
    action: 'Check recipient account status and verify details.',
    category: 'bank_failure',
  },
}

/**
 * Returns diagnostic metadata and actionable message for a provider code.
 */
export function getProviderCodeInfo(code) {
  const c = String(code || '').trim()
  return (
    PROVIDER_CODES[c] || {
      meaning: 'Unrecognized provider code',
      adminMessage: `Provider responded with code ${c}. Review details.`,
      action: 'Inquire to establish definitive status.',
      category: 'unknown',
    }
  )
}
