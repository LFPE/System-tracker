import type { Context } from 'hono'

export class AppError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AppError'
    this.status = status
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function getErrorStatus(error: unknown, fallback = 500) {
  return isAppError(error) ? error.status : fallback
}

export async function readJsonBody<T>(c: Context, fallback = 'Corpo da requisicao invalido') {
  try {
    const body = await c.req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new AppError(400, fallback)
    }
    return body as T
  } catch (error) {
    if (isAppError(error)) throw error
    throw new AppError(400, fallback)
  }
}

export function jsonOk<T extends Record<string, unknown>>(c: Context, payload?: T) {
  return c.json({ ok: true, ...(payload || {}) })
}

export function jsonError(c: Context, status: number, error: unknown, fallback: string) {
  return c.json({ error: getErrorMessage(error, fallback) }, status)
}