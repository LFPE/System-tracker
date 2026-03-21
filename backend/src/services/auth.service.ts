import type { D1Database } from '@cloudflare/workers-types'
import { normalizeLogin } from '../utils/input'
import { hashPass } from '../utils/hash'
import { createSessionToken, decodeSessionLogin, toAuthUser } from '../utils/session'

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
  const login = decodeSessionLogin(token)
  const user = await db.prepare(
    'SELECT id, login, name, role FROM users WHERE login = ?'
  ).bind(login).first<any>()

  return user ? toAuthUser(user) : null
}

