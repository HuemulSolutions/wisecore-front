import { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, XCircle, CheckCircle, AlertCircle, GitCompare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getAiSuggestion } from '@/services/section_execution';
import { useOrganization } from '@/contexts/organization-context';
import { cn } from '@/lib/utils';
import { getExecutionPollInterval } from '@/lib/polling-intervals';
import { executionStatusBannerStyle, executionStatusSolidColor } from '@/lib/lifecycle-colors';
import { Button } from '@/components/ui/button';
import type { AiSuggestionFeedbackProps } from '@/types/ai-suggestion-feedback';

export type { AiSuggestionFeedbackProps } from '@/types/ai-suggestion-feedback';

export function AiSuggestionFeedback({
  sectionExecutionId,
  onCompleted,
  onFailed,
  onDismiss,
  onViewSuggestion,
  className,
}: AiSuggestionFeedbackProps) {
  const { selectedOrganizationId } = useOrganization();
  const { t } = useTranslation('execute');
  const [isPolling, setIsPolling] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasHandledTerminalState, setHasHandledTerminalState] = useState(false);
  const [completedContent, setCompletedContent] = useState<string | null>(null);
  // Este feedback se monta al activarse la sugerencia (isAiSuggestionActive
  // en assets-section.tsx) y se desmonta al terminar/descartarse — un solo
  // Date.now() al montar alcanza como base del backoff, y se reinicia al
  // reanudar el polling a mano, más abajo.
  const startedAtRef = useRef(Date.now());

  const { data, refetch } = useQuery({
    queryKey: ['ai-suggestion', sectionExecutionId],
    queryFn: () => getAiSuggestion(sectionExecutionId, selectedOrganizationId ?? undefined),
    enabled: !!sectionExecutionId && !!selectedOrganizationId && isPolling && !isDismissed,
    refetchInterval: () => (isPolling ? getExecutionPollInterval(Date.now() - startedAtRef.current) : false),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!data || hasHandledTerminalState) return;

    if (data.status === 'completed' && data.content != null) {
      setIsPolling(false);
      setHasHandledTerminalState(true);
      setCompletedContent(data.content);
      // Notify parent to invalidate queries; banner stays visible for user action.
      onCompleted(data.content);
    } else if (data.status === 'failed') {
      setIsPolling(false);
      setHasHandledTerminalState(true);
      // Banner stays visible so user can see the error before dismissing.
    }
  }, [data?.status, data?.content, hasHandledTerminalState, onCompleted, t]);

  const handleRefresh = () => {
    refetch();
    if (!isPolling && !isDismissed) {
      startedAtRef.current = Date.now();
      setIsPolling(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsPolling(false);
    if (data?.status === 'failed') {
      onFailed?.();
    }
    onDismiss?.();
  };

  const handleViewSuggestion = () => {
    setIsDismissed(true);
    setIsPolling(false);
    onViewSuggestion?.(completedContent ?? '');
  };

  if (isDismissed || data?.status == null) {
    return null;
  }

  // Completed state: prominent action banner so the user doesn't miss the suggestion.
  if (data?.status === 'completed') {
    const completedTone = executionStatusBannerStyle('completed');
    return (
      <div
        className={cn(
          'rounded-md border p-3 text-sm shadow-sm animate-in fade-in duration-300',
          completedTone.bg,
          completedTone.border,
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <CheckCircle className={cn('h-4 w-4 flex-shrink-0', completedTone.icon)} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', completedTone.text)}>
                {t('aiSuggestion.status.completed')}
              </p>
              <p className="text-xs text-green-700/70 mt-0.5">
                {t('aiSuggestion.completed.readyToReview')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleViewSuggestion}
              className={cn('h-7 px-3 text-xs hover:opacity-90 text-white hover:cursor-pointer gap-1.5', executionStatusSolidColor('completed'))}
            >
              <GitCompare className="h-3.5 w-3.5" />
              {t('aiSuggestion.completed.viewSuggestion')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-7 w-7 p-0 hover:cursor-pointer hover:bg-green-100 text-green-700"
              title={t('aiSuggestion.dismiss')}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // "pending" es el único estado intermedio que devuelve el backend (ver
  // `AiSuggestionStatus` en types/sections/execution-core.ts): la IA está
  // trabajando, así que usa el hue "running" del eje de ejecución (sky), no
  // "pending"/slate — acá no hay una cola separada de un procesamiento activo.
  const getStatusDisplay = () => {
    switch (data?.status) {
      case 'pending': {
        const tone = executionStatusBannerStyle('running');
        return {
          icon: <Loader2 className={cn('h-5 w-5 animate-spin', tone.icon)} />,
          text: t('aiSuggestion.status.pending'),
          description: t('aiSuggestion.description.pending'),
          textColor: tone.text,
          bgColor: cn(tone.bg, tone.border),
        };
      }
      case 'failed': {
        const tone = executionStatusBannerStyle('failed');
        return {
          icon: <AlertCircle className={cn('h-5 w-5', tone.icon)} />,
          text: t('aiSuggestion.status.failed'),
          description: (data as any)?.error ?? t('aiSuggestion.description.failed'),
          textColor: tone.text,
          bgColor: cn(tone.bg, tone.border),
        };
      }
      default: {
        const tone = executionStatusBannerStyle('running');
        return {
          icon: <Loader2 className={cn('h-5 w-5 animate-spin', tone.icon)} />,
          text: t('aiSuggestion.status.processing'),
          description: t('aiSuggestion.description.processing'),
          textColor: tone.text,
          bgColor: cn(tone.bg, tone.border),
        };
      }
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div
      className={cn(
        'rounded-md border p-3 text-sm shadow-sm',
        statusDisplay.bgColor,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">{statusDisplay.icon}</div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', statusDisplay.textColor)}>
              {statusDisplay.text}
            </p>
            <p className="text-xs text-gray-600 mt-1">{statusDisplay.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {data?.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="hover:cursor-pointer"
              title={t('aiSuggestion.refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="hover:cursor-pointer"
            title={t('aiSuggestion.dismiss')}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
