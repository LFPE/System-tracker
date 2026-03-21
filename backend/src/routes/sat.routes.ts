import { Hono } from 'hono'
import {
  createSatController,
  getSatAggregationController,
  getSatMonthsController,
  getSatRecordsController,
  getSatTotalsController,
} from '../controllers/sat.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import type { AppRouteConfig } from '../models/app.model'

const sat = new Hono<AppRouteConfig>()

sat.use('*', requireAuth)
sat.get('/', getSatRecordsController)
sat.get('/months', getSatMonthsController)
sat.post('/', createSatController)
sat.get('/agg', getSatAggregationController)
sat.get('/totals', getSatTotalsController)

export { sat }
