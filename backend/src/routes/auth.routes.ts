import { Hono } from 'hono'
import { loginController, logoutController, meController } from '../controllers/auth.controller'
import type { PublicRouteConfig } from '../models/app.model'

const auth = new Hono<PublicRouteConfig>()

auth.post('/login', loginController)
auth.post('/logout', logoutController)
auth.get('/me', meController)

export { auth }
