import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sessionConfig } from '../config/env'
import type { AuthUser } from '../models/auth.model'
import { hashPass } from './hash'

type SessionPayload = {
  v: 1
  login: string
  exp: number
  marker: string
}

function signSessionPayload(payload: string) {
  return hashPass(`session:${payload}`)
}

function decodePayload(token: string) {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const payload = atob(encoded)
  if (signSessionPayload(payload) !== signature) return null

  const parsed = JSON.parse(payload) as SessionPayload
  if (!parsed?.login || !parsed?.exp || !parsed?.marker || parsed.v !== 1) return null
  if (parsed.exp <= Date.now()) return null

  return parsed
}

export function createSessionToken(user: { login: string; pass_hash: string }) {
  const payload: SessionPayload = {
    v: 1,
    login: user.login,
    exp: Date.now() + sessionConfig.maxAge * 1000,
    marker: user.pass_hash.slice(-12),
  }
  const raw = JSON.stringify(payload)
  return `${btoa(raw)}.${signSessionPayload(raw)}`
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
    secure: c.req.url.startsWith('https://'),
  })
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, sessionConfig.cookieName, { path: sessionConfig.path })
}

export function readSessionPayload(token: string) {
  return decodePayload(token)
}

export function toAuthUser(user: any): AuthUser {
  return { id: user.id, login: user.login, name: user.name, role: user.role }
}