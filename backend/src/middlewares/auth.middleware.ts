import { createMiddleware } from 'hono/factory'
import { readSessionToken } from '../utils/session'
import { getSessionUser } from '../services/auth.service'
import type { AppRouteConfig } from '../models/app.model'
import { jsonError } from '../utils/http'

export const requireAuth = createMiddleware<AppRouteConfig>(
  async (c, next) => {
    const token = readSessionToken(c)
    if (!token) return jsonError(c, 401, new Error('Não autenticado'), 'Não autenticado')

    try {
      const user = await getSessionUser(c.env.DB, token)
      if (!user) return jsonError(c, 401, new Error('Sessão inválida'), 'Sessão inválida')
      c.set('user', user)
      await next()
    } catch {
      return jsonError(c, 401, new Error('Sessão inválida'), 'Sessão inválida')
    }
  }
)

export const requireAdmin = createMiddleware<AppRouteConfig>(
  async (c, next) => {
    const user = c.get('user')
    if (!user || user.role !== 'admin') {
      return jsonError(c, 403, new Error('Acesso negado'), 'Acesso negado')
    }
    await next()
  }
)

