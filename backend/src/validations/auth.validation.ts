import { trimString } from '../utils/input'

export function validateLoginPayload(body: any) {
  const login = trimString(body?.login)
  const pass = typeof body?.pass === 'string' ? body.pass : ''

  if (!login || !pass) {
    throw new Error('Credenciais inválidas')
  }

  return { login, pass }
}

