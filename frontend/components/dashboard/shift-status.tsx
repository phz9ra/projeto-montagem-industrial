"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Pause, Power, Clock } from "lucide-react"

type ShiftStatus = "sem-turno" | "ativo" | "pausado" | "finalizado"

interface ShiftStatusProps {
  status: ShiftStatus
  statusText: string
}

const statusConfig: Record<
  ShiftStatus,
  { label: string; icon: React.ElementType; className: string; dotClass: string }
> = {
  "sem-turno": {
    label: "SEM TURNO",
    icon: Power,
    className: "bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  ativo: {
    label: "TURNO ATIVO",
    icon: Activity,
    className: "bg-success/10 text-success border border-success/20",
    dotClass: "bg-success animate-pulse",
  },
  pausado: {
    label: "TURNO PAUSADO",
    icon: Pause,
    className: "bg-warning/10 text-warning border border-warning/20",
    dotClass: "bg-warning",
  },
  finalizado: {
    label: "TURNO FINALIZADO",
    icon: Clock,
    className: "bg-destructive/10 text-destructive border border-destructive/20",
    dotClass: "bg-destructive",
  },
}

export function ShiftStatus({ status, statusText }: ShiftStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="flex items-center justify-between py-0">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
            <Icon className="size-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status do Turno</p>
            <p className="text-sm text-foreground">{statusText}</p>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wider",
            config.className
          )}
        >
          <span className={cn("size-2 rounded-full", config.dotClass)} />
          {config.label}
        </div>
      </CardContent>
    </Card>
  )
}
