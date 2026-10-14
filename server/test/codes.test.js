import test from 'node:test'
import assert from 'node:assert/strict'
import { mapResponseCode } from '../payments/swich/codes.js'

test('codes module', async (t) => {
  await t.test('handles success codes', () => {
    const res1 = mapResponseCode('inquire', '0000', 'Success')
    assert.equal(res1.kind, 'success')
    assert.equal(res1.retryable, false)

    const res2 = mapResponseCode('inquire', 0, 'Success')
    assert.equal(res2.kind, 'success')
  })

  await t.test('handles duplicate transaction ID code 0001', () => {
    const res = mapResponseCode('initiate', '0001', 'Duplicate')
    assert.equal(res.kind, 'duplicate')
    assert.equal(res.retryable, true)
  })

  await t.test('handles overlapping code 0009 correctly based on endpoint', () => {
    const refundRes = mapResponseCode('refund', '0009', 'invalid for refund')
    assert.equal(refundRes.kind, 'not_refundable')
    assert.equal(refundRes.alertOps, false)

    const systemRes = mapResponseCode('inquire', '0009', 'SYSTEM_ERROR')
    assert.equal(systemRes.kind, 'system_error')
    assert.equal(systemRes.alertOps, true)
  })

  await t.test('handles overlapping code 0014 correctly based on endpoint', () => {
    const refundRes = mapResponseCode('refund', '0014', 'exceeds refund limit')
    assert.equal(refundRes.kind, 'refund_exceeds_amount')

    const bundleRes = mapResponseCode('purchase', '0014', 'INVALID_BUNDLE_AMOUNT')
    assert.equal(bundleRes.kind, 'invalid_bundle_amount')
  })

  await t.test('handles issuer decline 0031 and vendor failure 9900', () => {
    const decline = mapResponseCode('purchase', '0031', 'Insufficient balance')
    assert.equal(decline.kind, 'issuer_decline')
    assert.equal(decline.retryable, false)

    const vendorFail = mapResponseCode('purchase', '9900', 'OTP failed')
    assert.equal(vendorFail.kind, 'vendor_failure')
    assert.equal(vendorFail.retryable, true)
  })
})
