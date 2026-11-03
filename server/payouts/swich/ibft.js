import { payoutFetch } from './client.js'
import { logger } from '../logger.js'
import { normalisePayoutMsisdn } from './title.js'

/**
 * Normalises Pakistani CNIC to 13 continuous digits without dashes or spaces.
 */
export function normaliseCnic(raw) {
  if (!raw || typeof raw !== 'string') return null
  const digits = raw.replace(/\D/g, '')
  return digits.length === 13 ? digits : null
}

/**
 * Executes a single-shot IBFT disbursement via Swich PayOut API.
 * Endpoint: POST /gateway/payout/transaction/ibft
 *
 * CRITICAL SAFETY RULE:
 * This function NEVER automatically retries on timeout or network disconnect.
 */
export async function executeIbftTransfer(config, {
  accountTitle,
  accountNumber,
  bankCode,
  bankName,
  customerTransactionId,
  name,
  cnic,
  msisdn,
  amount,
  currency = 'PKR',
  countryCode = '92',
}) {
  if (!customerTransactionId) throw new Error('customerTransactionId is required for IBFT')
  if (!accountTitle) throw new Error('accountTitle is required for IBFT')
  if (!accountNumber) throw new Error('accountNumber is required for IBFT')
  if (!bankCode || !bankName) throw new Error('bankCode and bankName are required for IBFT')

  const cleanCnic = normaliseCnic(cnic)
  if (!cleanCnic) throw new Error('CNIC must be exactly 13 numeric digits without dashes or spaces')

  const cleanPhone = normalisePayoutMsisdn(msisdn)
  if (!cleanPhone) throw new Error('Valid Pakistani mobile number (03xxxxxxxxx) is required')

  const numAmount = Number(amount)
  if (!numAmount || numAmount <= 0) throw new Error('Amount must be greater than zero')

  const payload = {
    accountTitle: String(accountTitle).trim(),
    accountNumber: String(accountNumber).trim(),
    bankCode: String(bankCode).trim(),
    bankName: String(bankName).trim(),
    customerTransactionId: String(customerTransactionId).trim(),
    name: String(name || accountTitle).trim(),
    cnic: cleanCnic,
    msisdn: cleanPhone,
    amount: numAmount,
    currency,
    countryCode,
  }

  logger.info('Executing Swich IBFT disbursement', {
    customerTransactionId,
    bankCode,
    amount: numAmount,
  })

  try {
    const res = await payoutFetch('/gateway/payout/transaction/ibft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, config)

    const code = res?.code != null ? String(res.code) : null
    const status = res?.status || null
    const isSuccess = code === '0000' || status === 'success'

    return {
      success: isSuccess,
      transactionId: res?.transactionId || null,
      code,
      status,
      message: res?.message || (isSuccess ? 'IBFT completed successfully' : 'IBFT transfer failed'),
      timestamp: res?.timestamp || new Date().toISOString(),
      raw: res,
      isTimeout: false,
    }
  } catch (err) {
    const isTimeout = Boolean(err.isTimeout || err.code === '5015')

    logger.error('IBFT execution error', {
      customerTransactionId,
      error: err.message,
      code: err.code,
      isTimeout,
    })

    return {
      success: false,
      transactionId: null,
      code: err.code || (isTimeout ? '5015' : 'IBFT_ERROR'),
      status: isTimeout ? 'timeout' : 'failed',
      message: err.message || 'IBFT transfer request failed',
      timestamp: new Date().toISOString(),
      raw: err.data || null,
      isTimeout,
    }
  }
}
