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
  description?: string;
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
  headerExtra?: ReactNode;
  footerLeft?: ReactNode;
  children: ReactNode;
}
