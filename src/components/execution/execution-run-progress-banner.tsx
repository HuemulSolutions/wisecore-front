import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { VersionBanner } from '@/components/assets/content/version-banner';
import type { VersionBannerTone } from '@/components/assets/content/version-banner-variants';
import { isMissingDependencyFailure } from '@/lib/execution-failure-message';
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

  const tone: VersionBannerTone | undefined = isFailure
    ? 'red'
    : isCancelled
      ? 'gray'
      : succeededAndFresh
        ? 'green'
        : undefined;

  const title = isFailure
    ? t('executionRun.title.failed')
    : isCancelled
      ? t('executionRun.title.cancelled')
      : succeededAndFresh
        ? t('executionRun.title.succeeded')
        : phase === 'arming'
          ? t('executionRun.title.arming')
          : t('executionRun.title.running');

  const text = isFailure
    ? isMissingDependencyFailure(failureMessage)
      ? t('executionRun.description.missingDependency')
      : t('executionRun.description.failed')
    : phase === 'running' && currentSectionName
      ? t('executionRun.currentSection', { section: currentSectionName })
      : undefined;

  const showProgress = progress.total > 1;
  const progressPct = showProgress ? Math.round((progress.done / progress.total) * 100) : 0;
  const showRefresh = phase === 'arming' || phase === 'running';

  return (
    <VersionBanner
      variant="partialRun"
      tone={tone}
      pulsing={phase === 'arming' || (phase === 'running' && !succeededAndFresh)}
      title={title}
      text={text}
      progress={showProgress ? progressPct : undefined}
      progressLabel={showProgress ? t('executionRun.progress', { done: progress.done, total: progress.total }) : undefined}
      className={className}
      actions={[
        ...(showRefresh ? [{ label: t('executionRun.refreshStatus'), icon: RefreshCw, onClick: onRefresh }] : []),
        { icon: XCircle, title: t('executionRun.dismiss'), onClick: handleDismiss },
      ]}
    />
  );
}
