import type { D1Database } from '@cloudflare/workers-types'
import type { Bindings } from '../config/bindings'
import { getSessionConfig } from '../config/env'
import type { SessionUserRow } from '../models/session.model'
import { normalizeLogin } from '../utils/input'
import { hashPassword, hashSessionToken, needsPasswordRehash, verifyPassword } from '../utils/hash'
import { createSessionToken, toAuthUser } from '../utils/session'

function getSessionExpiry(env?: Partial<Bindings>) {
  return Date.now() + getSessionConfig(env).maxAge * 1000
}

async function persistSession(db: D1Database, env: Partial<Bindings>, userId: number) {
  const token = createSessionToken()
  const tokenHash = await hashSessionToken(token, env)
  const now = Date.now()

  await db.prepare(
    'INSERT INTO auth_sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(userId, tokenHash, getSessionExpiry(env), now).run()

  return token
}

export async function findUserByLogin(db: D1Database, login: string) {
  return db.prepare('SELECT id, login, name, role, pass_hash FROM users WHERE login = ?')
    .bind(normalizeLogin(login))
    .first<any>()
}

export async function revokeSession(db: D1Database, env: Partial<Bindings>, token: string) {
  if (!token) return

  await db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?')
    .bind(await hashSessionToken(token, env))
    .run()
}

export async function revokeUserSessions(db: D1Database, userId: number) {
  await db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').bind(userId).run()
}

export async function loginUser(db: D1Database, env: Partial<Bindings>, login: string, pass: string) {
  const user = await findUserByLogin(db, login)

  if (!user || !(await verifyPassword(pass, user.pass_hash, env))) {
    return null
  }

  if (needsPasswordRehash(user.pass_hash, env)) {
    user.pass_hash = await hashPassword(pass, env)
    await db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').bind(user.pass_hash, user.id).run()
  }

  return {
    token: await persistSession(db, env, user.id),
    user: toAuthUser(user),
  }
}

export async function getSessionUser(db: D1Database, env: Partial<Bindings>, token: string) {
  const tokenHash = await hashSessionToken(token, env)
  const now = Date.now()
  const row = await db.prepare(
    `SELECT
      u.id AS id,
      u.login AS login,
      u.name AS name,
      u.role AS role,
      s.expires_at AS session_expires_at
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
    LIMIT 1`
  ).bind(tokenHash).first<SessionUserRow>()

  if (!row) return null

  if (row.session_expires_at <= now) {
    await db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(tokenHash).run()
    return null
  }

  return toAuthUser(row)
}
