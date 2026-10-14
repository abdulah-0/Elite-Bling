/**
 * Safe logger for payment events
 * Redacts secrets, tokens, and sensitive customer information
 * Reference: docs/implementation.prd.md §10 (S1, S6) & §12
 */

export function maskMsisdn(msisdn) {
  if (!msisdn || typeof msisdn !== 'string') return msisdn
  const digits = msisdn.replace(/\D/g, '')
  if (digits.length <= 6) return '***'
  return `${digits.slice(0, 4)}****${digits.slice(-3)}`
}

export function maskEmail(email) {
  if (!email || typeof email !== 'string') return email
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local[0]}***${local.slice(-1)}`
  return `${maskedLocal}@${domain}`
}

export function sanitisePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const clone = Array.isArray(obj) ? [...obj] : { ...obj }

  const sensitiveKeys = [
    'secret',
    'secretkey',
    'clientsecret',
    'client_secret',
    'token',
    'access_token',
    'checksum',
    'password',
    'aeskey',
    'aesiv',
  ]

  for (const key of Object.keys(clone)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      clone[key] = '[REDACTED]'
    } else if (lowerKey.includes('phone') || lowerKey.includes('msisdn')) {
      clone[key] = maskMsisdn(clone[key])
    } else if (lowerKey.includes('email')) {
      clone[key] = maskEmail(clone[key])
    } else if (typeof clone[key] === 'object') {
      clone[key] = sanitisePayload(clone[key])
    }
  }

  return clone
}

export const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({ level: 'info', message: msg, timestamp: new Date().toISOString(), ...sanitisePayload(meta) }))
  },
  warn: (msg, meta = {}) => {
    console.warn(JSON.stringify({ level: 'warn', message: msg, timestamp: new Date().toISOString(), ...sanitisePayload(meta) }))
  },
  error: (msg, meta = {}) => {
    console.error(JSON.stringify({ level: 'error', message: msg, timestamp: new Date().toISOString(), ...sanitisePayload(meta) }))
  },
}
