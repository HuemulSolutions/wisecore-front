import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HuemulOptionCard, HuemulOptionCardGroupProps } from "@/types/huemul/option-card-group";
export type { HuemulOptionCard, HuemulOptionCardGroupProps } from "@/types/huemul/option-card-group";

/**
 * Grupo de tarjetas seleccionables (radio-like): icono en cuadro tintado,
 * título, descripción, y check del color de la tarjeta cuando está
 * seleccionada. Sin seleccionar: borde neutro y fondo blanco.
 */
export function HuemulOptionCardGroup<T extends string = string>({
  value,
  onChange,
  options,
  columns = 4,
  disabled = false,
  className,
}: HuemulOptionCardGroupProps<T>) {
  const gridClass = columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={cn("grid gap-2.5", gridClass, className)}>
      {options.map((option: HuemulOptionCard<T>) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col gap-2 rounded-[10px] border p-3 text-left transition-colors",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            )}
            style={{
              borderColor: selected ? option.color : "#e2e8f0",
              backgroundColor: selected ? option.tint : "#ffffff",
            }}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span
                className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-[7px]"
                style={{ backgroundColor: option.tint }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: option.color }} />
              </span>
              {selected && (
                <Check className="h-3.75 w-3.75 shrink-0" style={{ color: option.color }} />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-[#0f172a]">{option.label}</span>
              <span className="text-xs leading-normal text-[#64748b]">{option.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
