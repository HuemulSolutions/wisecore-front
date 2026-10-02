import * as React from "react"
import type { LucideIcon } from "lucide-react"

export interface HuemulDialogFooterAction {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  className?: string;
  closeOnSuccess?: boolean;
}

export interface HuemulDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  showCloseButton?: boolean;
  /** Cuerpo cargando: skeleton en vez de `children` y guardar/acciones extra deshabilitados. */
  bodyLoading?: boolean;
  /** Skeleton propio para `bodyLoading` (por defecto, 6 filas genéricas). */
  bodySkeleton?: React.ReactNode;
  showFooter?: boolean;
  showCancelButton?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  saveAction?: HuemulDialogFooterAction;
  extraActions?: HuemulDialogFooterAction[];
  closeDelay?: number;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  footerLeft?: React.ReactNode;
  /**
   * A dónde vuelve el foco al cerrar. Radix lo devuelve al `DialogTrigger`; un diálogo
   * sin trigger (abierto desde un store) lo necesita para no dejarlo en `<body>`.
   */
  onCloseAutoFocus?: (event: Event) => void;
  children: React.ReactNode;
}
