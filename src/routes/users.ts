// ══════════════════════════════════════════════
// TRACKER — Coobrastur — API Routes: Usuários
// ══════════════════════════════════════════════
import { Hono } from 'hono'
import { requireAuth, requireAdmin } from './middleware'
import { hashPass } from './auth'

type Bindings = { DB: D1Database }
type Variables = { user: any }

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>()
users.use('*', requireAuth)

// GET /api/users — listar usuários (admin only)
users.get('/', requireAdmin, async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, login, name, role, created_at FROM users ORDER BY created_at ASC'
  ).all<any>()
  return c.json({ ok: true, users: result.results })
})

// POST /api/users — criar usuário (admin only)
users.post('/', requireAdmin, async (c) => {
  const { login, name, pass, role } = await c.req.json()
  if (!login || !name || !pass) return c.json({ error: 'Preencha todos os campos' }, 400)
  if (pass.length < 4) return c.json({ error: 'Senha mínimo 4 caracteres' }, 400)

  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE login = ?').bind(login).first()
  if (exists) return c.json({ error: 'Login já existe' }, 409)

  await c.env.DB.prepare(
    'INSERT INTO users (login, name, pass_hash, role) VALUES (?, ?, ?, ?)'
  ).bind(login.trim().toLowerCase(), name.trim(), hashPass(pass), role || 'user').run()

  return c.json({ ok: true })
})

// DELETE /api/users/:id — remover usuário (admin only)
users.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const user = await c.env.DB.prepare('SELECT login FROM users WHERE id = ?').bind(id).first<any>()
  if (user?.login === 'admin') return c.json({ error: 'Não é possível remover o admin' }, 403)

  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// PUT /api/users/me/password — alterar própria senha
users.put('/me/password', async (c) => {
  const me = c.get('user')
  const { pass } = await c.req.json()
  if (!pass || pass.length < 4) return c.json({ error: 'Senha mínimo 4 caracteres' }, 400)

  await c.env.DB.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').bind(hashPass(pass), me.id).run()
  return c.json({ ok: true })
})

export { users }
