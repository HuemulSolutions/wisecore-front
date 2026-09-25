import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { HuemulFieldOption } from "@/types/huemul/field";

interface HuemulCheckboxGroupProps {
  options: HuemulFieldOption[];
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Control de selección múltiple a partir de una lista chica de opciones ya
// disponibles en memoria (sin fetch). Usado por preguntas "lista_desplegable_multiple"
// y por el editor de dependencias (operadores in/not_in contra un target dropdown-like).
export function HuemulCheckboxGroup({
  options,
  value,
  onChange,
  label,
  error,
  disabled,
  className,
}: HuemulCheckboxGroupProps) {
  const toggle = (optionId: string, checked: boolean) => {
    if (checked) {
      if (!value.includes(optionId)) onChange([...value, optionId]);
    } else {
      onChange(value.filter((id) => id !== optionId));
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-xs font-medium text-gray-700">{label}</Label>}
      <div className="space-y-1.5">
        {options.map((option) => {
          const id = `checkbox-group-${option.value}`;
          const checked = value.includes(option.value);
          return (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(v) => toggle(option.value, v === true)}
              />
              <Label htmlFor={id} className="text-sm font-normal text-gray-700">
                {option.label}
              </Label>
            </div>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
