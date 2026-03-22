import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-pages'
import { getCorsConfig } from './config/cors'
import { auth } from './routes/auth.routes'
import { reats } from './routes/reats.routes'
import { sat } from './routes/sat.routes'
import { users } from './routes/users.routes'
import type { PublicRouteConfig } from './models/app.model'
import { handleAppError } from './middlewares/error.middleware'

const app = new Hono<PublicRouteConfig>()

app.use('/api/*', async (c, next) => {
  const middleware = cors(getCorsConfig(c))
  return middleware(c, next)
})

app.get('/health', (c) => c.text('Tracker API online'))
app.route('/api/auth', auth)
app.route('/api/reats', reats)
app.route('/api/sat', sat)
app.route('/api/users', users)
app.get('/*', serveStatic())
app.onError(handleAppError)

export default app