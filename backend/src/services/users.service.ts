import type { D1Database } from '@cloudflare/workers-types'
import type { Bindings } from '../config/bindings'
import type { UserCreateInput } from '../models/user.model'
import { AppError } from '../utils/http'
import { hashPass, verifyPass } from '../utils/hash'

export async function listUsers(db: D1Database) {
  const result = await db.prepare(
    'SELECT id, login, name, role, created_at FROM users ORDER BY created_at ASC'
  ).all<any>()

  return result.results
}

export async function createUser(db: D1Database, env: Partial<Bindings>, input: UserCreateInput) {
  const exists = await db.prepare('SELECT id FROM users WHERE login = ?').bind(input.login).first()
  if (exists) {
    throw new AppError(409, 'Login ja existe')
  }

  await db.prepare(
    'INSERT INTO users (login, name, pass_hash, role) VALUES (?, ?, ?, ?)'
  ).bind(input.login, input.name, await hashPass(input.pass, env), input.role || 'user').run()
}

export async function deleteUserById(db: D1Database, id: number) {
  const user = await db.prepare('SELECT id, login FROM users WHERE id = ?').bind(id).first<any>()

  if (!user) {
    throw new AppError(404, 'Usuario nao encontrado')
  }

  if (user.login === 'admin') {
    throw new AppError(403, 'Nao e possivel remover o admin')
  }

  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
}

export async function updateOwnPassword(
  db: D1Database,
  env: Partial<Bindings>,
  userId: number,
  currentPass: string,
  pass: string,
) {
  const user = await db.prepare('SELECT id, pass_hash FROM users WHERE id = ?').bind(userId).first<any>()

  if (!user) {
    throw new AppError(404, 'Usuario nao encontrado')
  }

  if (!(await verifyPass(currentPass, user.pass_hash, env))) {
    throw new AppError(400, 'Senha atual incorreta')
  }

  await db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?')
    .bind(await hashPass(pass, env), userId)
    .run()
}