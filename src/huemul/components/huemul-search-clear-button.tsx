import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface HuemulSearchClearButtonProps {
  onClear: () => void;
  /** Texto accesible; obligatorio porque el botón es solo ícono. */
  label: string;
  className?: string;
  iconClassName?: string;
}

/**
 * `HuemulSearchClearButton` — X para vaciar un buscador.
 *
 * No se posiciona a sí mismo: el call-site decide si va absoluta (input con
 * padding derecho) o como un hijo más de un contenedor flex.
 */
export function HuemulSearchClearButton({
  onClear,
  label,
  className,
  iconClassName,
}: HuemulSearchClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      // Limpiar no debe sacar el foco del input: el usuario sigue escribiendo.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      className={cn(
        "shrink-0 text-muted-foreground/60 transition-colors hover:cursor-pointer hover:text-foreground",
        className,
      )}
    >
      <X className={cn("size-3.5", iconClassName)} />
    </button>
  );
}
