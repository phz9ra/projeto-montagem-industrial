"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { TrendingUp, CheckCircle2, Timer } from "lucide-react"

interface ProgressCardProps {
  percentual: number
  metaAtingida: boolean
}

export function ProgressCard({ percentual, metaAtingida }: ProgressCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="size-4" />
            Progresso
          </CardTitle>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {percentual}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress
            value={Math.min(percentual, 100)}
            className="h-3 bg-secondary"
          />
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
              metaAtingida
                ? "bg-success/10 text-success border border-success/20"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {metaAtingida ? (
              <>
                <CheckCircle2 className="size-4" />
                Meta Atingida!
              </>
            ) : (
              <>
                <Timer className="size-4" />
                Aguardando inicio
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
