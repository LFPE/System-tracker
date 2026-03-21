import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sessionConfig } from '../config/env'
import type { AuthUser } from '../models/auth.model'

export function createSessionToken(user: { login: string; pass_hash: string }) {
  return btoa(`${user.login}:${Date.now()}:${user.pass_hash.slice(0, 8)}`)
}

export function readSessionToken(c: Pick<Context, 'req'>) {
  return getCookie(c as Context, sessionConfig.cookieName)
}

export function writeSessionCookie(c: Context, token: string) {
  setCookie(c, sessionConfig.cookieName, token, {
    httpOnly: true,
    sameSite: sessionConfig.sameSite,
    maxAge: sessionConfig.maxAge,
    path: sessionConfig.path,
  })
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, sessionConfig.cookieName, { path: sessionConfig.path })
}

export function decodeSessionLogin(token: string) {
  const decoded = atob(token)
  const [login] = decoded.split(':')
  return login
}

export function toAuthUser(user: any): AuthUser {
  return { id: user.id, login: user.login, name: user.name, role: user.role }
}
