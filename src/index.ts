import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-pages'
import { auth } from './routes/auth'
import { reats } from './routes/reats'
import { sat } from './routes/sat'
import { users } from './routes/users'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// ROTA DE TESTE: Se você acessar http://localhost:8788/teste e ver a frase, o erro 500 acabou!
app.get('/teste', (c) => c.text('O sistema do Luiz Felipe está VIVO! 🚀'))

app.route('/api/auth',  auth)
app.route('/api/reats', reats)
app.route('/api/sat',   sat)
app.route('/api/users', users)

// Entrega os arquivos do Dashboard (index.html, style.css, etc)
app.get('/*', serveStatic())

export default app