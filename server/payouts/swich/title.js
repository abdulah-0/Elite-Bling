import { payoutFetch } from './client.js'
import { logger } from '../logger.js'

/**
 * Normalises Pakistani MSISDN to 03xxxxxxxxx format.
 */
export function normalisePayoutMsisdn(raw) {
  if (!raw || typeof raw !== 'string') return null
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('923') && digits.length === 12) {
    return `0${digits.slice(2)}`
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return digits
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return `0${digits}`
  }
  return null
}

/**
 * Calls Swich Fetch Account Title API.
 * Endpoint: GET /gateway/payout/transaction/fetch/title
 * Query parameters preserve exact documented casing.
 */
export async function fetchAccountTitle(config, {
  bankCode,
  bankName,
  msisdn,
  amount,
  accountNumber,
  countryCode = '92',
}) {
  if (!bankCode) throw new Error('BankCode is required')
  if (!bankName) throw new Error('BankName is required')
  if (!accountNumber) throw new Error('AccountNumber is required')

  const cleanPhone = normalisePayoutMsisdn(msisdn)
  if (!cleanPhone) {
    throw new Error('Valid Pakistani mobile number (03xxxxxxxxx) is required')
  }

  const numAmount = Number(amount)
  if (!numAmount || numAmount <= 0) {
    throw new Error('Valid amount greater than zero is required')
  }

  const cleanAccount = String(accountNumber).trim()

  const params = new URLSearchParams()
  params.set('BankCode', String(bankCode).trim())
  params.set('BankName', String(bankName).trim())
  params.set('MSISDN', cleanPhone)
  params.set('Amount', String(numAmount))
  params.set('AccountNumber', cleanAccount)
  params.set('countryCode', String(countryCode))

  const endpoint = `/gateway/payout/transaction/fetch/title?${params.toString()}`

  try {
    const res = await payoutFetch(endpoint, { method: 'GET' }, config)

    const accountTitle = res?.data?.accountTitleTo?.trim() || ''
    const isSuccess = (res?.code === '0000' || res?.status === 'success') && Boolean(accountTitle)

    return {
      success: isSuccess,
      accountTitle,
      stan: res?.data?.stan || null,
      responseCode: res?.data?.responseCode || null,
      code: res?.code != null ? String(res.code) : null,
      status: res?.status || null,
      message: res?.message || (isSuccess ? 'Title fetched successfully' : 'Account title empty or not verified'),
      raw: res,
    }
  } catch (err) {
    logger.error('Fetch account title failed', {
      bankCode,
      error: err.message,
      code: err.code,
    })
    return {
      success: false,
      accountTitle: '',
      stan: null,
      responseCode: null,
      code: err.code || 'FETCH_TITLE_ERROR',
      status: 'failed',
      message: err.message || 'Failed to fetch account title',
      raw: err.data || null,
    }
  }
}
