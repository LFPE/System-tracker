// ══════════════════════════════════════════════
// TRACKER — Coobrastur — Main Entry
// ══════════════════════════════════════════════
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { auth } from './routes/auth'
import { reats } from './routes/reats'
import { sat } from './routes/sat'
import { users } from './routes/users'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true
}))

// API routes
app.route('/api/auth', auth)
app.route('/api/reats', reats)
app.route('/api/sat', sat)
app.route('/api/users', users)

// Servir arquivos estáticos (CSS, JS, imagens)
app.use('/static/*', serveStatic({ root: './' }))

// SPA fallback — retorna o index.html para todas as rotas não-API
app.get('*', serveStatic({ root: './', rewriteRequestPath: () => '/index.html' }))

export default app
