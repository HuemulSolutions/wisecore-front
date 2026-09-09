import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type HuemulSheetSize = "sm" | "md" | "lg" | "xl" | "2xl" | "wide";

/**
 * `plain` (default) — icono suelto junto al título, como siempre.
 * `tile` — icono dentro de un cuadrado de 30px con fondo, título 16px y
 * descripción 13px. Usado por los sheets de configuración rediseñados.
 */
export type HuemulSheetIconVariant = "plain" | "tile";

export interface HuemulSheetAction {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  closeOnSuccess?: boolean;
  position?: "header" | "footer";
}

export interface HuemulSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eyebrow?: string;
  /** Texto simple o contenido enriquecido (ej. punto de color + nombre + contador). */
  description?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  iconVariant?: HuemulSheetIconVariant;
  bodyLoading?: boolean;
  showFooter?: boolean;
  showCancelButton?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  saveAction?: HuemulSheetAction;
  extraActions?: HuemulSheetAction[];
  closeDelay?: number;
  side?: "top" | "right" | "bottom" | "left";
  maxWidth?: string;
  size?: HuemulSheetSize;
  className?: string;
  bodyClassName?: string;
  /**
   * Omite el `border-b` por defecto del header. Usar cuando el contenido del
   * sheet ya dibuja su propio separador debajo del header (ej. tabs con
   * `border-b` propio bajo el `TabsList`), para evitar un doble borde.
   */
  hideHeaderBorder?: boolean;
  headerExtra?: ReactNode;
  footerLeft?: ReactNode;
  /**
   * Reemplaza todo el bloque visual `icon + title + description` del header
   * por contenido a medida (ej. avatar con imagen, badges). `title` sigue
   * siendo obligatorio: se renderiza igual pero visualmente oculto
   * (`sr-only`), porque Radix exige un `Dialog.Title` en el árbol. Cuando se
   * pasa, `icon`/`eyebrow`/`description` se ignoran. La fila de acciones del
   * header (`extraActions` con `position: "header"`, `saveAction` en header,
   * `headerExtra`) no se ve afectada.
   */
  headerContent?: ReactNode;
  /**
   * Reemplaza todo el footer (cancelar, `saveAction`, `extraActions`,
   * `footerLeft`) por contenido a medida, sin el wrapper sticky/borde/padding
   * por defecto — el contenido controla su propio layout. Útil cuando el
   * footer no es una sola acción sino varios bloques condicionales
   * apilados. Cuando se pasa, `showFooter`/`saveAction`/`extraActions`/
   * `footerLeft`/`cancelLabel` se ignoran.
   */
  footerContent?: ReactNode;
  onOpenAutoFocus?: (event: Event) => void;
  children: ReactNode;
}
