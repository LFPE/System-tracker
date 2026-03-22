import { Hono } from 'hono'
import {
  createReatsController,
  deleteReatsByDateController,
  exportBackupController,
  getReatConsultoresController,
  getReatDatesController,
  getReatsController,
  getReatsStatsController,
  importBackupController,
  updateReatController,
} from '../controllers/reats.controller'
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware'
import type { AppRouteConfig } from '../models/app.model'

const reats = new Hono<AppRouteConfig>()

reats.use('*', requireAuth)
reats.get('/', getReatsController)
reats.get('/backup', requireAdmin, exportBackupController)
reats.get('/dates', getReatDatesController)
reats.get('/consultores', getReatConsultoresController)
reats.post('/', requireAdmin, createReatsController)
reats.put('/:id', requireAdmin, updateReatController)
reats.delete('/date/:data_ref', requireAdmin, deleteReatsByDateController)
reats.get('/stats', getReatsStatsController)
reats.post('/import-backup', requireAdmin, importBackupController)

export { reats }