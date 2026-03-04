"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ShiftStatus } from "@/components/dashboard/shift-status"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ProgressCard } from "@/components/dashboard/progress-card"
import { WorkStationFlow } from "@/components/dashboard/work-station-flow"
import { ShiftControls } from "@/components/dashboard/shift-controls"
import { ActivityLog, type LogEntry } from "@/components/dashboard/activity-log"
import { UpdateMeta } from "@/components/dashboard/update-meta"
import { BarChart3, Target } from "lucide-react"
import * as api from "@/lib/api"

// ---------------------
// Tipos locais
// ---------------------

type Status = "sem-turno" | "ativo" | "pausado" | "finalizado"

function getTimestamp() {
  return new Date().toLocaleTimeString("pt-BR")
}

function makeId() {
  return Math.random().toString(36).substring(2, 9)
}

const POLLING_INTERVAL = 2000 // 2 s

// ---------------------
// Pagina principal
// ---------------------

export default function DashboardPage() {
  const [status, setStatus] = useState<Status>("sem-turno")
  const [producao, setProducao] = useState(0)
  const [meta, setMeta] = useState(0)
  const [metaInicial, setMetaInicial] = useState(100)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const hasInitialized = useRef(false)
  const [loading, setLoading] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [postos, setPostos] = useState([
    { id: 1, nome: "Posto Inicial", ativo: false },
    { id: 2, nome: "Montagem", ativo: false },
    { id: 3, nome: "Finalizacao", ativo: false },
  ])

  // ----- Logging -----
  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      setLogs((prev) => [
        { id: makeId(), message, type, timestamp: getTimestamp() },
        ...prev.slice(0, 49),
      ])
    },
    []
  )

  // ----- Verifica conexao com backend -----
  const checkBackend = useCallback(async () => {
    try {
      await api.healthCheck()
      setBackendOnline(true)
      return true
    } catch {
      setBackendOnline(false)
      return false
    }
  }, [])

  // ----- Sincroniza estado com backend -----
  const syncFromBackend = useCallback(async () => {
    try {
      const res = await api.obterProducaoAtual()

      if (!res.producao) {
        // Nenhum turno ativo no backend
        setStatus((prev) => {
          // Preserva "finalizado" ate que o usuario inicie outro turno
          if (prev === "ativo" || prev === "pausado") return "finalizado"
          return prev === "finalizado" ? "finalizado" : "sem-turno"
        })
        setPostos((prev) => prev.map((p) => ({ ...p, ativo: false })))
        return
      }

      const prod = res.producao
      const backendStatus = prod.status as Status
      setStatus(backendStatus === "ativo" || backendStatus === "pausado" ? backendStatus : "sem-turno")
      setProducao(prod.producao_realizada)
      setMeta(prod.meta_producao)

      // Buscar estatisticas para saber qual posto esta ativo
      try {
        const stats = await api.obterEstatisticas()
        if (stats.estatisticas?.eventos_por_posto) {
          const eventos = stats.estatisticas.eventos_por_posto

          // Soma total de eventos de todos os postos
          const totalEventos = eventos.reduce(
            (sum: number, e: any) => sum + (e.total || 0),
            0
          )

          // Ciclo correto: 1->2->3->1->2->3
          const proximoPosto = (totalEventos % 3) + 1

          setPostos((prev) =>
            prev.map((p) => ({
              ...p,
              ativo: backendStatus === "ativo" && p.id === proximoPosto,
            }))
          )
        }
      } catch {
        // Ignorar erro de estatisticas
      }
    } catch {
      // Backend pode estar offline; mantem ultimo estado
    }
  }, [])

  // ----- Inicializacao & polling -----
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      addLog("Sistema iniciado", "info")

      // Verifica saude do backend e sincroniza
      checkBackend().then((online) => {
        if (online) {
          addLog("Conectado ao backend Flask", "success")
          syncFromBackend()
        } else {
          addLog("Backend offline - usando modo local", "warning")
        }
      })
    }
  }, [addLog, checkBackend, syncFromBackend])

  // Polling: sincroniza com backend a cada POLLING_INTERVAL
  useEffect(() => {
    if (!backendOnline) return

    const interval = setInterval(() => {
      syncFromBackend()
    }, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [backendOnline, syncFromBackend])

  // ----- Metricas derivadas -----
  const percentual = meta > 0 ? Math.round((producao / meta) * 100) : 0
  const metaAtingida = meta > 0 && producao >= meta

  const statusTextMap: Record<Status, string> = {
    "sem-turno": "Nenhum turno ativo no momento",
    ativo: "Producao em andamento",
    pausado: "Producao temporariamente suspensa",
    finalizado: "Turno encerrado",
  }

  // =============================================
  // Handlers com chamadas reais a API
  // =============================================

  const handleIniciar = useCallback(async () => {
    setLoading(true)
    try {
      if (backendOnline) {
        const res = await api.iniciarTurno(metaInicial)
        if (res.sucesso && res.turno) {
          setStatus("ativo")
          setMeta(res.turno.meta_producao)
          setProducao(0)
          setPostos((prev) => prev.map((p) => ({ ...p, ativo: false })))
          addLog(`Turno #${res.turno.id} iniciado com meta de ${metaInicial} pecas`, "success")
        } else {
          addLog(res.mensagem ?? "Erro ao iniciar turno", "error")
        }
      } else {
        // Fallback local
        setStatus("ativo")
        setMeta(metaInicial)
        setProducao(0)
        setPostos((prev) => prev.map((p, i) => ({ ...p, ativo: i === 0 })))
        addLog(`Turno iniciado (local) com meta de ${metaInicial} pecas`, "success")
      }
    } catch (err) {
      addLog(`Erro ao iniciar turno: ${err instanceof Error ? err.message : "desconhecido"}`, "error")
    } finally {
      setLoading(false)
    }
  }, [metaInicial, addLog, backendOnline])

  const handlePausar = useCallback(async () => {
    setLoading(true)
    try {
      if (backendOnline) {
        const res = await api.pausarTurno()
        if (res.sucesso) {
          setStatus("pausado")
          setPostos((prev) => prev.map((p) => ({ ...p, ativo: false })))
          addLog("Turno pausado", "warning")
        } else {
          addLog(res.mensagem ?? "Erro ao pausar", "error")
        }
      } else {
        setStatus("pausado")
        setPostos((prev) => prev.map((p) => ({ ...p, ativo: false })))
        addLog("Turno pausado (local)", "warning")
      }
    } catch (err) {
      addLog(`Erro ao pausar turno: ${err instanceof Error ? err.message : "desconhecido"}`, "error")
    } finally {
      setLoading(false)
    }
  }, [addLog, backendOnline])

  const handleRetomar = useCallback(async () => {
    setLoading(true)
    try {
      if (backendOnline) {
        const res = await api.retomarTurno()
        if (res.sucesso) {
          setStatus("ativo")
          addLog("Turno retomado", "success")
        } else {
          addLog(res.mensagem ?? "Erro ao retomar", "error")
        }
      } else {
        setStatus("ativo")
        addLog("Turno retomado (local)", "success")
      }
    } catch (err) {
      addLog(`Erro ao retomar turno: ${err instanceof Error ? err.message : "desconhecido"}`, "error")
    } finally {
      setLoading(false)
    }
  }, [addLog, backendOnline])

  const handleFinalizar = useCallback(async () => {
    setLoading(true)
    try {
      if (backendOnline) {
        const res = await api.finalizarTurno()
        if (res.sucesso) {
          setStatus("finalizado")
          setPostos((prev) => prev.map((p) => ({ ...p, ativo: false })))
          const pct = res.estatisticas?.percentual_atingido ?? percentual
          addLog(
            `Turno finalizado - ${producao}/${meta} pecas (${pct}%)`,
            "success"
          )
        } else {
          addLog(res.mensagem ?? "Erro ao finalizar", "error")
        }
      } else {
        setStatus("finalizado")
        setPostos((prev) => prev.map((p) => ({ ...p, ativo: false })))
        addLog(
          `Turno finalizado (local) - ${producao}/${meta} pecas (${percentual}%)`,
          "success"
        )
      }
    } catch (err) {
      addLog(`Erro ao finalizar turno: ${err instanceof Error ? err.message : "desconhecido"}`, "error")
    } finally {
      setLoading(false)
    }
  }, [addLog, producao, meta, percentual, backendOnline])

  const handleUpdateMeta = useCallback(
    async (novaMeta: number) => {
      if (status === "sem-turno" || status === "finalizado") {
        addLog("Nenhum turno ativo para atualizar meta", "error")
        return
      }
      try {
        if (backendOnline) {
          const res = await api.atualizarMeta(novaMeta)
          if (res.sucesso) {
            setMeta(novaMeta)
            addLog(`Meta atualizada: ${res.meta_anterior} -> ${res.meta_nova} pecas`, "success")
          } else {
            addLog(res.mensagem ?? "Erro ao atualizar meta", "error")
          }
        } else {
          setMeta(novaMeta)
          addLog(`Meta atualizada para ${novaMeta} pecas (local)`, "success")
        }
      } catch (err) {
        addLog(`Erro ao atualizar meta: ${err instanceof Error ? err.message : "desconhecido"}`, "error")
      }
    },
    [status, addLog, backendOnline]
  )

  // =============================================
  // Render
  // =============================================

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="space-y-6">
          {/* Indicador de conexao */}
          {backendOnline === false && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
              <span className="size-2 rounded-full bg-warning" />
              Backend offline - operando em modo local (sem persistencia)
            </div>
          )}

          {/* Status do turno */}
          <ShiftStatus status={status} statusText={statusTextMap[status]} />

          {/* Metricas */}
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Producao Atual"
              value={producao}
              subtitle="pecas produzidas"
              icon={BarChart3}
              accentColor="success"
            />
            <MetricCard
              title="Meta de Producao"
              value={meta}
              subtitle="pecas planejadas"
              icon={Target}
              accentColor="warning"
            />
            <ProgressCard
              percentual={percentual}
              metaAtingida={metaAtingida}
            />
          </div>

          {/* Atualizar meta inline */}
          <UpdateMeta onUpdateMeta={handleUpdateMeta} />

          {/* Postos de trabalho */}
          <WorkStationFlow postos={postos} />

          {/* Controles */}
          <ShiftControls
            status={status}
            metaInicial={metaInicial}
            onMetaInicialChange={setMetaInicial}
            onIniciar={handleIniciar}
            onPausar={handlePausar}
            onRetomar={handleRetomar}
            onFinalizar={handleFinalizar}
            loading={loading}
          />

          {/* Logs */}
          <ActivityLog logs={logs} />

          {/* Footer */}
          <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
            Sistema de Monitoramento Industrial v1.0 | Projeto Academico SENAI
          </footer>
        </div>
      </main>
    </div>
  )
}
