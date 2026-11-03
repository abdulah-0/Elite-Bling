import { Router } from 'express'
import { requireAdminAuth } from '../middleware/auth.js'
import { createPayoutRepository } from '../payouts/repository.js'
import { createPayoutService } from '../payouts/service.js'
import { getPayoutConfig } from '../payouts/config.js'
import { SUPPORTED_BANKS } from '../payouts/banks.js'
import { logger } from '../payouts/logger.js'

export function createPayoutRouter(supabase, customConfig = null) {
  const router = Router()
  const repository = createPayoutRepository(supabase)
  const service = createPayoutService(repository, customConfig)

  // Enforce server-side admin authentication on all payout endpoints
  router.use(requireAdminAuth(supabase))

  /**
   * GET /api/admin/payouts/config
   * Safe configuration metadata (no secrets exposed)
   */
  router.get('/config', (req, res) => {
    try {
      const config = customConfig || getPayoutConfig()
      res.json({
        enabled: config.enabled,
        env: config.env,
        minAmount: config.minAmount,
        maxAmount: config.maxAmount,
        whitelistedIpConfigured: Boolean(config.whitelistedIp),
        whitelistedIp: config.whitelistedIp || null,
        credentialsConfigured: Boolean(config.clientId && config.clientSecret),
      })
    } catch (err) {
      res.status(500).json({ error: 'Failed to load payout configuration' })
    }
  })

  /**
   * GET /api/admin/payouts/banks
   * List of supported Pakistani banks and e-wallets
   */
  router.get('/banks', (req, res) => {
    res.json(SUPPORTED_BANKS)
  })

  /**
   * GET /api/admin/payouts/balance
   * Fetches current Swich balance
   */
  router.get('/balance', async (req, res) => {
    try {
      const balanceData = await service.getBalance()
      res.json(balanceData)
    } catch (err) {
      logger.error('Route balance error', { error: err.message })
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch balance' })
    }
  })

  /**
   * GET /api/admin/payouts/balance/history
   * Balance snapshots
   */
  router.get('/balance/history', async (req, res) => {
    try {
      const history = await service.getBalanceHistory()
      res.json(history)
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch balance history' })
    }
  })

  /**
   * POST /api/admin/payouts/validate-recipient
   * Step 1: Fetches and verifies recipient account title
   */
  router.post('/validate-recipient', async (req, res) => {
    try {
      const { bankCode, bankName, msisdn, amount, accountNumber } = req.body
      const result = await service.validateRecipient({
        bankCode,
        bankName,
        msisdn,
        amount,
        accountNumber,
        adminUser: req.adminUser,
      })
      res.json(result)
    } catch (err) {
      logger.error('Validate recipient error', { error: err.message, code: err.code })
      res.status(err.status || 400).json({
        error: err.message || 'Failed to verify account title',
        code: err.code || 'validation_failed',
      })
    }
  })

  /**
   * POST /api/admin/payouts
   * Step 2: Creates and submits payout with mandatory Idempotency-Key
   */
  router.post('/', async (req, res) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey
      const result = await service.createAndSubmitPayout({
        ...req.body,
        idempotencyKey,
        adminUser: req.adminUser,
      })
      res.status(result.isReplay ? 200 : 201).json(result)
    } catch (err) {
      logger.error('Payout initiation error', { error: err.message, code: err.code })
      res.status(err.status || 400).json({
        error: err.message || 'Payout submission failed',
        code: err.code || 'submission_failed',
      })
    }
  })

  /**
   * GET /api/admin/payouts
   * List payouts with search & filters
   */
  router.get('/', async (req, res) => {
    try {
      const { status, recipientType, search, page, limit } = req.query
      const result = await service.listPayouts({
        status,
        recipientType,
        search,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      })
      res.json(result)
    } catch (err) {
      res.status(500).json({ error: 'Failed to list payouts' })
    }
  })

  /**
   * GET /api/admin/payouts/:id
   * Detail view with status timeline and provider attempts
   */
  router.get('/:id', async (req, res) => {
    try {
      const detail = await service.getPayoutDetail(req.params.id)
      res.json(detail)
    } catch (err) {
      res.status(err.status || 404).json({ error: err.message || 'Payout not found' })
    }
  })

  /**
   * POST /api/admin/payouts/:id/inquire
   * Read-only transaction inquiry
   */
  router.post('/:id/inquire', async (req, res) => {
    try {
      const result = await service.inquirePayout({
        id: req.params.id,
        adminUser: req.adminUser,
      })
      res.json(result)
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Inquiry failed' })
    }
  })

  /**
   * POST /api/admin/payouts/:id/cancel
   * Cancel before submission
   */
  router.post('/:id/cancel', async (req, res) => {
    try {
      const result = await service.cancelPayout({
        id: req.params.id,
        adminUser: req.adminUser,
        reason: req.body.reason,
      })
      res.json(result)
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message || 'Cancel failed' })
    }
  })

  return router
}
