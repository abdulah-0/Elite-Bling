import { getPayoutAccessToken, invalidatePayoutToken } from './auth.js'
import { logger } from '../logger.js'
import { redactSensitiveData } from '../crypto.js'

/**
 * Robust HTTP client for Swich PayOut API
 * Enforces timeouts, Bearer token injection, safe logging, and selective retries.
 */
export async function payoutFetch(pathOrUrl, options = {}, config) {
  const method = (options.method || 'GET').toUpperCase()
  const isGet = method === 'GET'
  const maxRetries = isGet ? 1 : 0 // IBFT (POST) NEVER retries automatically

  const apiBase = config?.apiBase || 'https://sandbox-api.swichnow.com'
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${apiBase.replace(/\/$/, '')}${pathOrUrl}`

  let attempt = 0
  let hasRefetchedTokenOn401 = false

  while (attempt <= maxRetries) {
    attempt++
    const token = await getPayoutAccessToken(config)

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      logger.info(`Swich PayOut [${method}]`, {
        url,
        attempt,
        body: options.body ? redactSensitiveData(JSON.parse(options.body)) : undefined,
      })

      const res = await fetch(url, {
        ...options,
        method,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 401: invalidate cached token and retry once
      if (res.status === 401 && !hasRefetchedTokenOn401) {
        logger.warn('Received 401 from Swich PayOut. Invalidating token and retrying.')
        invalidatePayoutToken()
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
          data = { rawText: text }
        }
      }

      if (!res.ok) {
        logger.error(`Swich PayOut HTTP error ${res.status}`, {
          url,
          status: res.status,
          data: redactSensitiveData(data),
        })
        const err = new Error(data?.message || `Swich PayOut error HTTP ${res.status}`)
        err.status = res.status
        err.data = data
        err.code = data?.code != null ? String(data.code) : String(res.status)
        throw err
      }

      return data
    } catch (err) {
      clearTimeout(timeoutId)

      if (err.name === 'AbortError') {
        logger.error('Swich PayOut request timed out after 15s', { url, attempt })
        const timeoutErr = new Error('Swich PayOut request timeout')
        timeoutErr.code = '5015'
        timeoutErr.isTimeout = true
        throw timeoutErr
      }

      if (isGet && attempt <= maxRetries) {
        const backoffMs = attempt * 500
        logger.warn(`Retrying Swich PayOut GET in ${backoffMs}ms...`, { url, attempt })
        await new Promise((r) => setTimeout(r, backoffMs))
        continue
      }

      throw err
    }
  }
}
