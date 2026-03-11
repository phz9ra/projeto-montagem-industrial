'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  iniciarTurno,
  pausarTurno,
  retomarTurno,
  finalizarTurno,
  obterProducaoAtual,
  obterUltimoPosto,
  atualizarMeta,
  type ProducaoAtual,
} from '@/lib/api';

// ─── Tipos locais ────────────────────────────────────────────────────────────

interface PostoStatus {
  id: number;
  nome: string;
  label: string;
  status: 'aguardando' | 'em_operacao' | 'concluido';
  total: number;
}

interface LogEntry {
  ts: string;
  msg: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

function agora(): string {
  return new Date().toLocaleTimeString('pt-BR');
}

function fmtStatus(s: string | undefined): string {
  if (!s) return 'SEM TURNO';
  if (s === 'ativo') return 'ATIVO';
  if (s === 'pausado') return 'PAUSADO';
  if (s === 'finalizado') return 'FINALIZADO';
  return s.toUpperCase();
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | undefined }) {
  const color =
    status === 'ativo'
      ? 'text-green-400 bg-green-400/10 border-green-400/30'
      : status === 'pausado'
      ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      : status === 'finalizado'
      ? 'text-red-400 bg-red-400/10 border-red-400/30'
      : 'text-zinc-400 bg-zinc-700/30 border-zinc-600/30';

  const dot =
    status === 'ativo'
      ? 'bg-green-400'
      : status === 'pausado'
      ? 'bg-yellow-400'
      : status === 'finalizado'
      ? 'bg-red-400'
      : 'bg-zinc-500';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-widest ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {fmtStatus(status)}
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  valueColor = 'text-green-400',
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-sm font-medium">{label}</span>
        <span className="text-zinc-500">{icon}</span>
      </div>
      <p className={`text-5xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="text-zinc-500 text-xs">{sub}</p>
    </div>
  );
}

function ProgressCard({ percent }: { percent: number }) {
  const clamped = Math.min(percent, 100);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
          {/* trend-up icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          Progresso
        </div>
        <span className="text-white font-bold text-lg">{clamped.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-green-500 transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex items-center gap-2 text-zinc-500 text-xs bg-zinc-800 rounded-lg px-3 py-2">
        {/* clock icon */}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {clamped >= 100 ? 'Meta atingida!' : clamped > 0 ? 'Em andamento' : 'Aguardando inicio'}
      </div>
    </div>
  );
}

function PostoCard({ posto }: { posto: PostoStatus }) {
  const isAtivo = posto.status === 'em_operacao';
  const isConcluido = posto.status === 'concluido';

  const ring = isAtivo
    ? 'border-green-500/50 shadow-green-500/20 shadow-lg'
    : isConcluido
    ? 'border-zinc-600'
    : 'border-zinc-700';

  const numBg = isAtivo
    ? 'bg-green-500/20 text-green-400'
    : isConcluido
    ? 'bg-zinc-700 text-zinc-300'
    : 'bg-zinc-800 text-zinc-400';

  const dotColor = isAtivo
    ? 'bg-green-400 shadow-green-400/50 shadow-sm'
    : isConcluido
    ? 'bg-zinc-400'
    : 'bg-zinc-600';

  const statusLabel = isAtivo
    ? 'Em operação'
    : isConcluido
    ? `Concluido (${posto.total})`
    : 'Aguardando...';

  return (
    <div className={`bg-zinc-900 border rounded-xl p-5 flex flex-col items-center gap-3 transition-all duration-300 ${ring}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${numBg}`}>
        {posto.id}
      </div>
      <p className="text-white text-sm font-semibold">{posto.label}</p>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        {statusLabel}
      </div>
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const msgColor =
    entry.type === 'success'
      ? 'text-green-400'
      : entry.type === 'warning'
      ? 'text-yellow-400'
      : entry.type === 'error'
      ? 'text-red-400'
      : 'text-cyan-400';

  return (
    <div className="flex items-start gap-2 text-xs font-mono border-l-2 border-zinc-700 pl-3 py-0.5">
      <span className="text-zinc-500 shrink-0">[{entry.ts}]</span>
      <span className={msgColor}>{entry.msg}</span>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Home() {
  const [producao, setProducao] = useState<ProducaoAtual | null>(null);
  const [postos, setPostos] = useState<PostoStatus[]>([
    { id: 1, nome: 'Posto Inicial', label: 'Posto Inicial', status: 'aguardando', total: 0 },
    { id: 2, nome: 'Montagem', label: 'Montagem', status: 'aguardando', total: 0 },
    { id: 3, nome: 'Finalizacao', label: 'Finalizacao', status: 'aguardando', total: 0 },
  ]);
  const [log, setLog] = useState<LogEntry[]>([
    { ts: agora(), msg: 'Sistema iniciado', type: 'info' },
  ]);
  const [metaInput, setMetaInput] = useState('100');
  const [novaMetaInput, setNovaMetaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
    setLog(prev => [{ ts: agora(), msg, type }, ...prev].slice(0, 100));
  }, []);

  // Atualiza dados da produção e status dos postos
  const atualizarDados = useCallback(async () => {
    // 1. Produção geral
    try {
      const resp = await obterProducaoAtual();
      if (resp.sucesso && resp.producao) {
        setProducao(resp.producao);
      } else {
        setProducao(null);
      }
    } catch {
      // silencioso
    }

    // 2. Status dos postos usando o endpoint /sensor/ultimo
    try {
      const ult = await obterUltimoPosto();
      if (!ult.sucesso) return;

      if (!ult.turno_ativo) {
        // Nenhum turno ativo: resetar todos para aguardando
        setPostos(prev => prev.map(p => ({ ...p, status: 'aguardando', total: 0 })));
        return;
      }

      const ultimo = ult.ultimo_posto; // 0 = nenhum ainda

      setPostos(prev =>
        prev.map(p => {
          if (ultimo === 0) {
            // Turno ativo mas nenhum evento registrado ainda
            return { ...p, status: 'aguardando', total: 0 };
          }
          if (p.id === ultimo) {
            // Este foi o último posto acionado — mostra como ativo
            return { ...p, status: 'em_operacao' };
          }
          if (p.id < ultimo) {
            // Postos anteriores na sequência — concluídos nesta peça
            return { ...p, status: 'concluido' };
          }
          // Postos após o último — aguardando
          return { ...p, status: 'aguardando' };
        })
      );
    } catch {
      // sem turno ativo ou erro de rede
    }
  }, []);

  useEffect(() => {
    atualizarDados();
    const id = setInterval(atualizarDados, 2000);
    return () => clearInterval(id);
  }, [atualizarDados]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleIniciar = async () => {
    const meta = parseInt(metaInput, 10);
    if (!meta || meta <= 0) return;
    setLoading(true);
    try {
      const r = await iniciarTurno(meta);
      if (r.sucesso) {
        addLog(`Turno iniciado (local) com meta de ${meta} pecas`, 'success');
        await atualizarDados();
      } else {
        addLog(r.mensagem ?? 'Erro ao iniciar turno', 'error');
      }
    } catch (e: unknown) {
      addLog(e instanceof Error ? e.message : 'Erro ao iniciar turno', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePausar = async () => {
    setLoading(true);
    try {
      const r = await pausarTurno();
      if (r.sucesso) {
        addLog('Turno pausado (local)', 'warning');
        await atualizarDados();
      } else {
        addLog(r.mensagem ?? 'Erro ao pausar', 'error');
      }
    } catch (e: unknown) {
      addLog(e instanceof Error ? e.message : 'Erro ao pausar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetomar = async () => {
    setLoading(true);
    try {
      const r = await retomarTurno();
      if (r.sucesso) {
        addLog('Turno retomado (local)', 'success');
        await atualizarDados();
      } else {
        addLog(r.mensagem ?? 'Erro ao retomar', 'error');
      }
    } catch (e: unknown) {
      addLog(e instanceof Error ? e.message : 'Erro ao retomar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = async () => {
    if (!confirm('Deseja finalizar o turno atual?')) return;
    setLoading(true);
    try {
      const r = await finalizarTurno();
      if (r.sucesso) {
        addLog(
          `Turno finalizado | Producao: ${r.turno?.producao_realizada ?? '?'}/${r.turno?.meta_producao ?? '?'}`,
          'success'
        );
        setPostos(prev => prev.map(p => ({ ...p, status: 'aguardando', total: 0 })));
        await atualizarDados();
      } else {
        addLog(r.mensagem ?? 'Erro ao finalizar', 'error');
      }
    } catch (e: unknown) {
      addLog(e instanceof Error ? e.message : 'Erro ao finalizar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarMeta = async () => {
    const v = parseInt(novaMetaInput, 10);
    if (!v || v <= 0) return;
    setLoading(true);
    try {
      const r = await atualizarMeta(v);
      if (r.sucesso) {
        addLog(`Meta atualizada: ${r.meta_anterior} → ${r.meta_nova}`, 'success');
        setNovaMetaInput('');
        await atualizarDados();
      } else {
        addLog(r.mensagem ?? 'Erro ao atualizar meta', 'error');
      }
    } catch (e: unknown) {
      addLog(e instanceof Error ? e.message : 'Erro ao atualizar meta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Valores calculados ────────────────────────────────────────────────────

  const turnoStatus = producao?.status;
  const producaoAtual = producao?.producao_realizada ?? 0;
  const metaAtual = producao?.meta_producao ?? 0;
  const percentual = producao?.percentual_atingido ?? 0;
  const estaAtivo = turnoStatus === 'ativo';
  const estaPausado = turnoStatus === 'pausado';
  const temTurno = estaAtivo || estaPausado;

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── HEADER ── */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
              {/* factory icon */}
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 21V10l7-7 7 7v11M9 21v-4h6v4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none">Sistema de Monitoramento Industrial</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Controle de Producao por Postos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Monitoramento Ativo
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">

        {/* ── STATUS DO TURNO ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Status do Turno</p>
              <p className="text-sm font-semibold text-white">
                {temTurno ? 'Turno em andamento' : 'Nenhum turno ativo no momento'}
              </p>
            </div>
          </div>
          <StatusBadge status={turnoStatus} />
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Producao Atual"
            value={producaoAtual}
            sub="pecas produzidas"
            valueColor="text-green-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2l2 5 4-10 3 7 2-2h5" />
              </svg>
            }
          />
          <KpiCard
            label="Meta de Producao"
            value={metaAtual}
            sub="pecas planejadas"
            valueColor="text-yellow-400"
            icon={
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            }
          />
          <ProgressCard percent={percentual} />
        </div>

        {/* ── ATUALIZAR META ── */}
        {temTurno && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-yellow-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
              </svg>
              <span className="text-white text-sm font-medium">Atualizar Meta</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Nova meta"
                value={novaMetaInput}
                onChange={e => setNovaMetaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAtualizarMeta()}
                min={1}
                className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition"
              />
              <button
                onClick={handleAtualizarMeta}
                disabled={loading || !novaMetaInput}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </div>
          </div>
        )}

        {/* ── STATUS DOS POSTOS ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            Status dos Postos de Trabalho
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <PostoCard posto={postos[0]} />
            </div>
            <svg className="w-5 h-5 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <div className="flex-1">
              <PostoCard posto={postos[1]} />
            </div>
            <svg className="w-5 h-5 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <div className="flex-1">
              <PostoCard posto={postos[2]} />
            </div>
          </div>
        </div>

        {/* ── CONTROLE DO TURNO ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Controle do Turno
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 font-medium">Meta Inicial</label>
              <input
                type="number"
                value={metaInput}
                onChange={e => setMetaInput(e.target.value)}
                min={1}
                disabled={temTurno}
                className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 focus:outline-none focus:border-green-500 transition"
              />
            </div>

            {/* Iniciar */}
            <button
              onClick={handleIniciar}
              disabled={loading || temTurno}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Iniciar
            </button>

            {/* Pausar / Retomar */}
            {estaAtivo && (
              <button
                onClick={handlePausar}
                disabled={loading}
                className="flex items-center gap-2 border border-yellow-500/50 hover:bg-yellow-500/10 disabled:opacity-50 text-yellow-400 font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Pausar
              </button>
            )}
            {estaPausado && (
              <button
                onClick={handleRetomar}
                disabled={loading}
                className="flex items-center gap-2 border border-zinc-500/50 hover:bg-zinc-700/50 disabled:opacity-50 text-zinc-300 font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retomar
              </button>
            )}

            {/* Finalizar */}
            <button
              onClick={handleFinalizar}
              disabled={loading || !temTurno}
              className="flex items-center gap-2 border border-red-500/50 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Finalizar
            </button>
          </div>
        </div>

        {/* ── LOG DE ATIVIDADES ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Log de Atividades
          </div>
          <div
            ref={logRef}
            className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700"
          >
            {log.map((e, i) => (
              <LogLine key={i} entry={e} />
            ))}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-800 mt-8 py-4 text-center text-xs text-zinc-600">
        Sistema de Monitoramento Industrial v1.0 |{' '}
        <span className="text-green-700">Projeto Academico SENAI</span>
      </footer>
    </div>
  );
}
