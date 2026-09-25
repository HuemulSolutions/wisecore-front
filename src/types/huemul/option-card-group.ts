import type { LucideIcon } from "lucide-react";

// Una tarjeta seleccionable del grupo — value genérico para que cada
// consumidor use su propio literal (ej. SectionType).
export interface HuemulOptionCard<T extends string = string> {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Color de acento (icono, check, borde/fondo cuando está seleccionada). */
  color: string;
  /** Fondo tenue del icono y, seleccionada, de toda la tarjeta. */
  tint: string;
}

export interface HuemulOptionCardGroupProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: HuemulOptionCard<T>[];
  /** Columnas en pantallas ≥ sm — en mobile siempre 2. Default 4. */
  columns?: 2 | 4;
  disabled?: boolean;
  className?: string;
}
