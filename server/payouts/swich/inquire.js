import { payoutFetch } from './client.js'
import { logger } from '../logger.js'

/**
 * Inquires transaction details from Swich PayOut API.
 * Endpoint: GET /gateway/payout/transaction/inquire
 * Uses CustomerTransactionId as primary key, or TransactionId if available.
 */
export async function inquirePayoutTransaction(config, {
  customerTransactionId,
  transactionId,
  remoteIp,
}) {
  if (!customerTransactionId && !transactionId) {
    throw new Error('Either customerTransactionId or transactionId is required for payout inquiry')
  }

  const params = new URLSearchParams()
  if (customerTransactionId) {
    params.set('CustomerTransactionId', String(customerTransactionId).trim())
  }
  if (transactionId) {
    params.set('TransactionId', String(transactionId).trim())
  }
  if (remoteIp || config.whitelistedIp) {
    params.set('RemoteIP', String(remoteIp || config.whitelistedIp).trim())
  }

  const endpoint = `/gateway/payout/transaction/inquire?${params.toString()}`

  try {
    const res = await payoutFetch(endpoint, { method: 'GET' }, config)

    logger.info('Swich PayOut inquiry response received', {
      customerTransactionId,
      status: res?.status || res?.statusText,
      code: res?.code,
    })

    const code = res?.code != null ? String(res.code) : null
    const providerStatus = res?.statusText || res?.status || null

    return {
      success: true,
      transactionId: res?.id || res?.transactionId || null,
      customerTransactionId: res?.customerTransactionId || customerTransactionId,
      providerStatus,
      statusText: res?.statusText || providerStatus,
      code,
      message: res?.reason || res?.message || 'Inquiry completed',
      disbursementAmount: res?.disbursementAmount != null ? Number(res.disbursementAmount) : null,
      tax: res?.tax != null ? Number(res.tax) : null,
      raw: res,
    }
  } catch (err) {
    logger.error('Swich PayOut inquiry failed', {
      customerTransactionId,
      error: err.message,
    })
    return {
      success: false,
      transactionId: null,
      customerTransactionId,
      providerStatus: null,
      code: err.code || 'INQUIRY_ERROR',
      message: err.message || 'Inquiry failed',
      raw: err.data || null,
    }
  }
}
