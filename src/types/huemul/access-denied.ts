import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export interface HuemulAccessDeniedProps {
  /** Título mostrado. Default: t('common:accessDenied') */
  title?: string
  /** Descripción mostrada. Default: t('common:noPermission') */
  description?: string
  /**
   * 'page': tarjeta centrada a pantalla completa (uso a nivel de página).
   * 'inline': rellena el contenedor padre, sin forzar alto de pantalla completa
   * (uso dentro de paneles/tabs).
   */
  variant?: "page" | "inline"
  /** Icono a mostrar. Default: ShieldAlert */
  icon?: LucideIcon
  /** Acción opcional (ej. botón "Volver a inicio") */
  action?: ReactNode
  /** className adicional para el wrapper externo */
  className?: string
}
