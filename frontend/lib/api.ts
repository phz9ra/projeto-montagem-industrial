/**
 * API Client para o backend Flask
 * Sistema de Monitoramento Industrial
 *
 * Configure a variavel de ambiente NEXT_PUBLIC_API_URL
 * para apontar ao seu servidor Flask (ex: http://localhost:5000)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

// ---------------------
// Tipos compartilhados
// ---------------------

export interface Turno {
  id: number
  data_inicio: string
  data_fim: string | null
  status: "ativo" | "pausado" | "finalizado"
  meta_producao: number
  producao_realizada: number
}

export interface ProducaoAtual {
  turno_id: number
  status: string
  data_inicio: string
  meta_producao: number
  producao_realizada: number
  percentual_atingido: number
}

export interface Estatisticas {
  turno: Turno
  eventos_por_posto: { nome: string; total: number }[]
  percentual_atingido: number
  meta_atingida: boolean
}

interface ApiResponse<T = unknown> {
  sucesso: boolean
  mensagem?: string
  [key: string]: T | boolean | string | undefined
}

// ---------------------
// Helper generico
// ---------------------

async function apiRequest<T = ApiResponse>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  const data = await res.json()

  // Se a API responder com sucesso: false, propagamos como erro
  if (!res.ok && data?.mensagem) {
    throw new Error(data.mensagem)
  }

  return data as T
}

// ---------------------
// Turno
// ---------------------

export async function iniciarTurno(metaProducao = 100) {
  return apiRequest<ApiResponse & { turno: Turno }>("/turno/iniciar", {
    method: "POST",
    body: JSON.stringify({ meta_producao: metaProducao }),
  })
}

export async function pausarTurno() {
  return apiRequest<ApiResponse>("/turno/pausar", { method: "POST" })
}

export async function retomarTurno() {
  return apiRequest<ApiResponse>("/turno/retomar", { method: "POST" })
}

export async function finalizarTurno() {
  return apiRequest<ApiResponse & { turno: Turno; estatisticas: Estatisticas }>(
    "/turno/finalizar",
    { method: "POST" }
  )
}

// ---------------------
// Sensor / Evento
// ---------------------

export async function registrarEvento(postoId: number, tipoEvento = "passagem") {
  return apiRequest<
    ApiResponse & {
      evento_id: number
      incrementou_producao: boolean
      producao_atual: ProducaoAtual | null
    }
  >("/sensor/evento", {
    method: "POST",
    body: JSON.stringify({ posto_id: postoId, tipo_evento: tipoEvento }),
  })
}

// ---------------------
// Producao & Meta
// ---------------------

export async function obterProducaoAtual() {
  return apiRequest<ApiResponse & { producao: ProducaoAtual | null }>(
    "/producao/atual"
  )
}

export async function obterMeta() {
  return apiRequest<ApiResponse & { meta: number | null; turno_id?: number }>(
    "/meta"
  )
}

export async function atualizarMeta(meta: number) {
  return apiRequest<
    ApiResponse & { meta_anterior: number; meta_nova: number }
  >("/meta", {
    method: "POST",
    body: JSON.stringify({ meta }),
  })
}

// ---------------------
// Consultas
// ---------------------

export async function obterEstatisticas() {
  return apiRequest<ApiResponse & { estatisticas: Estatisticas }>(
    "/estatisticas"
  )
}

export async function obterHistorico(limite = 10) {
  return apiRequest<
    ApiResponse & { total: number; historico: Turno[] }
  >(`/historico?limite=${limite}`)
}

export async function healthCheck() {
  return apiRequest<{ status: string; mensagem: string; timestamp: string }>(
    "/health"
  )
}
