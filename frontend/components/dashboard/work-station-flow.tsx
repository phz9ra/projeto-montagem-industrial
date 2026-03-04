"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Wrench, ChevronRight } from "lucide-react"

interface Posto {
  id: number
  nome: string
  ativo: boolean
}

interface WorkStationFlowProps {
  postos: Posto[]
}

export function WorkStationFlow({ postos }: WorkStationFlowProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Wrench className="size-4" />
          Status dos Postos de Trabalho
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {postos.map((posto, index) => (
            <div key={posto.id} className="flex items-center gap-2 md:gap-4">
              <div
                className={cn(
                  "group relative flex min-w-[120px] flex-col items-center gap-3 rounded-xl border p-4 transition-all md:min-w-[160px] md:p-6",
                  posto.ativo
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(0,200,120,0.1)]"
                    : "border-border/50 bg-secondary/50"
                )}
              >
                {/* Numero do posto */}
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full text-sm font-bold md:size-12 md:text-base",
                    posto.ativo
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {posto.id}
                </div>

                {/* Nome */}
                <span
                  className={cn(
                    "text-center text-xs font-medium md:text-sm",
                    posto.ativo ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {posto.nome}
                </span>

                {/* Indicador */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      posto.ativo
                        ? "bg-primary animate-pulse"
                        : "bg-muted-foreground/30"
                    )}
                  />
                  <span className="text-[10px] text-muted-foreground md:text-xs">
                    {posto.ativo ? "Em operacao" : "Aguardando..."}
                  </span>
                </div>
              </div>

              {/* Seta entre postos */}
              {index < postos.length - 1 && (
                <ChevronRight className="size-5 shrink-0 text-muted-foreground/50 md:size-6" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
