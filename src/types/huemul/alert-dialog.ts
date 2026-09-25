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
  /**
   * Texto del botón mientras la acción está en curso.
   * Si se omite y `actionLabel` es el «Eliminar» de `common:delete`,
   * se usa `common:deleting` automáticamente; en cualquier otro caso
   * se conserva `actionLabel` (comportamiento previo).
   */
  loadingLabel?: string;
  onAction: () => Promise<void>;
  actionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  actionIcon?: LucideIcon;
  cancelLabel?: string;
  successDelay?: number;
  /**
   * Si es false, cierra apenas resuelve onAction sin pasar por el estado
   * "success" (check + "Listo"). Usar en diálogos que viven siempre
   * montados (ej. providers persistentes): ahí Radix mantiene el contenido
   * visible ~200ms durante la animación de salida, y "success" alcanza a
   * repintarse en pleno fade-out. Default true — no afecta a los diálogos
   * que hoy dependen de mostrar el check antes de cerrar.
   */
  showSuccessState?: boolean;
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
