import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  SECTION_BAR_DISABLED_CLASS,
  SECTION_BAR_TONE_CLASS,
  type SectionBarTone,
} from '@/components/assets/content/components/section-bar-styles';

interface SectionBarButtonProps {
  tone: SectionBarTone;
  icon: LucideIcon;
  /** Texto visible junto al ícono — solo la acción primaria lo lleva. */
  label?: string;
  /** Texto del `title` y del `aria-label` (obligatorio: los demás botones son icon-only). */
  tooltip: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  /** Adornos posicionados sobre el botón (ej. punto de sugerencia IA). */
  children?: ReactNode;
}

/**
 * Botón de la barra de acciones de una sección. Plano a propósito (no HuemulButton): el diseño
 * fija alto/radio/hover propios y expresa la jerarquía solo con color (`tone`).
 */
export function SectionBarButton({
  tone,
  icon: Icon,
  label,
  tooltip,
  disabled = false,
  onClick,
  className,
  iconClassName,
  children,
}: SectionBarButtonProps) {
  const button = (
    <button
      type="button"
      title={disabled ? undefined : tooltip}
      aria-label={tooltip}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative inline-flex h-[30px] min-w-[30px] shrink-0 items-center justify-center gap-1.5 rounded-[7px] border-0 text-[12.5px] font-semibold transition-colors hover:cursor-pointer',
        disabled ? SECTION_BAR_DISABLED_CLASS : SECTION_BAR_TONE_CLASS[tone],
        className,
      )}
    >
      <Icon className={cn('h-[15px] w-[15px] stroke-[1.9]', iconClassName)} />
      {label}
      {children}
    </button>
  );

  // Un <button disabled> no recibe hover (pointer-events-none global): el title va en un span envolvente.
  return disabled ? <span title={tooltip} className="inline-flex">{button}</span> : button;
}

/** Separador vertical entre grupos de acciones. */
export function SectionBarDivider({ className }: { className?: string }) {
  return <span aria-hidden className={cn('mx-[5px] h-4 w-px shrink-0 bg-[#e2e8f0]', className)} />;
}
