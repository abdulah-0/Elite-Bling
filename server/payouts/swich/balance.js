import { payoutFetch } from './client.js'
import { logger } from '../logger.js'

/**
 * Fetches merchant PayOut balance from Swich.
 * Endpoint: GET /gateway/payout/balance
 * Returns: { balance, currency, dayEndBalance, totalCommission, dailyCommission, status, statusText }
 */
export async function fetchPayoutBalance(config) {
  try {
    const res = await payoutFetch('/gateway/payout/balance', { method: 'GET' }, config)

    logger.info('Swich PayOut balance fetched', {
      balance: res?.balance,
      currency: res?.currency,
    })

    const balance = res?.balance != null ? Number(res.balance) : 0
    const currency = res?.currency || 'PKR'
    const dayEndBalance = res?.dayEndBalance != null ? Number(res.dayEndBalance) : null
    const totalCommission = res?.totalCommission != null ? Number(res.totalCommission) : null
    const dailyCommission = res?.dailyCommission != null ? Number(res.dailyCommission) : null

    return {
      success: true,
      balance,
      currency,
      dayEndBalance,
      totalCommission,
      dailyCommission,
      providerStatus: res?.status || res?.statusText || 'success',
      fetchedAt: new Date().toISOString(),
      raw: res,
    }
  } catch (err) {
    logger.error('Swich PayOut balance request failed', { error: err.message })
    return {
      success: false,
      balance: null,
      currency: 'PKR',
      dayEndBalance: null,
      totalCommission: null,
      dailyCommission: null,
      providerStatus: 'error',
      fetchedAt: new Date().toISOString(),
      error: err.message,
    }
  }
}
