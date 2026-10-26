import test from 'node:test'
import assert from 'node:assert/strict'
import { initiateBillerPayment } from '../payments/swich/biller.js'
import { generateBillReferenceNo } from '../payments/swich/landing.js'

test('biller module', async (t) => {
  const config = {
    enabled: true,
    env: 'sandbox',
    clientId: 'test_client_id',
    clientSecret: 'test_client_secret',
    apiBase: 'https://sandbox-api.swichnow.com',
    authUrl: 'https://sandbox-auth.swichnow.com/connect/token',
  }

  await t.test('generateBillReferenceNo generates PK + 14 digit timestamp + 4 digits', () => {
    const ref = generateBillReferenceNo()
    assert.match(ref, /^PK\d{18}$/)
    assert.equal(ref.length, 20)

    const existing = 'PK202610262055218069'
    assert.equal(generateBillReferenceNo(existing), existing)
  })

  await t.test('initiateBillerPayment validates required fields', async () => {
    await assert.rejects(
      () => initiateBillerPayment(config, { customerTransactionId: '', amount: 100, msisdn: '03001234567', billReferenceNo: 'PK123' }),
      /customerTransactionId is required/
    )

    await assert.rejects(
      () => initiateBillerPayment(config, { customerTransactionId: '123', amount: 0, msisdn: '03001234567', billReferenceNo: 'PK123' }),
      /Valid amount is required/
    )

    await assert.rejects(
      () => initiateBillerPayment(config, { customerTransactionId: '123', amount: 100, msisdn: 'invalid_phone', billReferenceNo: 'PK123' }),
      /Valid Pakistani mobile number/
    )

    await assert.rejects(
      () => initiateBillerPayment(config, { customerTransactionId: '123', amount: 100, msisdn: '03001234567', billReferenceNo: '' }),
      /billReferenceNo is required/
    )
  })
})
