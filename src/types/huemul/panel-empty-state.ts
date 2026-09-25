import type React from 'react'

export interface HuemulPanelEmptyStateProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  title: string
  /** Una frase que explica para qué sirve la sección. */
  description: string
  /** CTA azul primario — omitirlo cuando el usuario no tiene permiso de crear. */
  action?: {
    label: string
    onClick: () => void
  }
  /** Segunda acción (botón outline), junto al CTA primario. */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Línea gris de ayuda secundaria, debajo del CTA. */
  hint?: string
  className?: string
}
