import { createUser, deleteUserById, listUsers, updateOwnPassword } from '../services/users.service'
import { validatePasswordPayload, validateUserCreatePayload } from '../validations/users.validation'
import type { AppContext } from '../models/app.model'
import { getErrorMessage, jsonError, jsonOk } from '../utils/http'

export async function getUsersController(c: AppContext) {
  const users = await listUsers(c.env.DB)
  return jsonOk(c, { users })
}

export async function createUserController(c: AppContext) {
  try {
    const payload = validateUserCreatePayload(await c.req.json())
    await createUser(c.env.DB, payload)
    return jsonOk(c)
  } catch (error) {
    const message = getErrorMessage(error, 'Erro ao criar usuário')
    const status = message === 'Login já existe' ? 409 : 400
    return jsonError(c, status, error, message)
  }
}

export async function deleteUserController(c: AppContext) {
  try {
    await deleteUserById(c.env.DB, c.req.param('id'))
    return jsonOk(c)
  } catch (error) {
    const message = getErrorMessage(error, 'Erro ao remover usuário')
    const status = message === 'Não é possível remover o admin' ? 403 : 400
    return jsonError(c, status, error, message)
  }
}

export async function updateOwnPasswordController(c: AppContext) {
  try {
    const me = c.get('user')
    const { pass } = validatePasswordPayload(await c.req.json())
    await updateOwnPassword(c.env.DB, me.id, pass)
    return jsonOk(c)
  } catch (error) {
    return jsonError(c, 400, error, 'Erro ao atualizar senha')
  }
}

