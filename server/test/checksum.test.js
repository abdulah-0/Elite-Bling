import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import {
  landingChecksum,
  callbackChecksum,
  safeEqualHex,
  verifyCallbackChecksum,
} from '../payments/swich/checksum.js'

test('checksum module', async (t) => {
  const secretKey = 'test_secret_key_12345'

  await t.test('landingChecksum computes correct HMAC-SHA256 hex', () => {
    const txnId = 'txn_987654321'
    const item = 'Order ORD1042'
    const amount = '1250.00'

    const expected = createHmac('sha256', secretKey)
      .update(`Swich:${txnId}:${item}:${amount}`, 'utf8')
      .digest('hex')
      .toLowerCase()

    const actual = landingChecksum(secretKey, txnId, item, amount)
    assert.equal(actual, expected)
    assert.equal(actual.length, 64)
  })

  await t.test('callbackChecksum computes correct HMAC-SHA256 hex', () => {
    const txnId = 'txn_987654321'
    const orderId = 'SW24106'
    const amount = '1250.00'
    const status = 'success'

    const expected = createHmac('sha256', secretKey)
      .update(`SWCallback:${txnId}:${orderId}:${amount}:${status}`, 'utf8')
      .digest('hex')
      .toLowerCase()

    const actual = callbackChecksum(secretKey, txnId, orderId, amount, status)
    assert.equal(actual, expected)
    assert.equal(actual.length, 64)
  })

  await t.test('safeEqualHex performs constant-time comparison', () => {
    const hex = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
    assert.equal(safeEqualHex(hex, hex), true)
    assert.equal(safeEqualHex(hex, hex.toUpperCase()), true)
    assert.equal(safeEqualHex(hex, 'a1b2c3d4e5f60718293a4b5c6d7e8f91'), false)
    assert.equal(safeEqualHex(hex, 'short'), false)
    assert.equal(safeEqualHex(hex, null), false)
  })

  await t.test('verifyCallbackChecksum validates authentic callback', () => {
    const txnId = 'txn_abc123'
    const orderId = 'SW999'
    const amount = '2500.00'
    const status = 'success'

    const validChecksum = callbackChecksum(secretKey, txnId, orderId, amount, status)

    const res = verifyCallbackChecksum(secretKey, {
      customerTransactionId: txnId,
      orderId,
      amount,
      status,
      checksum: validChecksum,
    })

    assert.equal(res.valid, true)
    assert.equal(res.matchedVariant, 'raw')
  })

  await t.test('verifyCallbackChecksum handles amount variants (e.g. 2500 vs 2500.00)', () => {
    const txnId = 'txn_abc123'
    const orderId = 'SW999'
    const status = 'success'

    // Swich computed checksum with "2500.00" but sent "2500" in callback query param
    const checksumWithFixed = callbackChecksum(secretKey, txnId, orderId, '2500.00', status)

    const res = verifyCallbackChecksum(secretKey, {
      customerTransactionId: txnId,
      orderId,
      amount: '2500',
      status,
      checksum: checksumWithFixed,
    })

    assert.equal(res.valid, true)
    assert.equal(res.matchedVariant, 'fixed_2')
  })

  await t.test('verifyCallbackChecksum rejects tampered checksum', () => {
    const txnId = 'txn_abc123'
    const orderId = 'SW999'
    const amount = '2500.00'
    const status = 'success'

    const tamperedChecksum = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

    const res = verifyCallbackChecksum(secretKey, {
      customerTransactionId: txnId,
      orderId,
      amount,
      status,
      checksum: tamperedChecksum,
    })

    assert.equal(res.valid, false)
  })
})
