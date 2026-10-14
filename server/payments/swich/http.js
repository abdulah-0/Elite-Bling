import { getAccessToken, invalidateToken } from './auth.js'
import { logger } from './logger.js'

/**
 * HTTP client for Swich PayIn API calls
 * Features: 15s timeout, Bearer token injection, GET-only retries, 401 auto-refresh, logging
 * Reference: docs/implementation.prd.md §8.1
 */
export async function swichFetch(pathOrUrl, options = {}, config) {
  const method = (options.method || 'GET').toUpperCase()
  const isGet = method === 'GET'
  const maxRetries = isGet ? 2 : 0

  const apiBase = config?.apiBase || 'https://sandbox-api.swichnow.com'
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${apiBase.replace(/\/$/, '')}${pathOrUrl}`

  let attempt = 0
  let hasRefetchedTokenOn401 = false

  while (attempt <= maxRetries) {
    attempt++
    const token = await getAccessToken(config)

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      logger.info(`Swich API request [${method}]`, { url, attempt })

      const res = await fetch(url, {
        ...options,
        method,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 401: invalidate token and retry once
      if (res.status === 401 && !hasRefetchedTokenOn401) {
        logger.warn('Received 401 from Swich API. Invalidating token and retrying.')
        invalidateToken()
        hasRefetchedTokenOn401 = true
        continue
      }

      const contentType = res.headers.get('content-type') || ''
      let data = null
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        try {
          data = JSON.parse(text)
        } catch {
          data = text
        }
      }

      if (!res.ok) {
        logger.error(`Swich API HTTP error ${res.status}`, { url, status: res.status, data })
        const err = new Error(`Swich API error HTTP ${res.status}`)
        err.status = res.status
        err.data = data
        throw err
      }

      return data
    } catch (err) {
      clearTimeout(timeoutId)

      if (err.name === 'AbortError') {
        logger.error('Swich API request timed out after 15s', { url, attempt })
        err.message = 'Swich API request timeout'
      }

      // If it's a GET and we have attempts left, back off and retry
      if (isGet && attempt <= maxRetries) {
        const backoffMs = attempt * 500
        logger.warn(`Retrying Swich API GET in ${backoffMs}ms...`, { url, attempt })
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
        continue
      }

      throw err
    }
  }
}
