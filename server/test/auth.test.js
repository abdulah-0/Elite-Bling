import test from 'node:test'
import assert from 'node:assert/strict'
import { getAccessToken, invalidateToken } from '../payments/swich/auth.js'

test('auth module', async (t) => {
  invalidateToken()

  let fetchCount = 0
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  // Mock fetch
  globalThis.fetch = async (url, opts) => {
    fetchCount++
    assert.match(url, /connect\/token/)
    return {
      ok: true,
      status: 200,
      json: async () => ({
        access_token: `mock_token_${fetchCount}`,
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    }
  }

  const config = {
    clientId: 'client_123',
    clientSecret: 'secret_456',
    authUrl: 'https://sandbox-auth.swichnow.com/connect/token',
  }

  await t.test('single-flight and caching: concurrent calls only trigger one fetch', async () => {
    fetchCount = 0
    invalidateToken()

    const [token1, token2, token3] = await Promise.all([
      getAccessToken(config),
      getAccessToken(config),
      getAccessToken(config),
    ])

    assert.equal(fetchCount, 1)
    assert.equal(token1, 'mock_token_1')
    assert.equal(token2, 'mock_token_1')
    assert.equal(token3, 'mock_token_1')

    // Second sequential call reuses cached token
    const token4 = await getAccessToken(config)
    assert.equal(fetchCount, 1)
    assert.equal(token4, 'mock_token_1')
  })

  await t.test('invalidateToken forces refetch', async () => {
    invalidateToken()
    const token = await getAccessToken(config)
    assert.equal(fetchCount, 2)
    assert.equal(token, 'mock_token_2')
  })
})
