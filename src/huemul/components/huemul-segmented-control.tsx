import { cn } from "@/lib/utils"

export interface HuemulSegmentedOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface HuemulSegmentedControlProps<T extends string = string> {
  value: T
  options: HuemulSegmentedOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  /** Etiqueta accesible del grupo (el control se expone como `radiogroup`). */
  ariaLabel?: string
  className?: string
  optionClassName?: string
}

/**
 * `HuemulSegmentedControl` — control segmentado genérico: un track gris con un
 * thumb blanco sobre la opción activa. Sustituye a los grupos de radios cuando
 * las opciones son pocas y excluyentes (por ejemplo Manual / Automático).
 *
 * A diferencia de `HuemulViewToggle` (fijo a grid/list, icon-only), este acepta
 * cualquier lista de opciones con texto.
 *
 * @example
 * ```tsx
 * <HuemulSegmentedControl
 *   value={mode}
 *   options={[{ value: "manual", label: "Manual" }, { value: "automatic", label: "Automático" }]}
 *   onChange={setMode}
 * />
 * ```
 */
export function HuemulSegmentedControl<T extends string = string>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  className,
  optionClassName,
}: HuemulSegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "grid w-full gap-1 rounded-[8px] bg-[#f1f4f8] p-[3px]",
        disabled && "opacity-60",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isActive = option.value === value
        const isDisabled = disabled || option.disabled
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled || isActive) return
              onChange(option.value)
            }}
            className={cn(
              "h-[26px] rounded-[6px] px-3 text-[12.5px] font-medium transition-colors",
              isActive
                ? "bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                : "text-[#64748b] hover:text-[#334155]",
              isDisabled ? "cursor-not-allowed" : "hover:cursor-pointer",
              optionClassName,
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
