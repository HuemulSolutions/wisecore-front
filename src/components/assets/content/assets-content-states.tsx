import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { HuemulScreenState } from '@/huemul/components/huemul-screen-state';
import { ApiError } from '@/types/api-error';
import type { ScreenStateConfig } from '@/types/huemul';
import { ContentErrorState } from './content-error-state';
import type { ContentState } from './content-state';

/** Anchos de las líneas de párrafo de cada bloque del skeleton. */
const PARAGRAPH_WIDTHS = ['w-[92%]', 'w-[85%]', 'w-[70%]', 'w-[88%]'];

/**
 * Skeleton con la estructura real del contenido: barra de título y bloques de sección (heading ~40% +
 * líneas de párrafo). Ocupa lo mismo que el contenido para que loading → ready no mueva el layout.
 * Sin spinner.
 */
export function AssetContentSkeleton({ blocks = 4, label }: { blocks?: number; label?: string }) {
  const { t } = useTranslation('assets');

  return (
    <div
      data-testid="asset-content-skeleton"
      aria-busy="true"
      aria-label={label ?? t('content.loadingDocument')}
      className="min-h-150 space-y-8"
    >
      <Skeleton className="h-8 w-3/4" />
      {Array.from({ length: blocks }).map((_, blockIndex) => (
        <div key={blockIndex} className="space-y-3">
          <Skeleton className="h-5 w-2/5" />
          <div className="space-y-2.5">
            {PARAGRAPH_WIDTHS.slice(0, blockIndex % 2 === 0 ? 3 : 4).map((width, lineIndex) => (
              <Skeleton key={lineIndex} className={`h-4 ${width}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface GeneratingProgress {
  /** Sección en curso (1-based) y total de secciones. */
  current: number;
  total: number;
  name?: string;
}

/** Generación de la versión completa: aviso con progreso arriba y skeleton en lo pendiente. */
export function AssetContentGenerating({ progress }: { progress?: GeneratingProgress }) {
  const { t } = useTranslation('assets');
  const percent = progress && progress.total > 0 ? Math.round(((progress.current - 1) / progress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50 text-blue-900" role="status" aria-live="polite">
        <Loader2 className="animate-spin text-blue-600" aria-hidden="true" />
        <AlertTitle>{t('contentStates.generating.alertTitle')}</AlertTitle>
        <AlertDescription className="gap-2 text-blue-800">
          <span>
            {progress
              ? progress.name
                ? t('contentStates.generating.alertProgress', {
                    current: progress.current,
                    total: progress.total,
                    name: progress.name,
                  })
                : t('contentStates.generating.alertProgressNoName', { current: progress.current, total: progress.total })
              : t('contentStates.generating.alertWaiting')}
          </span>
          <Progress value={percent} className="h-1.5 w-full bg-blue-100" aria-label={t('contentStates.generating.alertTitle')} />
        </AlertDescription>
      </Alert>
      <AssetContentSkeleton label={t('content.generatingContent')} />
    </div>
  );
}

interface AssetContentStatesProps {
  state: ContentState;
  /** Configuración de `buildContentStates` para `state`. */
  config: ScreenStateConfig;
  /** Error de /content: 401/403/404 conservan su pantalla específica. */
  error?: unknown;
  onRetry?: () => void;
  generatingProgress?: GeneratingProgress;
}

/** Renderiza el estado del contenido central distinto de `ready`. */
export function AssetContentStates({ state, config, error, onRetry, generatingProgress }: AssetContentStatesProps) {
  if (state === 'ready') return null;
  if (state === 'loading') return <AssetContentSkeleton />;
  if (state === 'generating') return <AssetContentGenerating progress={generatingProgress} />;

  if (state === 'error' && ApiError.isApiError(error) && [401, 403, 404].includes(error.statusCode)) {
    return <ContentErrorState error={error} onRetry={onRetry} />;
  }

  return <HuemulScreenState config={config} className="min-h-[calc(100vh-300px)]" />;
}
