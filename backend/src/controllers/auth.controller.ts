import { clearSessionCookie, readSessionToken, writeSessionCookie } from '../utils/session'
import { loginUser, getSessionUser } from '../services/auth.service'
import { validateLoginPayload } from '../validations/auth.validation'
import type { PublicAppContext } from '../models/app.model'
import { jsonError, jsonOk } from '../utils/http'

export async function loginController(c: PublicAppContext) {
  try {
    const { login, pass } = validateLoginPayload(await c.req.json())
    const result = await loginUser(c.env.DB, login, pass)

    if (!result) {
      return jsonError(c, 401, new Error('Usuário ou senha incorretos'), 'Usuário ou senha incorretos')
    }

    writeSessionCookie(c, result.token)
    return jsonOk(c, { user: result.user })
  } catch (error) {
    return jsonError(c, 400, error, 'Credenciais inválidas')
  }
}

export function logoutController(c: PublicAppContext) {
  clearSessionCookie(c)
  return jsonOk(c)
}

export async function meController(c: PublicAppContext) {
  const token = readSessionToken(c)
  if (!token) return jsonError(c, 401, new Error('Não autenticado'), 'Não autenticado')

  try {
    const user = await getSessionUser(c.env.DB, token)
    if (!user) return jsonError(c, 401, new Error('Sessão inválida'), 'Sessão inválida')
    return jsonOk(c, { user })
  } catch {
    return jsonError(c, 401, new Error('Sessão inválida'), 'Sessão inválida')
  }
}

