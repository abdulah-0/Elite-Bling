import test from 'node:test'
import assert from 'node:assert/strict'
import {
  encryptSensitive,
  decryptSensitive,
  maskCnic,
  maskMsisdn,
  extractAccountLast4,
  maskAccountNumber,
  redactSensitiveData,
} from '../payouts/crypto.js'

test('Payout cryptographic and masking functions', async (t) => {
  await t.test('AES-256-GCM encryption and decryption round-trip correctly', () => {
    const secretCnic = '3520112345671'
    const encrypted = encryptSensitive(secretCnic)

    assert.notEqual(encrypted, secretCnic)
    assert.match(encrypted, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)

    const decrypted = decryptSensitive(encrypted)
    assert.equal(decrypted, secretCnic)
  })

  await t.test('masking functions format display safely without leaking details', () => {
    assert.equal(maskCnic('3520112345671'), '35201-XXXXXX7-1')
    assert.equal(maskMsisdn('03001234567'), '0300****567')
    assert.equal(extractAccountLast4('01234567891234'), '1234')
    assert.equal(maskAccountNumber('01234567891234'), '**********1234')
  })

  await t.test('redactSensitiveData recursively scrubs secrets and tokens from logs', () => {
    const rawPayload = {
      client_secret: 'super_secret_payout_key',
      access_token: 'bearer_token_xyz',
      cnic: '3520112345671',
      msisdn: '03001234567',
      accountNumber: '01234567891234',
      amount: 1500,
      nested: {
        token: 'secret_nested_token',
      },
    }

    const redacted = redactSensitiveData(rawPayload)

    assert.equal(redacted.client_secret, '[REDACTED_SECRET]')
    assert.equal(redacted.access_token, '[REDACTED_SECRET]')
    assert.equal(redacted.nested.token, '[REDACTED_SECRET]')
    assert.equal(redacted.cnic, '35201-XXXXXX7-1')
    assert.equal(redacted.msisdn, '0300****567')
    assert.equal(redacted.accountNumber, '**********1234')
    assert.equal(redacted.amount, 1500)
  })
})
