import type { D1Database } from '@cloudflare/workers-types'

export type Bindings = {
  DB: D1Database
  APP_ENV?: string
  ALLOWED_ORIGIN?: string
  SESSION_COOKIE_NAME?: string
  SESSION_COOKIE_MAX_AGE?: string
  SESSION_COOKIE_SAME_SITE?: 'Strict' | 'Lax' | 'None'
  SESSION_HASH_SALT?: string
  PASSWORD_HASH_ITERATIONS?: string
}
