import { trimString } from '../utils/input'
import { AppError } from '../utils/http'

export function validateLoginPayload(body: Record<string, unknown>) {
  const login = trimString(body?.login)
  const pass = typeof body?.pass === 'string' ? body.pass : ''

  if (!login || !pass) {
    throw new AppError(400, 'Credenciais invalidas')
  }

  return { login, pass }
}