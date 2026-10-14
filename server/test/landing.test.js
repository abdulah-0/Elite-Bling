import test from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitiseItem,
  normaliseMsisdn,
  buildLandingGetUrl,
} from '../payments/swich/landing.js'
import { landingChecksum } from '../payments/swich/checksum.js'

test('landing module', async (t) => {
  await t.test('sanitiseItem removes special characters and restricts length', () => {
    assert.equal(sanitiseItem('Order #123! @ special & chars'), 'Order 123 special chars')
    assert.equal(sanitiseItem('  spaces   everywhere  '), 'spaces everywhere')
    assert.equal(sanitiseItem(''), 'Order')
    assert.equal(sanitiseItem(null), 'Order')

    const longItem = 'A'.repeat(600)
    assert.equal(sanitiseItem(longItem).length, 500)
  })

  await t.test('normaliseMsisdn normalises valid Pakistani numbers', () => {
    assert.equal(normaliseMsisdn('+923451234567'), '03451234567')
    assert.equal(normaliseMsisdn('923451234567'), '03451234567')
    assert.equal(normaliseMsisdn('03451234567'), '03451234567')
    assert.equal(normaliseMsisdn('3451234567'), '03451234567')

    // Invalid formats
    assert.equal(normaliseMsisdn('12345'), null)
    assert.equal(normaliseMsisdn('+14155552671'), null)
    assert.equal(normaliseMsisdn('04235889900'), null) // PTCL landline, not mobile
    assert.equal(normaliseMsisdn(''), null)
  })

  await t.test('buildLandingGetUrl generates valid URL with raw checksum', () => {
    const config = {
      clientId: 'test_client_id',
      secretKey: 'test_secret_key',
      pwaGetUrl: 'https://sandbox-payin-pwa.swichnow.com/',
      siteUrl: 'https://store.example',
    }

    const params = {
      customerTransactionId: 'txn_0123456789abcdef0123456789',
      orderNumber: 'ORD-101',
      amount: 1450,
      payeeName: 'Ahmed Khan',
      email: 'ahmed@example.com',
      phone: '+923001234567',
      publicPaymentRef: 'pref_123456',
    }

    const urlStr = buildLandingGetUrl(config, params)
    const parsed = new URL(urlStr)

    assert.equal(parsed.origin, 'https://sandbox-payin-pwa.swichnow.com')
    assert.equal(parsed.searchParams.get('clientId'), 'test_client_id')
    assert.equal(parsed.searchParams.get('customerTransactionId'), 'txn_0123456789abcdef0123456789')
    assert.equal(parsed.searchParams.get('amount'), '1450.00')
    assert.equal(parsed.searchParams.get('item'), 'Order ORD 101')
    assert.equal(parsed.searchParams.get('MSISDN'), '03001234567')
    assert.equal(parsed.searchParams.get('currency'), 'PKR')

    // Checksum verified
    const expectedChecksum = landingChecksum(
      config.secretKey,
      params.customerTransactionId,
      'Order ORD 101',
      '1450.00'
    )
    assert.equal(parsed.searchParams.get('checksum'), expectedChecksum)

    // Redirect URL verified
    assert.equal(
      parsed.searchParams.get('successRedirectUrl'),
      'https://store.example/checkout/payment-return?ref=pref_123456'
    )
  })
})
