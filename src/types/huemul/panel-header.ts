import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export interface PanelHeaderSearchConfig {
  /** Valor del input (estado del consumidor) */
  value: string
  /** Cada pulsación de tecla */
  onChange: (value: string) => void
  /**
   * Commit de la búsqueda (Enter). Cuando se define, el consumidor decide
   * cuándo pega el servidor; sin él, `onChange` es el único canal.
   */
  onCommit?: (value: string) => void
  placeholder: string
  /**
   * Deja el input siempre visible en vez de detrás del botón de lupa.
   * Por defecto la búsqueda es un toggle, para no gastar alto del panel.
   */
  alwaysOpen?: boolean
  /**
   * Estado abierto/cerrado del toggle. Se pasa solo cuando el consumidor ya
   * guarda ese estado fuera (contexto), para que sobreviva a un remontaje del
   * panel; omitido, el componente lo maneja internamente.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface HuemulPanelHeaderProps {
  /** Título de la sección del panel */
  title: string
  /** Icono opcional a la izquierda del título */
  icon?: LucideIcon
  /** Búsqueda del panel; si se omite no se renderiza el botón de lupa */
  search?: PanelHeaderSearchConfig
  /**
   * Refresco del contenido del panel. Se omite cuando la página ya ofrece un
   * refresh en su `PageHeader`: un botón por contenedor, no por endpoint.
   */
  onRefresh?: () => void | Promise<void>
  /** Estado de carga del refresh (spinner) */
  isRefreshing?: boolean
  /** Acciones extra a la derecha (por ejemplo, un menú de "crear") */
  actions?: ReactNode
  /** Clase del contenedor externo */
  className?: string
}
