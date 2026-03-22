import { createMiddleware } from 'hono/factory'
import { getSessionUser } from '../services/auth.service'
import type { AppRouteConfig } from '../models/app.model'
import { jsonError } from '../utils/http'
import { clearSessionCookie, readSessionToken } from '../utils/session'

export const requireAuth = createMiddleware<AppRouteConfig>(async (c, next) => {
  const token = readSessionToken(c)
  if (!token) {
    return jsonError(c, 401, new Error('Nao autenticado'), 'Nao autenticado')
  }

  try {
    const user = await getSessionUser(c.env.DB, c.env, token)
    if (!user) {
      clearSessionCookie(c)
      return jsonError(c, 401, new Error('Sessao invalida'), 'Sessao invalida')
    }

    c.set('user', user)
    await next()
  } catch {
    clearSessionCookie(c)
    return jsonError(c, 401, new Error('Sessao invalida'), 'Sessao invalida')
  }
})

export const requireAdmin = createMiddleware<AppRouteConfig>(async (c, next) => {
  const user = c.get('user')
  if (!user || user.role !== 'admin') {
    return jsonError(c, 403, new Error('Acesso negado'), 'Acesso negado')
  }

  await next()
})