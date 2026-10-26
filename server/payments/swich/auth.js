import { logger } from './logger.js'

let cachedToken = null
let expiresAt = 0
let inFlightAuthPromise = null

/**
 * Resets cached token (e.g. upon receiving a 401 from Swich API)
 */
export function invalidateToken() {
  cachedToken = null
  expiresAt = 0
}

/**
 * Retrieves OAuth2 access token from Swich.
 * Implements in-memory caching with single-flight concurrency lock.
 * Refreshes 60 seconds before expiration.
 * Reference: docs/implementation.prd.md §4.2 & §8.1
 */
export async function getAccessToken(config, forceRefresh = false) {
  const now = Date.now()

  if (!forceRefresh && cachedToken && now < expiresAt - 60000) {
    return cachedToken
  }

  // Single-flight: reuse pending promise if one is already in progress
  if (inFlightAuthPromise) {
    return inFlightAuthPromise
  }

  inFlightAuthPromise = (async () => {
    try {
      if (!config.clientId || !config.clientSecret) {
        throw new Error('SWICH_CLIENT_ID and SWICH_CLIENT_SECRET are required')
      }

      const authUrl = config.authUrl || (config.env === 'production' ? 'https://auth.swichnow.com/connect/token' : 'https://sandbox-auth.swichnow.com/connect/token')
      logger.info('Fetching Swich OAuth access token', { authUrl })

      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      })

      const res = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!res.ok) {
        const errText = await res.text()
        logger.error('Swich auth failed', { status: res.status, error: errText })
        throw new Error(`Swich auth request failed (${res.status}): ${errText}`)
      }

      const data = await res.json()
      if (!data.access_token) {
        throw new Error('Swich auth response missing access_token')
      }

      cachedToken = data.access_token
      const ttlSeconds = typeof data.expires_in === 'number' ? data.expires_in : 3600
      expiresAt = Date.now() + ttlSeconds * 1000

      logger.info('Swich OAuth token acquired successfully', { expiresIn: ttlSeconds })
      return cachedToken
    } finally {
      inFlightAuthPromise = null
    }
  })()

  return inFlightAuthPromise
}
