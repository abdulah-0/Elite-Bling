import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

/**
 * Returns a 32-byte key derived from PAYOUT_ENCRYPTION_KEY or SWICH_CLIENT_SECRET
 */
function getEncryptionKey() {
  const secret = process.env.PAYOUT_ENCRYPTION_KEY || process.env.SWICH_CLIENT_SECRET || 'default-fallback-payout-secret-key-32b'
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a sensitive string value using AES-256-GCM
 * Returns base64 string formatted as: iv:tag:ciphertext
 */
export function encryptSensitive(plainText) {
  if (!plainText || typeof plainText !== 'string') return ''
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts an AES-256-GCM encrypted string (iv:tag:ciphertext)
 */
export function decryptSensitive(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    return ''
  }
  try {
    const [ivHex, tagHex, cipherHex] = encryptedText.split(':')
    if (!ivHex || !tagHex || !cipherHex) return ''

    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const key = getEncryptionKey()

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    return ''
  }
}

/**
 * Masks a Pakistani 13-digit CNIC (e.g. "1234512345671" -> "12345-XXXXXX1-1")
 */
export function maskCnic(cnic) {
  if (!cnic || typeof cnic !== 'string') return ''
  const digits = cnic.replace(/\D/g, '')
  if (digits.length !== 13) return 'XXXXX-XXXXXXX-X'
  return `${digits.slice(0, 5)}-XXXXXX${digits.slice(11, 12)}-${digits.slice(12)}`
}

/**
 * Masks a Pakistani mobile number (e.g. "03001234567" -> "0300****567")
 */
export function maskMsisdn(msisdn) {
  if (!msisdn || typeof msisdn !== 'string') return ''
  const digits = msisdn.replace(/\D/g, '')
  if (digits.length < 10) return '03**********'
  const norm = digits.startsWith('92') ? '0' + digits.slice(2) : digits
  return `${norm.slice(0, 4)}****${norm.slice(-3)}`
}

/**
 * Returns safe last 4 characters of an account number or IBAN
 */
export function extractAccountLast4(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string') return 'XXXX'
  const clean = accountNumber.trim()
  return clean.slice(-4)
}

/**
 * Masks an account number (e.g. "01234567890123" -> "**********0123")
 */
export function maskAccountNumber(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string') return '****'
  const clean = accountNumber.trim()
  if (clean.length <= 4) return clean
  return '*'.repeat(clean.length - 4) + clean.slice(-4)
}

/**
 * Redacts sensitive fields from objects before logging or returning to API
 */
export function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') return data
  const redacted = Array.isArray(data) ? [...data] : { ...data }

  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase()
    if (['client_secret', 'clientsecret', 'access_token', 'token', 'authorization'].includes(lowerKey)) {
      redacted[key] = '[REDACTED_SECRET]'
    } else if (['cnic'].includes(lowerKey)) {
      redacted[key] = maskCnic(String(redacted[key]))
    } else if (['msisdn', 'phone', 'mobile'].includes(lowerKey)) {
      redacted[key] = maskMsisdn(String(redacted[key]))
    } else if (['accountnumber', 'account_number', 'iban'].includes(lowerKey)) {
      redacted[key] = maskAccountNumber(String(redacted[key]))
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key])
    }
  }

  return redacted
}
