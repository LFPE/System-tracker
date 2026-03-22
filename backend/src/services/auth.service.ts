import type { D1Database } from '@cloudflare/workers-types'
import type { Bindings } from '../config/bindings'
import { normalizeLogin } from '../utils/input'
import { createSessionToken, readSessionPayload, toAuthUser } from '../utils/session'
import { hashPass, needsPasswordRehash, verifyPass } from '../utils/hash'

export async function findUserByLogin(db: D1Database, login: string) {
  return db.prepare('SELECT id, login, name, role, pass_hash FROM users WHERE login = ?')
    .bind(normalizeLogin(login))
    .first<any>()
}

export async function loginUser(db: D1Database, env: Partial<Bindings>, login: string, pass: string) {
  const user = await findUserByLogin(db, login)

  if (!user || !(await verifyPass(pass, user.pass_hash, env))) {
    return null
  }

  if (needsPasswordRehash(user.pass_hash)) {
    user.pass_hash = await hashPass(pass, env)
    await db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').bind(user.pass_hash, user.id).run()
  }

  return {
    token: await createSessionToken(user, env),
    user: toAuthUser(user),
  }
}

export async function getSessionUser(db: D1Database, env: Partial<Bindings>, token: string) {
  const session = await readSessionPayload(token, env)
  if (!session) return null

  const user = await db.prepare(
    'SELECT id, login, name, role, pass_hash FROM users WHERE login = ?'
  ).bind(session.login).first<any>()

  if (!user) return null
  if (user.pass_hash?.slice(-12) !== session.marker) return null

  return toAuthUser(user)
}