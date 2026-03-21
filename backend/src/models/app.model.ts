import type { Context } from 'hono'
import type { Bindings } from '../config/bindings'
import type { AppVariables } from './auth.model'

export type PublicRouteConfig = {
  Bindings: Bindings
}

export type AppRouteConfig = {
  Bindings: Bindings
  Variables: AppVariables
}

export type PublicAppContext = Context<PublicRouteConfig>
export type AppContext = Context<AppRouteConfig>
