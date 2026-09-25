export interface HuemulTagChipProps {
  label: string
  /** Color libre (hex u otro). Fallback visual si no se envía o es inválido. */
  color?: string | null
  /** Si se pasa, muestra una X que la dispara. Omitir para chip de solo lectura. */
  onRemove?: () => void
  disabled?: boolean
  size?: "sm" | "md"
  className?: string
  /** aria-label del botón de quitar. Default: `common:close` (el componente es de dominio genérico y no puede asumir un namespace de negocio). */
  removeLabel?: string
}
