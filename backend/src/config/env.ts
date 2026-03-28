import type { Bindings } from './bindings'

const DEFAULT_COOKIE_NAME = 'tracker_session'
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7
const DEFAULT_SAME_SITE = 'Strict' as const
const DEFAULT_HASH_SALT = 'rt_salt_2026_'
const DEFAULT_PASSWORD_HASH_ITERATIONS = 600000
const DEFAULT_PASSWORD_HASH_SALT_BYTES = 16
const DEFAULT_PASSWORD_HASH_KEY_LENGTH = 32
const DEV_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8788',
  'http://127.0.0.1:8788',
]

function parseMaxAge(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_AGE
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function isProductionEnv(env?: Partial<Bindings>) {
  return (env?.APP_ENV || '').trim().toLowerCase() === 'production'
}

export function getAllowedOrigins(env?: Partial<Bindings>) {
  const raw = (env?.ALLOWED_ORIGIN || '').trim()
  if (!raw) {
    return isProductionEnv(env) ? [] : DEV_ALLOWED_ORIGINS
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function isAllowedOrigin(origin: string, requestUrl: string, env?: Partial<Bindings>) {
  if (!origin) return true

  try {
    const requestOrigin = new URL(requestUrl).origin
    if (origin === requestOrigin) return true
  } catch {
    return false
  }

  return getAllowedOrigins(env).includes(origin)
}

export function getSessionConfig(env?: Partial<Bindings>) {
  const sameSite = env?.SESSION_COOKIE_SAME_SITE

  return {
    cookieName: (env?.SESSION_COOKIE_NAME || DEFAULT_COOKIE_NAME).trim() || DEFAULT_COOKIE_NAME,
    maxAge: parseMaxAge(env?.SESSION_COOKIE_MAX_AGE),
    path: '/',
    sameSite: sameSite === 'Lax' || sameSite === 'None' || sameSite === 'Strict'
      ? sameSite
      : DEFAULT_SAME_SITE,
    hashSalt: (env?.SESSION_HASH_SALT || DEFAULT_HASH_SALT).trim() || DEFAULT_HASH_SALT,
  }
}

export function getPasswordHashConfig(env?: Partial<Bindings>) {
  return {
    iterations: parsePositiveInt(env?.PASSWORD_HASH_ITERATIONS, DEFAULT_PASSWORD_HASH_ITERATIONS),
    saltBytes: DEFAULT_PASSWORD_HASH_SALT_BYTES,
    keyLength: DEFAULT_PASSWORD_HASH_KEY_LENGTH,
  }
}
