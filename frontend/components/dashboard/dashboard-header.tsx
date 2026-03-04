import { Factory } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Factory className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Sistema de Monitoramento Industrial
            </h1>
            <p className="text-xs text-muted-foreground">
              Controle de Producao por Postos
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary border border-primary/20">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Monitoramento Ativo
          </div>
        </div>
      </div>
    </header>
  )
}
