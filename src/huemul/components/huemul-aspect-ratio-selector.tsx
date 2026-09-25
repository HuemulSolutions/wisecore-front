import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface HuemulAspectRatioOption<T extends string = string> {
  /** Ratio en formato "w:h" — se parsea para dibujar el proxy visual. */
  value: T
  /** Texto visible en la tarjeta. Default: el propio `value`. */
  label?: string
  /** Nombre descriptivo para tooltip / aria-label (ej. "Horizontal (16:9)"). */
  title?: string
}

export interface HuemulAspectRatioSelectorProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: readonly HuemulAspectRatioOption<T>[]
  label?: string
  disabled?: boolean
  /** Columnas de la grid. Default 3. */
  columns?: 3 | 4 | 5
  /** Lado máximo (px) del rectángulo proxy. Default 28. */
  proxySize?: number
  className?: string
  /** aria-label del grupo cuando no se pasa `label`. */
  ariaLabel?: string
}

const GRID_COLS: Record<3 | 4 | 5, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
}

/**
 * `HuemulAspectRatioSelector` — grid de tarjetas para elegir una relación de
 * aspecto ("w:h"). Cada tarjeta dibuja un rectángulo proxy con el ratio real,
 * fijando el eje mayor para que `aspect-ratio` nunca se distorsione.
 *
 * @example
 * ```tsx
 * <HuemulAspectRatioSelector
 *   label={t("generate.format")}
 *   value={aspectRatio}
 *   onChange={setAspectRatio}
 *   options={IMAGE_ASPECT_RATIOS.map((r) => ({ value: r, label: r }))}
 * />
 * ```
 */
export function HuemulAspectRatioSelector<T extends string = string>({
  value,
  onChange,
  options,
  label,
  disabled,
  columns = 3,
  proxySize = 28,
  className,
  ariaLabel,
}: HuemulAspectRatioSelectorProps<T>) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label && (
        <Label className={cn("text-sm font-medium leading-snug", disabled && "opacity-50")}>
          {label}
        </Label>
      )}
      <div role="group" aria-label={ariaLabel ?? label} className={cn("grid gap-2", GRID_COLS[columns])}>
        {options.map((opt) => {
          const isSelected = opt.value === value
          const [w, h] = opt.value.split(":").map(Number)

          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              aria-label={opt.title ?? opt.value}
              title={opt.title ?? opt.value}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex min-w-0 flex-col items-center justify-end gap-1.5 rounded-lg border bg-card px-1.5 py-2 transition-colors hover:cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-accent/40",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <span
                className="flex items-center justify-center"
                style={{ width: proxySize, height: proxySize }}
              >
                <span
                  aria-hidden
                  style={{ aspectRatio: `${w} / ${h}` }}
                  className={cn(
                    "rounded-[3px] border-2 transition-colors",
                    w >= h ? "h-auto w-full" : "h-full w-auto",
                    isSelected
                      ? "border-primary bg-primary/25"
                      : "border-muted-foreground/45 bg-muted-foreground/10",
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium leading-none tabular-nums",
                  isSelected ? "text-primary" : "text-muted-foreground",
                )}
              >
                {opt.label ?? opt.value}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
