import type { D1Database } from '@cloudflare/workers-types'
import { normalizeLogin } from '../utils/input'
import { hashPass } from '../utils/hash'
import { createSessionToken, readSessionPayload, toAuthUser } from '../utils/session'

export async function findUserByLogin(db: D1Database, login: string) {
  return db.prepare('SELECT * FROM users WHERE login = ?').bind(normalizeLogin(login)).first<any>()
}

export async function loginUser(db: D1Database, login: string, pass: string) {
  const user = await findUserByLogin(db, login)

  if (!user || user.pass_hash !== hashPass(pass)) {
    return null
  }

  return {
    token: createSessionToken(user),
    user: toAuthUser(user),
  }
}

export async function getSessionUser(db: D1Database, token: string) {
  const session = readSessionPayload(token)
  if (!session) return null

  const user = await db.prepare(
    'SELECT id, login, name, role, pass_hash FROM users WHERE login = ?'
  ).bind(session.login).first<any>()

  if (!user) return null
  if (user.pass_hash?.slice(-12) !== session.marker) return null

  return toAuthUser(user)
}