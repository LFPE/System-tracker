import { clearSessionCookie, readSessionToken, writeSessionCookie } from '../utils/session'
import { getSessionUser, loginUser } from '../services/auth.service'
import { validateLoginPayload } from '../validations/auth.validation'
import type { PublicAppContext } from '../models/app.model'
import { AppError, getErrorStatus, jsonError, jsonOk, readJsonBody } from '../utils/http'

export async function loginController(c: PublicAppContext) {
  try {
    const { login, pass } = validateLoginPayload(await readJsonBody<Record<string, unknown>>(c, 'Credenciais invalidas'))
    const result = await loginUser(c.env.DB, c.env, login, pass)

    if (!result) {
      return jsonError(c, 401, new AppError(401, 'Usuario ou senha incorretos'), 'Usuario ou senha incorretos')
    }

    writeSessionCookie(c, result.token)
    return jsonOk(c, { user: result.user })
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Credenciais invalidas')
  }
}

export function logoutController(c: PublicAppContext) {
  clearSessionCookie(c)
  return jsonOk(c)
}

export async function meController(c: PublicAppContext) {
  const token = readSessionToken(c)
  if (!token) {
    clearSessionCookie(c)
    return jsonError(c, 401, new AppError(401, 'Nao autenticado'), 'Nao autenticado')
  }

  try {
    const user = await getSessionUser(c.env.DB, c.env, token)
    if (!user) {
      clearSessionCookie(c)
      return jsonError(c, 401, new AppError(401, 'Sessao invalida'), 'Sessao invalida')
    }

    return jsonOk(c, { user })
  } catch (error) {
    clearSessionCookie(c)
    return jsonError(c, getErrorStatus(error, 401), error, 'Sessao invalida')
  }
}