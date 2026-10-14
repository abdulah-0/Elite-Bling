import { swichFetch } from './http.js'
import { logger } from './logger.js'

/**
 * Inquires transaction details from Swich by customerTransactionId.
 * Reference: docs/implementation.prd.md §4.8 & §8.1
 *
 * @param {string} customerTransactionId
 * @param {object} config
 * @returns {Promise<object>}
 */
export async function inquireByCustomerTransactionId(customerTransactionId, config) {
  if (!customerTransactionId) {
    throw new Error('customerTransactionId is required for Inquire')
  }

  const endpoint = `/gateway/payin/v2.0/inquire?CustomerTransactionId=${encodeURIComponent(customerTransactionId)}`

  try {
    const data = await swichFetch(endpoint, { method: 'GET' }, config)
    logger.info('Swich Inquire response received', {
      customerTransactionId,
      status: data?.status,
      code: data?.code,
      txnStatus: data?.transaction?.transactionStatus,
      swichOrderId: data?.transaction?.orderId,
    })

    return {
      success: true,
      raw: data,
      transaction: data?.transaction || null,
      status: data?.status || null,
      code: data?.code != null ? String(data.code) : null,
      message: data?.message || null,
      transactionStatus: data?.transaction?.transactionStatus || null,
      swichOrderId: data?.transaction?.orderId || null,
      amount: data?.transaction?.amount != null ? Number(data.transaction.amount) : null,
    }
  } catch (err) {
    logger.error('Swich Inquire request failed', {
      customerTransactionId,
      error: err.message,
    })
    return {
      success: false,
      error: err.message,
      status: null,
      code: null,
      transaction: null,
      transactionStatus: null,
    }
  }
}
