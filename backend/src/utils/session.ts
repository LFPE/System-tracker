import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Bindings } from '../config/bindings'
import { getSessionConfig } from '../config/env'
import type { AuthUser, Role } from '../models/auth.model'

const SESSION_TOKEN_PREFIX = 'st_'
const SESSION_TOKEN_BYTES = 32

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function createSessionToken() {
  const tokenBytes = new Uint8Array(SESSION_TOKEN_BYTES)
  crypto.getRandomValues(tokenBytes)
  return `${SESSION_TOKEN_PREFIX}${bytesToHex(tokenBytes)}`
}

export function readSessionToken(c: Pick<Context, 'req' | 'env'>) {
  return getCookie(c as Context, getSessionConfig(c.env).cookieName)
}

export function writeSessionCookie(c: Context<{ Bindings: Bindings }>, token: string) {
  const sessionConfig = getSessionConfig(c.env)

  setCookie(c, sessionConfig.cookieName, token, {
    httpOnly: true,
    sameSite: sessionConfig.sameSite,
    maxAge: sessionConfig.maxAge,
    path: sessionConfig.path,
    secure: c.req.url.startsWith('https://'),
  })
}

export function clearSessionCookie(c: Context<{ Bindings: Bindings }>) {
  const sessionConfig = getSessionConfig(c.env)
  deleteCookie(c, sessionConfig.cookieName, { path: sessionConfig.path })
}

export function toAuthUser(user: { id: number; login: string; name: string; role: Role }): AuthUser {
  return { id: user.id, login: user.login, name: user.name, role: user.role }
}
