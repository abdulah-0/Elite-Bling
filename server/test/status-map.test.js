import test from 'node:test'
import assert from 'node:assert/strict'
import { mapSwichStatus, isTerminalStatus } from '../payments/swich/status-map.js'

test('status-map module', async (t) => {
  await t.test('maps all PRD §7.8 status values correctly with case and whitespace insensitivity', () => {
    assert.equal(mapSwichStatus('pending'), 'pending')
    assert.equal(mapSwichStatus('PENDING'), 'pending')
    assert.equal(mapSwichStatus(' queue '), 'pending')
    assert.equal(mapSwichStatus('otp send'), 'pending')
    assert.equal(mapSwichStatus('success'), 'paid')
    assert.equal(mapSwichStatus('SUCCESS'), 'paid')
    assert.equal(mapSwichStatus('failed'), 'failed')
    assert.equal(mapSwichStatus('block'), 'failed')
    assert.equal(mapSwichStatus('terminated'), 'failed')
    assert.equal(mapSwichStatus('block/expired'), 'expired')
    assert.equal(mapSwichStatus('expired'), 'expired')
    assert.equal(mapSwichStatus('dispute'), 'disputed')
    assert.equal(mapSwichStatus('refund'), 'refunded')
    assert.equal(mapSwichStatus('partial refund'), 'partially_refunded')
  })

  await t.test('handles unknown or empty status values safely', () => {
    assert.equal(mapSwichStatus('unknown_status_xyz'), null)
    assert.equal(mapSwichStatus(''), null)
    assert.equal(mapSwichStatus(null), null)
    assert.equal(mapSwichStatus(undefined), null)
  })

  await t.test('isTerminalStatus identifies terminal vs in-flight statuses', () => {
    assert.equal(isTerminalStatus('paid'), true)
    assert.equal(isTerminalStatus('failed'), true)
    assert.equal(isTerminalStatus('expired'), true)
    assert.equal(isTerminalStatus('refunded'), true)
    assert.equal(isTerminalStatus('pending'), false)
    assert.equal(isTerminalStatus('initiated'), false)
    assert.equal(isTerminalStatus('redirected'), false)
  })
})
