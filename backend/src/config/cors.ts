import type { Context } from 'hono'
import { isAllowedOrigin } from './env'
import type { PublicRouteConfig } from '../models/app.model'

const baseCorsConfig = {
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

export function getCorsConfig(c: Context<PublicRouteConfig>) {
  return {
    ...baseCorsConfig,
    origin: (origin: string) => (isAllowedOrigin(origin, c.req.url, c.env) ? origin : ''),
  }
}