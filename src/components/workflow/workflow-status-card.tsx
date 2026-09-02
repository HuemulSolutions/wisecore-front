"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface WorkflowStatusCardProps {
  icon: LucideIcon
  title: React.ReactNode
  description: React.ReactNode
  /** Bloque bajo el separador (`border-t`). Si es falsy, no se renderiza ni el separador. */
  actions?: React.ReactNode
}

/**
 * Shell visual genérico para las pantallas de estado del wizard de workflow en
 * fullscreen: ícono circular + título + descripción, centrado, con un bloque
 * de acciones opcional bajo un separador. Sin i18n propio — el contenido lo
 * arma quien lo usa.
 *
 * Extraído de `WorkflowFinishedCard` (tarjetas terminales: enviado/aprobado/
 * publicado) para reutilizarlo también en `WorkflowDetailPanel` cuando el
 * usuario TODAVÍA puede avanzar el flujo o está bloqueado por respuestas
 * obligatorias en otra sección (`wizard.emptyStep.*`) — mismo look, pero con
 * el botón de avanzar en vez de "Iniciar otro activo"/"Ver mis respuestas".
 */
export function WorkflowStatusCard({ icon: Icon, title, description, actions }: WorkflowStatusCardProps) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          {actions && <div className="flex w-full flex-col gap-2 border-t pt-4">{actions}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
