import { Hono } from 'hono'
import {
  createReatsController,
  deleteReatsByDateController,
  getReatConsultoresController,
  getReatDatesController,
  getReatsController,
  getReatsStatsController,
  importBackupController,
  updateReatController,
} from '../controllers/reats.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import type { AppRouteConfig } from '../models/app.model'

const reats = new Hono<AppRouteConfig>()

reats.use('*', requireAuth)
reats.get('/', getReatsController)
reats.get('/dates', getReatDatesController)
reats.get('/consultores', getReatConsultoresController)
reats.post('/', createReatsController)
reats.put('/:id', updateReatController)
reats.delete('/date/:data_ref', deleteReatsByDateController)
reats.get('/stats', getReatsStatsController)
reats.post('/import-backup', importBackupController)

export { reats }
