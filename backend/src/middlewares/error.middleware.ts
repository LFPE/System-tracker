import type { Context } from 'hono'
import { getErrorStatus, isAppError, jsonError } from '../utils/http'

export function handleAppError(error: unknown, c: Context) {
  if (!isAppError(error)) {
    console.error('Unhandled application error', error)
  }

  return jsonError(c, getErrorStatus(error, 500), error, 'Erro interno do servidor')
}