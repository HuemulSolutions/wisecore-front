import type { LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { cn } from '@/lib/utils';

import type { VersionBannerTone, VersionBannerVariant } from './version-banner-variants';

/** Tono por defecto de cada variante: ámbar bloquea, rojo falla, azul informa, índigo es una corrida parcial. */
const VARIANT_TONE: Record<VersionBannerVariant, VersionBannerTone> = {
  externalLocked: 'amber',
  externalFailed: 'red',
  otherVersion: 'blue',
  generating: 'blue',
  partialRun: 'indigo',
};

const TONE_CLASSES: Record<VersionBannerTone, { box: string; title: string; text: string; dot: string; halo: string; bar: string }> = {
  amber: {
    box: 'border-amber-200 bg-amber-50',
    title: 'text-amber-900',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    halo: 'ring-amber-200',
    bar: 'bg-amber-500',
  },
  red: {
    box: 'border-red-200 bg-red-50',
    title: 'text-red-900',
    text: 'text-red-800',
    dot: 'bg-red-500',
    halo: 'ring-red-200',
    bar: 'bg-red-500',
  },
  blue: {
    box: 'border-blue-200 bg-blue-50',
    title: 'text-blue-900',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
    halo: 'ring-blue-200',
    bar: 'bg-blue-600',
  },
  indigo: {
    box: 'border-indigo-200 bg-indigo-50',
    title: 'text-indigo-900',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
    halo: 'ring-indigo-200',
    bar: 'bg-indigo-600',
  },
  green: {
    box: 'border-green-200 bg-green-50',
    title: 'text-green-900',
    text: 'text-green-800',
    dot: 'bg-green-500',
    halo: 'ring-green-200',
    bar: 'bg-green-600',
  },
  gray: {
    box: 'border-gray-200 bg-gray-50',
    title: 'text-gray-900',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    halo: 'ring-gray-200',
    bar: 'bg-gray-500',
  },
};

export interface VersionBannerAction {
  /** Sin `label` la acción es solo ícono (refrescar, descartar): `title` es obligatorio para accesibilidad. */
  label?: string;
  icon?: LucideIcon;
  title?: string;
  /** Si devuelve una Promise, el botón muestra loading y bloquea el doble click. */
  onClick: () => void | Promise<unknown>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'outline' | 'ghost';
}

export interface VersionBannerProps {
  variant: VersionBannerVariant;
  /** Fuerza otro tono (por ejemplo, verde o gris para estados terminales de una corrida). */
  tone?: VersionBannerTone;
  title: string;
  text?: string;
  /** Progreso 0-100. Si se omite, no se muestra la barra. */
  progress?: number;
  /** Texto accesible/visible junto a la barra (ej. «2 de 5»). */
  progressLabel?: string;
  /** El punto pulsa mientras algo está en curso. */
  pulsing?: boolean;
  actions?: VersionBannerAction[];
  className?: string;
}

/**
 * Banner de la versión (arriba del contenido): punto de color con halo, título, texto, acciones
 * y barra de progreso opcional. Presentacional: el polling y los handlers viven en cada banner
 * de dominio (`ExecutionStatusBanner`, `OtherVersionExecutionBanner`, …) que renderiza a través de él.
 */
export function VersionBanner({
  variant,
  tone,
  title,
  text,
  progress,
  progressLabel,
  pulsing = false,
  actions,
  className,
}: VersionBannerProps) {
  const classes = TONE_CLASSES[tone ?? VARIANT_TONE[variant]];

  return (
    <div
      data-testid="version-banner"
      data-variant={variant}
      role="status"
      className={cn('flex items-start gap-3 rounded-lg border p-4', classes.box, className)}
    >
      <span
        aria-hidden="true"
        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4', classes.dot, classes.halo, pulsing && 'animate-pulse')}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <p className={cn('text-sm font-semibold', classes.title)}>{title}</p>
          {progressLabel && <span className={cn('text-xs', classes.text)}>{progressLabel}</span>}
        </div>
        {text && <p className={cn('mt-1 break-words text-xs', classes.text)}>{text}</p>}
        {progress !== undefined && (
          <Progress
            value={progress}
            aria-label={title}
            className="mt-2 h-1.5 max-w-xs bg-white/70"
            indicatorClassName={classes.bar}
          />
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5">
          {actions.map((action, index) => (
            <HuemulButton
              key={action.label ?? action.title ?? index}
              size="sm"
              variant={action.variant ?? (action.label ? 'outline' : 'ghost')}
              icon={action.icon}
              iconClassName="h-4 w-4"
              label={action.label}
              title={action.title}
              loading={action.loading}
              disabled={action.disabled}
              onClick={action.onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
