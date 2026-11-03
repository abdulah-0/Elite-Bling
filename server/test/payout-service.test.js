import test from 'node:test'
import assert from 'node:assert/strict'
import { createPayoutService } from '../payouts/service.js'

test('Payout domain service integration logic', async (t) => {
  const mockConfig = {
    enabled: true,
    env: 'sandbox',
    clientId: 'test_client_id',
    clientSecret: 'test_client_secret_for_unit_tests_32b',
    apiBase: 'https://sandbox-api.swichnow.com',
    authUrl: 'https://sandbox-auth.swichnow.com/connect/token',
    whitelistedIp: '1.2.3.4',
    minAmount: 10,
    maxAmount: 500000,
  }

  // In-memory mock database
  const payoutsDb = new Map()
  const eventsDb = []
  const attemptsDb = []

  const mockRepo = {
    async findByIdempotencyKey(key) {
      for (const p of payoutsDb.values()) {
        if (p.idempotency_key === key) return p
      }
      return null
    },
    async findById(id) {
      return payoutsDb.get(id) || null
    },
    async createPayout(row) {
      const record = { id: `payout-${Date.now()}`, ...row }
      payoutsDb.set(record.id, record)
      return record
    },
    async updatePayout(id, updates) {
      const existing = payoutsDb.get(id)
      if (!existing) throw new Error('Not found')
      const updated = { ...existing, ...updates }
      payoutsDb.set(id, updated)
      return updated
    },
    async recordStatusEvent(event) {
      eventsDb.push(event)
    },
    async recordProviderAttempt(attempt) {
      attemptsDb.push(attempt)
    },
    async saveBalanceSnapshot() {},
    async getBalanceHistory() { return [] },
    async listPayouts() { return { payouts: Array.from(payoutsDb.values()), total: payoutsDb.size } },
    async getStatusEvents(id) { return eventsDb.filter((e) => e.payoutId === id) },
    async getProviderAttempts(id) { return attemptsDb.filter((a) => a.payoutId === id) },
  }

  const service = createPayoutService(mockRepo, mockConfig)

  await t.test('fails closed when SWICH_PAYOUTS_ENABLED is false', async () => {
    const disabledService = createPayoutService(mockRepo, { ...mockConfig, enabled: false })
    await assert.rejects(
      () => disabledService.createAndSubmitPayout({
        idempotencyKey: 'idemp-1',
        amount: 500,
      }),
      (err) => err.status === 503 && err.code === 'payouts_disabled'
    )
  })

  await t.test('rejects payout submission with missing or tampered title verification', async () => {
    await assert.rejects(
      () => service.createAndSubmitPayout({
        recipientType: 'custom',
        recipientName: 'Test Recipient',
        cnic: '3520112345671',
        msisdn: '03001234567',
        bankCode: '0033',
        bankName: 'Meezan Bank Limited',
        accountNumber: '01234567891234',
        amount: 2500,
        accountTitle: 'Test Recipient',
        titleVerificationReference: 'invalid-or-forged-ref',
        idempotencyKey: 'idemp-tamper',
      }),
      (err) => err.code === 'invalid_title_verification'
    )
  })

  await t.test('idempotency key returns existing payout without re-submitting transfer', async () => {
    const existingPayout = {
      id: 'existing-payout-123',
      idempotency_key: 'idemp-duplicate',
      customer_transaction_id: 'PO_12345_abc',
      internal_status: 'successful',
      amount: 1000,
    }
    payoutsDb.set(existingPayout.id, existingPayout)

    const result = await service.createAndSubmitPayout({
      idempotencyKey: 'idemp-duplicate',
      amount: 1000,
    })

    assert.equal(result.isReplay, true)
    assert.equal(result.id, 'existing-payout-123')
    assert.equal(result.internal_status, 'successful')
  })
})
