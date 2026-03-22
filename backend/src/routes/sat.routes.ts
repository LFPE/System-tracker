import { Hono } from 'hono'
import {
  createSatController,
  getSatAggregationController,
  getSatMonthsController,
  getSatRecordsController,
  getSatTotalsController,
} from '../controllers/sat.controller'
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware'
import type { AppRouteConfig } from '../models/app.model'

const sat = new Hono<AppRouteConfig>()

sat.use('*', requireAuth)
sat.get('/', getSatRecordsController)
sat.get('/months', getSatMonthsController)
sat.post('/', requireAdmin, createSatController)
sat.get('/agg', getSatAggregationController)
sat.get('/totals', getSatTotalsController)

export { sat }