import type { SatRecordInput } from './sat.model'

export type ReatStatus = 'Revertido' | 'Em Tratativa' | 'Cancelado'

export type ReatRecordInput = {
  tipo?: string
  data?: string
  hora?: string
  consultor?: string
  status?: ReatStatus | string
  revertido?: string
  motivo?: string
  plano_em_dia?: string
  plano?: string
  analise?: string
  texto?: string
}

export type ReatBackupPayload = Record<string, ReatRecordInput[]>

export type BackupUserInput = {
  login: string
  name: string
  role?: string
  pass_hash?: string
}

export type SystemBackupPayload = {
  version?: number
  exported?: string
  records: ReatBackupPayload
  sat?: SatRecordInput[]
  users?: BackupUserInput[]
}