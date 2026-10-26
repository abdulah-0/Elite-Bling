import { Router } from 'express'
import { getSwichConfig } from '../payments/swich/config.js'
import {
  initiatePayment,
  handleCallback,
  getPaymentStatusByRef,
  reconcilePendingAttempts,
} from '../payments/swich/service.js'
import { logger } from '../payments/swich/logger.js'

export function createSwichRouter(supabase) {
  const router = Router()

  /**
   * GET /api/payments/swich/config
   * Public config for frontend checkout visibility and validation.
   */
  router.get('/config', (req, res) => {
    try {
      const config = getSwichConfig()
      res.json({
        enabled: config.enabled,
        minAmount: config.minAmount,
        maxAmount: config.maxAmount,
        env: config.env,
      })
    } catch (err) {
      res.status(500).json({ error: 'Failed to load payment configuration' })
    }
  })

  /**
   * POST /api/payments/swich/initiate
   * Initiates payment for an order and returns redirect target.
   */
  router.post('/initiate', async (req, res) => {
    try {
      const config = getSwichConfig()
      const { orderId } = req.body
      const user = req.user || null // Support optional authenticated user

      const result = await initiatePayment({
        orderId,
        user,
        supabase,
        config,
      })

      res.json(result)
    } catch (err) {
      logger.error('Payment initiation error', { error: err.message, code: err.code })
      res.status(err.status || 500).json({
        error: err.message || 'Payment initiation failed',
        code: err.code || 'initiation_failed',
      })
    }
  })

  /**
   * GET /api/payments/swich/callback
   * Swich webhook callback. Always answers 200 { status: 'success' } on authentic calls.
   */
  router.get('/callback', async (req, res) => {
    try {
      const config = getSwichConfig()
      const rawQuery = req.originalUrl.includes('?') ? req.originalUrl.split('?')[1] : ''

      const result = await handleCallback({
        query: req.query,
        rawQuery,
        supabase,
        config,
      })

      res.status(result.statusCode).json(result.body)
    } catch (err) {
      logger.error('Callback unexpected error', { error: err.message })
      res.status(500).json({ error: 'Internal callback handler error' })
    }
  })

  return router
}

export function createOrderRouter(supabase) {
  const router = Router()

  /**
   * GET /api/orders/:ref/payment-status
   * Safe public polling endpoint for return page.
   */
  router.get('/:ref/payment-status', async (req, res) => {
    try {
      const { ref } = req.params
      const config = getSwichConfig()
      const statusData = await getPaymentStatusByRef({ ref, supabase, config })
      res.json(statusData)
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch status' })
    }
  })

  return router
}

export function createCronRouter(supabase) {
  const router = Router()

  /**
   * GET/POST /api/cron/swich-reconcile
   * Cron job endpoint protected by CRON_SECRET.
   */
  const handleCron = async (req, res) => {
    try {
      const config = getSwichConfig()

      // Protect with CRON_SECRET if configured
      if (config.cronSecret) {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace(/^Bearer\s+/i, '')
        if (token !== config.cronSecret) {
          return res.status(401).json({ error: 'Unauthorized: invalid CRON_SECRET' })
        }
      }

      const summary = await reconcilePendingAttempts({ supabase, config })
      res.json({ ok: true, ...summary })
    } catch (err) {
      logger.error('Cron reconciliation error', { error: err.message })
      res.status(500).json({ error: err.message })
    }
  }

  router.get('/swich-reconcile', handleCron)
  router.post('/swich-reconcile', handleCron)

  return router
}
