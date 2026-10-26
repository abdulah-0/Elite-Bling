import { swichFetch } from './http.js'
import { logger } from './logger.js'
import { normaliseMsisdn } from './landing.js'

/**
 * Initiates direct Biller (1Bill) payment via Swich PayIn API.
 * Endpoint: POST /gateway/payin/v2.0/purchase/biller
 *
 * @param {object} config - Swich configuration
 * @param {object} params - Purchase parameters
 * @returns {Promise<object>}
 */
export async function initiateBillerPayment(config, {
  customerTransactionId,
  item = 'Item_Order',
  amount,
  msisdn,
  cnic = '',
  email = '',
  billReferenceNo,
}) {
  if (!customerTransactionId) throw new Error('customerTransactionId is required')
  if (!amount || Number(amount) <= 0) throw new Error('Valid amount is required')
  if (!billReferenceNo) throw new Error('billReferenceNo is required')

  const normalisedPhone = normaliseMsisdn(msisdn)
  if (!normalisedPhone) {
    throw new Error('Valid Pakistani mobile number (03xxxxxxxxx) is required')
  }

  // Ensure item is clean string
  const cleanItem = String(item).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 500) || 'Item_Order'

  const payload = {
    customerTransactionId,
    categoryId: 3, // Biller category
    channelId: 11, // 1Bill channel
    item: cleanItem,
    amount: Number(amount),
    msisdn: normalisedPhone,
    cnic: cnic || '',
    email: email || '',
    currency: 'PKR',
    billReferenceNo,
  }

  logger.info('Initiating Swich Biller payment', {
    customerTransactionId,
    billReferenceNo,
    amount: payload.amount,
  })

  try {
    const data = await swichFetch('/gateway/payin/v2.0/purchase/biller', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, config)

    logger.info('Swich Biller API response', {
      customerTransactionId,
      status: data?.status,
      code: data?.code,
      orderId: data?.orderId,
      consumerNumber: data?.consumerNumber,
    })

    const isSuccess = data?.code === '0000' || data?.status === 'success'

    return {
      success: isSuccess,
      code: data?.code != null ? String(data.code) : null,
      status: data?.status || null,
      message: data?.message || (isSuccess ? 'Transaction successful' : 'Biller purchase failed'),
      orderId: data?.orderId || null,
      swichOrderId: data?.orderId || null,
      consumerNumber: data?.consumerNumber || null,
      transactionId: data?.transactionId || null,
      billReferenceNo,
      raw: data,
    }
  } catch (err) {
    logger.error('Swich Biller purchase request failed', {
      customerTransactionId,
      error: err.message,
    })
    return {
      success: false,
      code: 'PURCHASE_ERROR',
      status: 'error',
      message: err.message || 'Payment initiation failed',
      orderId: null,
      swichOrderId: null,
      consumerNumber: null,
      transactionId: null,
      billReferenceNo,
      raw: null,
    }
  }
}
