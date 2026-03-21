import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-pages'
import { corsConfig } from './config/cors'
import { auth } from './routes/auth.routes'
import { reats } from './routes/reats.routes'
import { sat } from './routes/sat.routes'
import { users } from './routes/users.routes'
import type { PublicRouteConfig } from './models/app.model'
import { handleAppError } from './middlewares/error.middleware'

const app = new Hono<PublicRouteConfig>()

app.use('/api/*', cors(corsConfig))
app.get('/health', (c) => c.text('O sistema do Luiz Felipe está VIVO! 🚀'))
app.route('/api/auth', auth)
app.route('/api/reats', reats)
app.route('/api/sat', sat)
app.route('/api/users', users)
app.get('/*', serveStatic())
app.onError(handleAppError)

export default app

