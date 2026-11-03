import test from 'node:test'
import assert from 'node:assert/strict'
import { normaliseCnic } from '../payouts/swich/ibft.js'
import { normalisePayoutMsisdn } from '../payouts/swich/title.js'
import { getBankByCode, isValidBankCode } from '../payouts/banks.js'

test('Payout input validation utilities', async (t) => {
  await t.test('normaliseCnic validates and normalises 13-digit Pakistani CNIC', () => {
    assert.equal(normaliseCnic('12345-1234567-1'), '1234512345671')
    assert.equal(normaliseCnic('12345 1234567 1'), '1234512345671')
    assert.equal(normaliseCnic('1234512345671'), '1234512345671')

    // Invalid lengths or characters
    assert.equal(normaliseCnic('123451234567'), null) // 12 digits
    assert.equal(normaliseCnic('12345123456711'), null) // 14 digits
    assert.equal(normaliseCnic(''), null)
    assert.equal(normaliseCnic(null), null)
  })

  await t.test('normalisePayoutMsisdn normalises Pakistani mobile numbers to 03xxxxxxxxx', () => {
    assert.equal(normalisePayoutMsisdn('03001234567'), '03001234567')
    assert.equal(normalisePayoutMsisdn('923001234567'), '03001234567')
    assert.equal(normalisePayoutMsisdn('+923001234567'), '03001234567')
    assert.equal(normalisePayoutMsisdn('3001234567'), '03001234567')

    // Invalid phone formats
    assert.equal(normalisePayoutMsisdn('02131234567'), null) // Landline
    assert.equal(normalisePayoutMsisdn('12345'), null)
    assert.equal(normalisePayoutMsisdn(''), null)
    assert.equal(normalisePayoutMsisdn(null), null)
  })

  await t.test('bank directory provides authentic routing codes', () => {
    assert.equal(isValidBankCode('0033'), true) // Meezan
    assert.equal(isValidBankCode('0085'), true) // Easypaisa
    assert.equal(isValidBankCode('9999'), false) // Invalid code

    const meezan = getBankByCode('0033')
    assert.equal(meezan.shortName, 'Meezan')
    assert.equal(meezan.name, 'Meezan Bank Limited')
  })
})
