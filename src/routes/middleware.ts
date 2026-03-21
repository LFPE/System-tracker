// ══════════════════════════════════════════════
// TRACKER — Coobrastur — Middleware Auth
// ══════════════════════════════════════════════
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'

type Bindings = { DB: D1Database }
type Variables = { user: { id: number; login: string; name: string; role: string } }

export const requireAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const token = getCookie(c, 'tracker_session')
    if (!token) return c.json({ error: 'Não autenticado' }, 401)

    try {
      const decoded = atob(token)
      const [login] = decoded.split(':')
      const user = await c.env.DB.prepare(
        'SELECT id, login, name, role FROM users WHERE login = ?'
      ).bind(login).first<any>()

      if (!user) return c.json({ error: 'Sessão inválida' }, 401)
      c.set('user', user)
      await next()
    } catch {
      return c.json({ error: 'Sessão inválida' }, 401)
    }
  }
)

export const requireAdmin = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const user = c.get('user')
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403)
    }
    await next()
  }
)
