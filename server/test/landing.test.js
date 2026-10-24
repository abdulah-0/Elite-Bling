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
    assert.equal(sanitiseItem('Order #123! @ special & chars'), 'Order_123_special_chars')
    assert.equal(sanitiseItem('  spaces   everywhere  '), 'spaces_everywhere')
    assert.equal(sanitiseItem(''), 'Item_Order')
    assert.equal(sanitiseItem(null), 'Item_Order')

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

  await t.test('buildLandingGetUrl generates valid URL matching Swich PayIn live sample format', () => {
    const config = {
      clientId: '3ccd54a980b34628904bf1fb1a03e566',
      secretKey: 'test_secret_key',
      pwaGetUrl: 'https://payin-pwa.swichnow.com/',
      siteUrl: 'https://store.example',
    }

    const params = {
      customerTransactionId: '04321abb9646476fb5181b888ee91f22',
      orderNumber: '9245',
      billReferenceNo: 'PK202610231853109791',
      amount: 2,
      payeeName: 'Customer_4230',
      email: 'test1708@mail.com',
      phone: '03907331667',
      publicPaymentRef: 'pref_123456',
    }

    const urlStr = buildLandingGetUrl(config, params)
    const parsed = new URL(urlStr)

    assert.equal(parsed.origin, 'https://payin-pwa.swichnow.com')
    assert.equal(parsed.searchParams.get('clientid'), '3ccd54a980b34628904bf1fb1a03e566')
    assert.equal(parsed.searchParams.get('clientId'), '3ccd54a980b34628904bf1fb1a03e566')
    assert.equal(parsed.searchParams.get('customertransactionid'), '04321abb9646476fb5181b888ee91f22')
    assert.equal(parsed.searchParams.get('customerTransactionId'), '04321abb9646476fb5181b888ee91f22')
    assert.equal(parsed.searchParams.get('item'), 'Item_9245')
    assert.equal(parsed.searchParams.get('amount'), '2')
    assert.equal(parsed.searchParams.get('channel'), '0')
    assert.equal(parsed.searchParams.get('billReferenceNo'), 'PK202610231853109791')
    assert.equal(parsed.searchParams.get('transactionType'), null)
    assert.equal(parsed.searchParams.get('description'), 'Payment_9245')
    assert.equal(parsed.searchParams.get('PayeeName'), 'Customer_4230')
    assert.equal(parsed.searchParams.get('Email'), 'test1708@mail.com')
    assert.equal(parsed.searchParams.get('MSISDN'), '03907331667')
    assert.equal(parsed.searchParams.get('currency'), 'PKR')

    // Checksum verified with exact raw parameters
    const expectedChecksum = landingChecksum(
      config.secretKey,
      params.customerTransactionId,
      'Item_9245',
      '2'
    )
    assert.equal(parsed.searchParams.get('checksum'), expectedChecksum)
  })
})
