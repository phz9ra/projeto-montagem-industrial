"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Pause, RotateCcw, Square, Settings } from "lucide-react"

interface ShiftControlsProps {
  status: "sem-turno" | "ativo" | "pausado" | "finalizado"
  metaInicial: number
  onMetaInicialChange: (value: number) => void
  onIniciar: () => void
  onPausar: () => void
  onRetomar: () => void
  onFinalizar: () => void
  loading?: boolean
}

export function ShiftControls({
  status,
  metaInicial,
  onMetaInicialChange,
  onIniciar,
  onPausar,
  onRetomar,
  onFinalizar,
  loading = false,
}: ShiftControlsProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Settings className="size-4" />
          Controle do Turno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          {/* Iniciar turno */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Meta Inicial
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={metaInicial}
                onChange={(e) => onMetaInicialChange(Number(e.target.value))}
                className="h-9 w-28 bg-secondary/50 tabular-nums"
              />
              <Button
                onClick={onIniciar}
                disabled={loading || status === "ativo" || status === "pausado"}
                className="gap-2 bg-success text-success-foreground hover:bg-success/90"
              >
                <Play className="size-4" />
                Iniciar
              </Button>
            </div>
          </div>

          {/* Separador */}
          <div className="hidden h-9 w-px bg-border md:block" />

          {/* Pausar / Retomar */}
          {status === "pausado" ? (
            <Button
              onClick={onRetomar}
              disabled={loading}
              variant="outline"
              className="gap-2 border-info/30 text-info hover:bg-info/10"
            >
              <RotateCcw className="size-4" />
              Retomar
            </Button>
          ) : (
            <Button
              onClick={onPausar}
              disabled={loading || status !== "ativo"}
              variant="outline"
              className="gap-2 border-warning/30 text-warning hover:bg-warning/10"
            >
              <Pause className="size-4" />
              Pausar
            </Button>
          )}

          {/* Finalizar */}
          <Button
            onClick={onFinalizar}
            disabled={loading || (status !== "ativo" && status !== "pausado")}
            variant="outline"
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Square className="size-4" />
            Finalizar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
