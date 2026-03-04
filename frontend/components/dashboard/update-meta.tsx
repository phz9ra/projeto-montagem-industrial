"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, RefreshCw } from "lucide-react"
import { useState } from "react"

interface UpdateMetaProps {
  onUpdateMeta: (value: number) => void
}

export function UpdateMeta({ onUpdateMeta }: UpdateMetaProps) {
  const [novaMeta, setNovaMeta] = useState("")

  const handleUpdate = () => {
    const value = parseInt(novaMeta)
    if (value && value > 0) {
      onUpdateMeta(value)
      setNovaMeta("")
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="py-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-warning/20 bg-warning/10">
            <Target className="size-4 text-warning" />
          </div>
          <p className="text-sm text-muted-foreground">Atualizar Meta</p>
          <div className="ml-auto flex gap-2">
            <Input
              type="number"
              min={1}
              placeholder="Nova meta"
              value={novaMeta}
              onChange={(e) => setNovaMeta(e.target.value)}
              className="h-9 w-28 bg-secondary/50 tabular-nums"
            />
            <Button
              onClick={handleUpdate}
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="size-3.5" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
