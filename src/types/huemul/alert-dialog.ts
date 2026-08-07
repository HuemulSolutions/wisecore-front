import type { LucideIcon } from 'lucide-react'

export type ActionState = "idle" | "loading" | "success";

export interface HuemulAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  actionLabel?: string;
  onAction: () => Promise<void>;
  actionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  actionIcon?: LucideIcon;
  cancelLabel?: string;
  successDelay?: number;
  className?: string;
  /**
   * Bloque de alerta destacado que se renderiza sobre la descripción.
   * Uso típico: el primer intento de borrado falló porque la entidad está en
   * uso y hay que re-confirmar con `force`. Sin esto, el error obligaría a
   * reemplazar la `description` y el dialog se leería como otro dialog.
   */
  alert?: {
    title?: string;
    description?: React.ReactNode;
    icon?: LucideIcon;
  };
}
