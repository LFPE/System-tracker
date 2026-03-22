import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Bindings } from '../config/bindings'
import { getSessionConfig } from '../config/env'
import type { AuthUser, Role } from '../models/auth.model'
import { signSessionValue } from './hash'

type SessionPayload = {
  v: 1
  login: string
  exp: number
  marker: string
}

async function signSessionPayload(payload: string, env?: Partial<Bindings>) {
  return signSessionValue(payload, env)
}

async function decodePayload(token: string, env?: Partial<Bindings>) {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  try {
    const payload = atob(encoded)
    if ((await signSessionPayload(payload, env)) !== signature) return null

    const parsed = JSON.parse(payload) as SessionPayload
    if (!parsed?.login || !parsed?.exp || !parsed?.marker || parsed.v !== 1) return null
    if (parsed.exp <= Date.now()) return null

    return parsed
  } catch {
    return null
  }
}

export async function createSessionToken(user: { login: string; pass_hash: string }, env?: Partial<Bindings>) {
  const sessionConfig = getSessionConfig(env)
  const payload: SessionPayload = {
    v: 1,
    login: user.login,
    exp: Date.now() + sessionConfig.maxAge * 1000,
    marker: user.pass_hash.slice(-12),
  }
  const raw = JSON.stringify(payload)
  return `${btoa(raw)}.${await signSessionPayload(raw, env)}`
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


export function readSessionPayload(token: string, env?: Partial<Bindings>) {
  return decodePayload(token, env)
}

export function toAuthUser(user: { id: number; login: string; name: string; role: Role }): AuthUser {
  return { id: user.id, login: user.login, name: user.name, role: user.role }
}