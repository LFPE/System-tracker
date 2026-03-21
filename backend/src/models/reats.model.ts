export type ReatRecordInput = {
  tipo?: string
  data?: string
  hora?: string
  consultor?: string
  status?: string
  revertido?: string
  motivo?: string
  plano_em_dia?: string
  plano?: string
  analise?: string
  texto?: string
}

export type ReatBackupPayload = Record<string, ReatRecordInput[]>
