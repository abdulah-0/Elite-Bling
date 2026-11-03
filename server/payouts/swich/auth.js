import { logger } from '../logger.js'

let cachedToken = null
let expiresAt = 0
let inFlightAuthPromise = null

/**
 * Resets cached bearer token (e.g. upon receiving a 401 from Swich)
 */
export function invalidatePayoutToken() {
  cachedToken = null
  expiresAt = 0
}

/**
 * Retrieves OAuth2 access token for Swich PayOut API.
 * Uses application/x-www-form-urlencoded format.
 * Caches token and refreshes 60 seconds before expiry.
 */
export async function getPayoutAccessToken(config, forceRefresh = false) {
  const now = Date.now()

  if (!forceRefresh && cachedToken && now < expiresAt - 60000) {
    return cachedToken
  }

  // Single-flight: reuse pending promise if one is already running
  if (inFlightAuthPromise) {
    return inFlightAuthPromise
  }

  inFlightAuthPromise = (async () => {
    try {
      if (!config.clientId || !config.clientSecret) {
        throw new Error('SWICH_CLIENT_ID and SWICH_CLIENT_SECRET are required for PayOut')
      }

      logger.info('Fetching Swich PayOut OAuth token', { authUrl: config.authUrl })

      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      })

      const res = await fetch(config.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!res.ok) {
        const errText = await res.text()
        logger.error('Swich PayOut auth failed', { status: res.status, error: errText })
        throw new Error(`Swich PayOut auth request failed (${res.status}): ${errText}`)
      }

      const data = await res.json()
      if (!data.access_token) {
        throw new Error('Swich PayOut auth response missing access_token')
      }

      cachedToken = data.access_token
      const ttlSeconds = typeof data.expires_in === 'number' ? data.expires_in : 3600
      expiresAt = Date.now() + ttlSeconds * 1000

      logger.info('Swich PayOut token acquired', { expiresIn: ttlSeconds })
      return cachedToken
    } finally {
      inFlightAuthPromise = null
    }
  })()

  return inFlightAuthPromise
}
