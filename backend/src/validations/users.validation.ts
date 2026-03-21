import { normalizeLogin, trimString } from '../utils/input'

export function validateUserCreatePayload(body: any) {
  const login = normalizeLogin(body?.login)
  const name = trimString(body?.name)
  const pass = typeof body?.pass === 'string' ? body.pass : ''
  const role = trimString(body?.role) || 'user'

  if (!login || !name || !pass) {
    throw new Error('Preencha todos os campos')
  }

  if (pass.length < 4) {
    throw new Error('Senha mínimo 4 caracteres')
  }

  return { login, name, pass, role }
}

export function validatePasswordPayload(body: any) {
  const pass = typeof body?.pass === 'string' ? body.pass : ''
  if (!pass || pass.length < 4) {
    throw new Error('Senha mínimo 4 caracteres')
  }
  return { pass }
}

