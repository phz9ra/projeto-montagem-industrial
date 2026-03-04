"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  accentColor?: "success" | "warning" | "info" | "primary"
  children?: React.ReactNode
}

const colorMap = {
  success: {
    icon: "text-success",
    value: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
  warning: {
    icon: "text-warning",
    value: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
  info: {
    icon: "text-info",
    value: "text-info",
    bg: "bg-info/10",
    border: "border-info/20",
  },
  primary: {
    icon: "text-primary",
    value: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = "primary",
  children,
}: MetricCardProps) {
  const colors = colorMap[accentColor]

  return (
    <Card className="group border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border">
      <CardContent className="py-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={cn(
                "mt-2 text-4xl font-bold tracking-tight tabular-nums",
                colors.value
              )}
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border",
              colors.bg,
              colors.border
            )}
          >
            <Icon className={cn("size-5", colors.icon)} />
          </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  )
}
