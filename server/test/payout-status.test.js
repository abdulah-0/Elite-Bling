import test from 'node:test'
import assert from 'node:assert/strict'
import {
  INTERNAL_STATUSES,
  mapProviderStatus,
  isTerminalStatus,
  isValidTransition,
} from '../payouts/status.js'
import { getProviderCodeInfo } from '../payouts/codes.js'

test('Payout status mapping and transition guards', async (t) => {
  await t.test('maps provider status strings to internal statuses', () => {
    assert.equal(mapProviderStatus('Success'), INTERNAL_STATUSES.SUCCESSFUL)
    assert.equal(mapProviderStatus('success'), INTERNAL_STATUSES.SUCCESSFUL)
    assert.equal(mapProviderStatus('Queue'), INTERNAL_STATUSES.PROCESSING)
    assert.equal(mapProviderStatus('Initiated'), INTERNAL_STATUSES.PROCESSING)
    assert.equal(mapProviderStatus('Failed'), INTERNAL_STATUSES.FAILED)
    assert.equal(mapProviderStatus('Expired'), INTERNAL_STATUSES.EXPIRED)
    assert.equal(mapProviderStatus('Terminated'), INTERNAL_STATUSES.TERMINATED)

    // Ambiguous/unrecognized statuses must become needs_review, never successful
    assert.equal(mapProviderStatus('Unknown_Provider_State'), INTERNAL_STATUSES.NEEDS_REVIEW)
    assert.equal(mapProviderStatus(''), INTERNAL_STATUSES.NEEDS_REVIEW)
    assert.equal(mapProviderStatus(null), INTERNAL_STATUSES.NEEDS_REVIEW)
  })

  await t.test('isTerminalStatus correctly flags terminal vs non-terminal states', () => {
    assert.equal(isTerminalStatus(INTERNAL_STATUSES.SUCCESSFUL), true)
    assert.equal(isTerminalStatus(INTERNAL_STATUSES.FAILED), true)
    assert.equal(isTerminalStatus(INTERNAL_STATUSES.CANCELLED), true)
    assert.equal(isTerminalStatus(INTERNAL_STATUSES.PROCESSING), false)
    assert.equal(isTerminalStatus(INTERNAL_STATUSES.READY_TO_SUBMIT), false)
    assert.equal(isTerminalStatus(INTERNAL_STATUSES.NEEDS_REVIEW), false)
  })

  await t.test('isValidTransition blocks illegal regressions from terminal success', () => {
    assert.equal(isValidTransition(INTERNAL_STATUSES.READY_TO_SUBMIT, INTERNAL_STATUSES.PROCESSING), true)
    assert.equal(isValidTransition(INTERNAL_STATUSES.PROCESSING, INTERNAL_STATUSES.SUCCESSFUL), true)
    assert.equal(isValidTransition(INTERNAL_STATUSES.PROCESSING, INTERNAL_STATUSES.NEEDS_REVIEW), true)

    // Cannot revert once successful
    assert.equal(isValidTransition(INTERNAL_STATUSES.SUCCESSFUL, INTERNAL_STATUSES.FAILED), false)
    assert.equal(isValidTransition(INTERNAL_STATUSES.SUCCESSFUL, INTERNAL_STATUSES.PROCESSING), false)
    assert.equal(isValidTransition(INTERNAL_STATUSES.SUCCESSFUL, INTERNAL_STATUSES.CANCELLED), false)
  })

  await t.test('provider code registry maps error categories accurately', () => {
    assert.equal(getProviderCodeInfo('0000').category, 'success')
    assert.equal(getProviderCodeInfo('0001').category, 'duplicate')
    assert.equal(getProviderCodeInfo('0003').category, 'network_whitelist')
    assert.equal(getProviderCodeInfo('0006').category, 'balance_error')
    assert.equal(getProviderCodeInfo('5015').category, 'timeout')
    assert.equal(getProviderCodeInfo('5016').category, 'duplicate')
  })
})
