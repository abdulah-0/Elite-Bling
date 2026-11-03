import { redactSensitiveData } from './crypto.js'

function formatLog(level, message, metadata = {}) {
  const entry = {
    level,
    message,
    module: 'swich_payout',
    timestamp: new Date().toISOString(),
    ...redactSensitiveData(metadata),
  }
  return JSON.stringify(entry)
}

export const logger = {
  info(message, metadata) {
    console.log(formatLog('info', message, metadata))
  },
  warn(message, metadata) {
    console.warn(formatLog('warn', message, metadata))
  },
  error(message, metadata) {
    console.error(formatLog('error', message, metadata))
  },
}
