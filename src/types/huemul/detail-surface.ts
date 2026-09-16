import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { HuemulSheetSize } from './sheet'

/**
 * `page` — página completa (`HuemulPageLayout` + `PageHeader`), con URL propia
 * y botón de volver. `sheet` — drawer ancho (`HuemulSheet`) sobre la pantalla
 * actual, sin URL.
 *
 * Mismo criterio de naming que `HuemulAccessDeniedProps.variant`.
 */
export type HuemulDetailSurfaceVariant = "page" | "sheet";

/**
 * Tope de ancho del contenido. `reader` para texto largo, `full` para todo lo
 * demás (un contenido que necesita repartirse a lo ancho es un grid, no un
 * tope). Los valores viven en `HUEMUL_CONTENT_WIDTH` (`src/huemul/constants.ts`).
 */
export type HuemulContentWidth = "reader" | "full";

export type HuemulContentAlign = "start" | "center";

export interface HuemulDetailSurfaceTab {
  value: string;
  label: string;
  content: ReactNode;
  /** Clase del `TabsContent`: cada tab decide su propio scroll y padding. */
  className?: string;
  /**
   * Límite de ancho del contenido de este tab. Default `"full"` (sin límite),
   * así que adoptarlo es explícito — pero un tab con filas de acciones que se
   * deja en `"full"` manda sus botones al borde de la pantalla en un monitor
   * ancho. Elegir siempre a conciencia.
   */
  contentWidth?: HuemulContentWidth;
  /** Alineación del contenido acotado. Default `"start"`. */
  contentAlign?: HuemulContentAlign;
}

/**
 * Zona de guardado de la superficie. Se traduce al footer sticky nativo en
 * `variant="sheet"` y a un `HuemulPanelSaveBar` en `variant="page"`.
 *
 * `discardLabel`/`onDiscard` solo se renderizan en `variant="page"`: el sheet
 * no tiene botón de descartar — ahí el descarte pasa por el guard de cierre del
 * consumidor.
 */
export interface HuemulDetailSurfaceSaveBar {
  isDirty: boolean;
  /** Gate adicional de validación. Por defecto, igual a `isDirty`. */
  canSave?: boolean;
  isSaving?: boolean;
  /** Resumen de lo pendiente. Solo se muestra si `isDirty`. */
  dirtyLabel?: string;
  saveLabel: string;
  discardLabel: string;
  onSave: () => void;
  onDiscard: () => void;
}

export interface HuemulDetailSurfaceBackAction {
  label: string;
  onClick: () => void;
}

export interface HuemulDetailSurfaceProps {
  /** Default `"sheet"` — la superficie con la que nacieron los consumidores. */
  variant?: HuemulDetailSurfaceVariant;
  icon: LucideIcon;
  title: string;
  /** Bajo el título. Acepta JSX (ej. punto de color + nombre de la entidad). */
  subtitle?: ReactNode;
  /**
   * Tabs de la superficie. El estado es **controlado** (`activeTab` +
   * `onTabChange`): el sheet suele guardarlo en `useState` y la página en la
   * URL (`useUrlTab`), y ese es justamente el punto donde el consumidor
   * intercepta el cambio con su guard de cambios sin guardar.
   */
  tabs?: HuemulDetailSurfaceTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  /** Solo `variant="page"`. En sheet se ignora: ahí cierra la X nativa. */
  backAction?: HuemulDetailSurfaceBackAction;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  saveBar?: HuemulDetailSurfaceSaveBar;
  /** Reemplaza la zona de guardado por contenido a medida. */
  footerContent?: ReactNode;
  /** Solo `variant="sheet"`: label del botón de cerrar del footer. */
  closeLabel?: string;
  /** Solo `variant="sheet"`. */
  open?: boolean;
  /** Solo `variant="sheet"`. */
  onOpenChange?: (open: boolean) => void;
  /** Solo `variant="sheet"`. Default `"wide"`. */
  size?: HuemulSheetSize;
  className?: string;
  bodyClassName?: string;
  /** Contenido sin tabs. Se ignora si viene `tabs`. */
  children?: ReactNode;
}
