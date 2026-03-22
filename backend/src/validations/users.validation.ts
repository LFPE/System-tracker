import type { UserCreateInput } from '../models/user.model'
import { normalizeLogin, trimString } from '../utils/input'
import { AppError } from '../utils/http'
import { validateRole } from './shared.validation'

function validatePasswordStrength(pass: string) {
  if (pass.length < 8) {
    throw new AppError(400, 'Senha deve ter no minimo 8 caracteres')
  }

  if (!/[a-zA-Z]/.test(pass) || !/\d/.test(pass)) {
    throw new AppError(400, 'Senha deve incluir letras e numeros')
  }
}

export function validateUserCreatePayload(body: Record<string, unknown>): UserCreateInput {
  const login = normalizeLogin(body?.login)
  const name = trimString(body?.name)
  const pass = typeof body?.pass === 'string' ? body.pass : ''
  const role = validateRole(body?.role)

  if (!login || !name || !pass) {
    throw new AppError(400, 'Preencha todos os campos obrigatorios')
  }

  validatePasswordStrength(pass)

  return { login, name, pass, role }
}

export function validateOwnPasswordPayload(body: Record<string, unknown>) {
  const current_pass = typeof body?.current_pass === 'string' ? body.current_pass : ''
  const pass = typeof body?.pass === 'string' ? body.pass : ''

  if (!current_pass) {
    throw new AppError(400, 'Informe a senha atual')
  }

  if (!pass) {
    throw new AppError(400, 'Informe a nova senha')
  }

  validatePasswordStrength(pass)

  if (current_pass === pass) {
    throw new AppError(400, 'A nova senha deve ser diferente da atual')
  }

  return { current_pass, pass }
}