import { normalizeLogin, trimString } from '../utils/input'

function validatePasswordStrength(pass: string) {
  if (pass.length < 8) {
    throw new Error('Senha deve ter no mínimo 8 caracteres')
  }

  if (!/[a-zA-Z]/.test(pass) || !/\d/.test(pass)) {
    throw new Error('Senha deve incluir letras e números')
  }
}

export function validateUserCreatePayload(body: any) {
  const login = normalizeLogin(body?.login)
  const name = trimString(body?.name)
  const pass = typeof body?.pass === 'string' ? body.pass : ''
  const role = trimString(body?.role) || 'user'

  if (!login || !name || !pass) {
    throw new Error('Preencha todos os campos')
  }

  validatePasswordStrength(pass)

  return { login, name, pass, role }
}

export function validateOwnPasswordPayload(body: any) {
  const current_pass = typeof body?.current_pass === 'string' ? body.current_pass : ''
  const pass = typeof body?.pass === 'string' ? body.pass : ''

  if (!current_pass) {
    throw new Error('Informe a senha atual')
  }

  if (!pass) {
    throw new Error('Informe a nova senha')
  }

  validatePasswordStrength(pass)

  if (current_pass === pass) {
    throw new Error('A nova senha deve ser diferente da atual')
  }

  return { current_pass, pass }
}