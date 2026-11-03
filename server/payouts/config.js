import { z } from 'zod'

const payoutEnvSchema = z.object({
  SWICH_PAYOUTS_ENABLED: z.string().optional().default('false').transform((v) => v === 'true'),
  SWICH_PAYOUT_ENV: z.enum(['sandbox', 'production']).optional(),
  SWICH_ENV: z.enum(['sandbox', 'production']).default('sandbox'),

  SWICH_PAYOUT_CLIENT_ID: z.string().optional(),
  SWICH_CLIENT_ID: z.string().optional().default(''),

  SWICH_PAYOUT_CLIENT_SECRET: z.string().optional(),
  SWICH_CLIENT_SECRET: z.string().optional().default(''),

  SWICH_PAYOUT_API_BASE_URL: z.string().url().optional(),
  SWICH_PAYOUT_AUTH_URL: z.string().url().optional(),

  SWICH_WHITELISTED_PUBLIC_IP: z.string().optional().default(''),
  SWICH_PAYOUT_MIN_AMOUNT: z.coerce.number().default(10),
  SWICH_PAYOUT_MAX_AMOUNT: z.coerce.number().default(500000),
  PAYOUT_ENCRYPTION_KEY: z.string().optional(),
})

const SWICH_PAYOUT_URLS = {
  sandbox: {
    apiBase: 'https://sandbox-api.swichnow.com',
    authUrl: 'https://sandbox-auth.swichnow.com/connect/token',
  },
  production: {
    apiBase: 'https://api.swichnow.com',
    authUrl: 'https://auth.swichnow.com/connect/token',
  },
}

/**
 * Returns validated Swich PayOut configuration.
 * Fails closed if required parameters are invalid.
 */
export function getPayoutConfig(env = process.env) {
  const parsed = payoutEnvSchema.parse(env)
  const activeEnv = parsed.SWICH_PAYOUT_ENV || parsed.SWICH_ENV || 'sandbox'
  const defaults = SWICH_PAYOUT_URLS[activeEnv]

  const clientId = parsed.SWICH_PAYOUT_CLIENT_ID || parsed.SWICH_CLIENT_ID
  const clientSecret = parsed.SWICH_PAYOUT_CLIENT_SECRET || parsed.SWICH_CLIENT_SECRET

  return {
    enabled: parsed.SWICH_PAYOUTS_ENABLED,
    env: activeEnv,
    clientId,
    clientSecret,
    apiBase: parsed.SWICH_PAYOUT_API_BASE_URL || defaults.apiBase,
    authUrl: parsed.SWICH_PAYOUT_AUTH_URL || defaults.authUrl,
    whitelistedIp: parsed.SWICH_WHITELISTED_PUBLIC_IP,
    minAmount: parsed.SWICH_PAYOUT_MIN_AMOUNT,
    maxAmount: parsed.SWICH_PAYOUT_MAX_AMOUNT,
    encryptionKey: parsed.PAYOUT_ENCRYPTION_KEY || clientSecret,
  }
}
