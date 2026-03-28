import { createUser, deleteUserById, listUsers, updateOwnPassword } from '../services/users.service'
import { validateOwnPasswordPayload, validateUserCreatePayload } from '../validations/users.validation'
import { validateRouteId } from '../validations/shared.validation'
import type { AppContext } from '../models/app.model'
import { clearSessionCookie } from '../utils/session'
import { getErrorStatus, jsonError, jsonOk, readJsonBody } from '../utils/http'

export async function getUsersController(c: AppContext) {
  const users = await listUsers(c.env.DB)
  return jsonOk(c, { users })
}

export async function createUserController(c: AppContext) {
  try {
    const payload = validateUserCreatePayload(await readJsonBody<Record<string, unknown>>(c, 'Dados invalidos'))
    await createUser(c.env.DB, c.env, payload)
    return jsonOk(c)
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Erro ao criar usuario')
  }
}

export async function deleteUserController(c: AppContext) {
  try {
    const id = validateRouteId(c.req.param('id'), 'Usuario')
    await deleteUserById(c.env.DB, id)
    return jsonOk(c)
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Erro ao remover usuario')
  }
}

export async function updateOwnPasswordController(c: AppContext) {
  try {
    const me = c.get('user')
    const { current_pass, pass } = validateOwnPasswordPayload(
      await readJsonBody<Record<string, unknown>>(c, 'Dados invalidos'),
    )

    await updateOwnPassword(c.env.DB, c.env, me.id, current_pass, pass)
    clearSessionCookie(c)
    return jsonOk(c)
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Erro ao atualizar senha')
  }
}
