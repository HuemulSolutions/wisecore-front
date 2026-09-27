import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Clock, XCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isMissingDependencyFailure } from '@/lib/execution-failure-message';
import { executionStatusBannerStyle, executionStatusDot } from '@/lib/lifecycle-colors';
import { Button } from '@/components/ui/button';
import type { ExecutionRunProgressBannerProps } from '@/types/execution';

export type { ExecutionRunProgressBannerProps } from '@/types/execution';

// Tiempo que el banner de éxito queda visible antes de auto-cerrarse, una
// vez confirmado que el contenido regenerado ya llegó (ver
// isAwaitingFreshContent). Reemplaza el banner verde persistente de antes,
// que el usuario tenía que descartar a mano.
const AUTO_CLOSE_DELAY_MS = 4000;

// Tiempo mínimo que la fase "running" debe quedar visible antes de poder
// saltar a "succeeded". Sin esto, una corrida que el backend resuelve en un
// par de segundos (p. ej. re-ejecutar una sola sección ya generada antes)
// hace que "Generando secciones…" aparezca y desaparezca en el mismo tick de
// polling, y el usuario solo ve "Iniciando…" seguido de "Completado".
const MIN_RUNNING_VISIBLE_MS = 1500;

/**
 * Un único banner de progreso para toda la corrida single/from — reemplaza
 * el banner por sección (SectionExecutionFeedback), que se montaba una vez
 * por cada sección en scope y en modo "from" terminaba apilando N banners.
 *
 * El padre (AssetContent) lo monta con `key={runToken}`: al cambiar el
 * token (cada nuevo disparo, incluso re-ejecutando la misma sección) el
 * componente se remonta desde cero, así que su estado local (dismiss, toast
 * ya mostrado) nunca puede arrastrarse de una corrida a la siguiente — esa
 * era la causa del banner "completado" apareciendo de inmediato al
 * re-ejecutar.
 */
export function ExecutionRunProgressBanner({
  runToken,
  phase,
  progress,
  executionMode,
  currentSectionName,
  failureMessage,
  isAwaitingFreshContent = false,
  onRefresh,
  onDismiss,
  className,
}: ExecutionRunProgressBannerProps) {
  const { t } = useTranslation('execute');
  const [isDismissed, setIsDismissed] = useState(false);

  // El padre remonta este componente por runToken (ver comentario de arriba),
  // así que `mountedAtRef` arranca limpio en cada corrida nueva.
  const mountedAtRef = useRef(Date.now());
  const [minVisibleElapsed, setMinVisibleElapsed] = useState(false);

  useEffect(() => {
    const remaining = MIN_RUNNING_VISIBLE_MS - (Date.now() - mountedAtRef.current);
    if (remaining <= 0) {
      setMinVisibleElapsed(true);
      return;
    }
    const timer = setTimeout(() => setMinVisibleElapsed(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  // Gateado por minVisibleElapsed: si el backend resuelve la corrida antes de
  // MIN_RUNNING_VISIBLE_MS, la fase "running" sigue mostrándose hasta cumplir
  // el mínimo — evita el salto directo de "Iniciando…" a "Completado".
  const succeededAndFresh = phase === 'succeeded' && !isAwaitingFreshContent && minVisibleElapsed;

  // Toast + auto-cierre al confirmarse éxito CON contenido fresco. No hace
  // falta dedupear contra corridas anteriores: el `key={runToken}` del padre
  // ya garantiza que este efecto arranca limpio en cada corrida.
  useEffect(() => {
    if (!succeededAndFresh) return;
    toast.success(
      executionMode === 'single'
        ? t('executionRun.toast.successSingle')
        : t('executionRun.toast.successMultiple'),
      { id: `execution-run-${runToken}` },
    );
    const timer = setTimeout(() => {
      setIsDismissed(true);
      onDismiss?.();
    }, AUTO_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [succeededAndFresh]);

  useEffect(() => {
    if (phase === 'failed') {
      toast.error(
        isMissingDependencyFailure(failureMessage)
          ? t('executionRun.toast.missingDependency')
          : t('executionRun.toast.failed'),
        { id: `execution-run-${runToken}` },
      );
    } else if (phase === 'cancelled') {
      toast.info(t('executionRun.toast.cancelled'), { id: `execution-run-${runToken}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (isDismissed || phase === 'idle') return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // `cancelled` es un estado gris (terminal-sin-éxito, no un error) — no comparte
  // color con `failed`, aunque ambos paran el polling. Ver `lib/execution-status.ts`
  // para la semántica de "terminal" (eso sí incluye cancelled entre los no-éxito;
  // acá solo es presentación).
  const isFailure = phase === 'failed';
  const isCancelled = phase === 'cancelled';

  // Mapear la fase de UI al `status` de ejecución que entiende `lib/lifecycle-colors.ts`,
  // fuente única de color para el eje de ejecución.
  const statusForColor = isFailure
    ? 'failed'
    : isCancelled
      ? 'cancelled'
      : succeededAndFresh
        ? 'completed'
        : phase === 'arming'
          ? 'pending'
          : 'running';
  const tone = executionStatusBannerStyle(statusForColor);

  const display = isFailure
    ? {
        icon: <XCircle className={cn('h-5 w-5', tone.icon)} />,
        title: t('executionRun.title.failed'),
        description: isMissingDependencyFailure(failureMessage)
          ? t('executionRun.description.missingDependency')
          : t('executionRun.description.failed'),
      }
    : isCancelled
      ? {
          icon: <XCircle className={cn('h-5 w-5', tone.icon)} />,
          title: t('executionRun.title.cancelled'),
          description: undefined,
        }
      : succeededAndFresh
        ? {
            icon: <CheckCircle className={cn('h-5 w-5', tone.icon)} />,
            title: t('executionRun.title.succeeded'),
            description: undefined,
          }
        : phase === 'arming'
          ? {
              icon: <Clock className={cn('h-5 w-5', tone.icon)} />,
              title: t('executionRun.title.arming'),
              description: undefined,
            }
          : {
              icon: <Loader2 className={cn('h-5 w-5 animate-spin', tone.icon)} />,
              title: t('executionRun.title.running'),
              description: currentSectionName
                ? t('executionRun.currentSection', { section: currentSectionName })
                : undefined,
            };

  const showProgress = progress.total > 1;
  const progressPct = showProgress ? Math.round((progress.done / progress.total) * 100) : 0;
  const showRefresh = phase === 'arming' || phase === 'running';

  return (
    <div className={cn('border-l-4 p-4 rounded-lg', tone.bg, tone.border, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="shrink-0 mt-0.5">{display.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn('text-sm font-medium', tone.text)}>{display.title}</p>
              {showProgress && (
                <span className="text-xs text-gray-500">
                  {t('executionRun.progress', { done: progress.done, total: progress.total })}
                </span>
              )}
            </div>
            {display.description && (
              <p className="text-xs text-gray-600 mt-1 truncate">{display.description}</p>
            )}
            {showProgress && (
              <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', executionStatusDot(statusForColor))}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="hover:cursor-pointer"
              title={t('executionRun.refreshStatus')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="hover:cursor-pointer"
            title={t('executionRun.dismiss')}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
