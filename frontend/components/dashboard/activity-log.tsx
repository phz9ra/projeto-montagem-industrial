"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FileText } from "lucide-react"

export interface LogEntry {
  id: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: string
}

interface ActivityLogProps {
  logs: LogEntry[]
}

const typeStyles = {
  info: "border-l-info/50 bg-info/5",
  success: "border-l-success/50 bg-success/5",
  warning: "border-l-warning/50 bg-warning/5",
  error: "border-l-destructive/50 bg-destructive/5",
}

const typeTextStyles = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
}

export function ActivityLog({ logs }: ActivityLogProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <FileText className="size-4" />
          Log de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[240px]">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Nenhuma atividade registrada ainda...
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border-l-2 px-3 py-2 font-mono text-xs transition-colors",
                    typeStyles[log.type]
                  )}
                >
                  <span className="shrink-0 text-muted-foreground">
                    [{log.timestamp}]
                  </span>
                  <span className={cn("break-all", typeTextStyles[log.type])}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
