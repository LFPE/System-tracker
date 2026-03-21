import { Hono } from 'hono'
import {
  createUserController,
  deleteUserController,
  getUsersController,
  updateOwnPasswordController,
} from '../controllers/users.controller'
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware'
import type { AppRouteConfig } from '../models/app.model'

const users = new Hono<AppRouteConfig>()

users.use('*', requireAuth)
users.get('/', requireAdmin, getUsersController)
users.post('/', requireAdmin, createUserController)
users.delete('/:id', requireAdmin, deleteUserController)
users.put('/me/password', updateOwnPasswordController)

export { users }
