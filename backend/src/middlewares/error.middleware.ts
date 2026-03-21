import type { Context } from 'hono'
import { jsonError } from '../utils/http'

export function handleAppError(error: unknown, c: Context) {
  return jsonError(c, 500, error, 'Erro interno do servidor')
}
