// ══════════════════════════════════════════════
// TRACKER — Coobrastur — API Routes: Auth
// ══════════════════════════════════════════════
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

type Bindings = { DB: D1Database }

const auth = new Hono<{ Bindings: Bindings }>()

// Hash simples compatível com o frontend original
function hashPass(p: string): string {
  const s = 'rt_salt_2026_'
  let h = 5381
  const str = s + p
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i)
    h = h & h
  }
  return 'h_' + (h >>> 0).toString(16)
}

// POST /api/auth/login
auth.post('/login', async (c) => {
  const { login, pass } = await c.req.json()
  if (!login || !pass) return c.json({ error: 'Credenciais inválidas' }, 400)

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE login = ?'
  ).bind(login.trim().toLowerCase()).first<any>()

  if (!user || user.pass_hash !== hashPass(pass)) {
    return c.json({ error: 'Usuário ou senha incorretos' }, 401)
  }

  // Sessão via cookie simples (token = login:timestamp:hash)
  const token = btoa(`${user.login}:${Date.now()}:${user.pass_hash.slice(0, 8)}`)
  setCookie(c, 'tracker_session', token, {
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/'
  })

  return c.json({
    ok: true,
    user: { id: user.id, login: user.login, name: user.name, role: user.role }
  })
})

// POST /api/auth/logout
auth.post('/logout', (c) => {
  deleteCookie(c, 'tracker_session', { path: '/' })
  return c.json({ ok: true })
})

// GET /api/auth/me
auth.get('/me', async (c) => {
  const token = getCookie(c, 'tracker_session')
  if (!token) return c.json({ error: 'Não autenticado' }, 401)

  try {
    const decoded = atob(token)
    const [login] = decoded.split(':')
    const user = await c.env.DB.prepare(
      'SELECT id, login, name, role FROM users WHERE login = ?'
    ).bind(login).first<any>()

    if (!user) return c.json({ error: 'Sessão inválida' }, 401)
    return c.json({ ok: true, user })
  } catch {
    return c.json({ error: 'Sessão inválida' }, 401)
  }
})

export { auth, hashPass }
