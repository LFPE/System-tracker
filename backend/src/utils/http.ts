import type { Context } from 'hono'

export function jsonOk<T extends Record<string, unknown>>(c: Context, payload?: T) {
  return c.json({ ok: true, ...(payload || {}) })
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function jsonError(c: Context, status: number, error: unknown, fallback: string) {
  return c.json({ error: getErrorMessage(error, fallback) }, status)
}
