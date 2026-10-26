import { z } from 'zod'

const envSchema = z.object({
  SWICH_ENABLED: z.string().optional().default('true').transform((v) => v === 'true'),
  SWICH_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  SWICH_CLIENT_ID: z.string().optional().default(''),
  SWICH_CLIENT_SECRET: z.string().optional().default(''),
  SWICH_SECRET_KEY: z.string().optional().default(''),
  SWICH_API_BASE_URL: z.string().url().optional(),
  SWICH_AUTH_URL: z.string().url().optional(),
  SWICH_PWA_URL: z.string().url().optional(),
  SWICH_PWA_POST_URL: z.string().url().optional(),
  SWICH_LANDING_MODE: z.enum(['get', 'post']).default('get'),
  SWICH_AES_KEY: z.string().optional(),
  SWICH_AES_IV: z.string().optional(),
  SWICH_MIN_AMOUNT: z.coerce.number().default(10),
  SWICH_MAX_AMOUNT: z.coerce.number().default(50000),
  SWICH_ATTEMPT_TTL_MINUTES: z.coerce.number().default(60),
  SWICH_TRANSACTION_TYPE: z.string().optional(),
  SWICH_PAYMENT_FLOW: z.enum(['biller', 'pwa']).default('biller'),
  SWICH_PWA_ONLY: z.string().optional().default('false').transform((v) => v === 'true'),
  BASE_URL: z.string().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
})

const SWICH_URLS = {
  sandbox: {
    apiBase: 'https://sandbox-api.swichnow.com',
    authUrl: 'https://sandbox-auth.swichnow.com/connect/token',
    pwaGetUrl: 'https://sandbox-payin-pwa.swichnow.com/',
    pwaPostUrl: 'https://sandbox-payinpwa20.swichnow.com/Transaction/Index',
  },
  production: {
    apiBase: 'https://api.swichnow.com',
    authUrl: 'https://auth.swichnow.com/connect/token',
    pwaGetUrl: 'https://payin-pwa.swichnow.com/',
    pwaPostUrl: 'https://payin2pwa.swichnow.com/Transaction/Index',
  },
}

/**
 * Returns validated Swich configuration.
 * Derived URLs fallback to sandbox/production defaults unless overridden.
 */
export function getSwichConfig(env = process.env) {
  const parsed = envSchema.parse(env)
  const envDefaults = SWICH_URLS[parsed.SWICH_ENV]

  const secretKey = parsed.SWICH_SECRET_KEY || parsed.SWICH_CLIENT_SECRET || ''
  const siteUrl = parsed.NEXT_PUBLIC_SITE_URL || parsed.BASE_URL || 'http://localhost:3000'

  return {
    enabled: parsed.SWICH_ENABLED,
    env: parsed.SWICH_ENV,
    paymentFlow: parsed.SWICH_PAYMENT_FLOW,
    clientId: parsed.SWICH_CLIENT_ID,
    clientSecret: parsed.SWICH_CLIENT_SECRET,
    // TODO(VERIFY): Is SecretKey the same value as client_secret? Treated as separate env var with fallback.
    secretKey,
    apiBase: parsed.SWICH_API_BASE_URL || envDefaults.apiBase,
    authUrl: parsed.SWICH_AUTH_URL || envDefaults.authUrl,
    pwaGetUrl: parsed.SWICH_PWA_URL || envDefaults.pwaGetUrl,
    pwaPostUrl: parsed.SWICH_PWA_POST_URL || envDefaults.pwaPostUrl,
    landingMode: parsed.SWICH_LANDING_MODE,
    aesKey: parsed.SWICH_AES_KEY,
    aesIv: parsed.SWICH_AES_IV,
    minAmount: parsed.SWICH_MIN_AMOUNT,
    maxAmount: parsed.SWICH_MAX_AMOUNT,
    attemptTtlMinutes: parsed.SWICH_ATTEMPT_TTL_MINUTES,
    transactionType: parsed.SWICH_TRANSACTION_TYPE,
    pwaOnly: parsed.SWICH_PWA_ONLY,
    siteUrl: siteUrl.replace(/\/$/, ''),
    cronSecret: parsed.CRON_SECRET,
  }
}
