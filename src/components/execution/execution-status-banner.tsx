import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Clock, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useExecutionPolling } from '@/hooks/useExecutionPolling';
import { useOrganization } from '@/contexts/organization-context';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { isMissingDependencyFailure } from '@/lib/execution-failure-message';
import { executionStatusBannerStyle } from '@/lib/lifecycle-colors';
import type { ExecutionStatusBannerProps } from '@/types/execution';

export type { ExecutionStatusBannerProps } from '@/types/execution';

export function ExecutionStatusBanner({
  executionId,
  onExecutionComplete,
  className
}: ExecutionStatusBannerProps) {
  logger.log('ExecutionStatusBanner rendering with executionId:', executionId);
  
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { t } = useTranslation('execute');
  
  // Hacer polling para obtener el estado más actual
  const { execution, stopPolling, invalidateExecution, error } = useExecutionPolling({
    executionId,
    enabled: !!executionId && !!selectedOrganizationId,
    pollingInterval: 3000,
    onStatusChange: (status, executionData) => {
      logger.log('Banner - Execution status changed:', status, executionData);
      
      try {
        // Invalidate related queries when status changes to ensure UI consistency
        if (executionData?.execution_id) {
          queryClient.invalidateQueries({ queryKey: ['document-content'] });
          queryClient.invalidateQueries({ queryKey: ['executions'] });
        }
        
        if (status === 'completed') {
          toast.success(t('toast.importSuccess'));
          onExecutionComplete?.(executionData?.execution_id || executionId);
          stopPolling();
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
          }, 100);
        } else if (status === 'approved') {
          onExecutionComplete?.(executionData?.execution_id || executionId);
          stopPolling();
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
          }, 100);
        } else if (status === 'failed') {
          toast.error(
            isMissingDependencyFailure(executionData?.status_message)
              ? t('toast.missingDependency')
              : t('toast.generationFailed'),
          );
          stopPolling();
        } else if (status === 'import_failed') {
          const message = executionData?.status_message || executionData?.error || t('toast.importFailed');
          toast.error(message);
          stopPolling();
        }
      } catch (error) {
        logger.error('Error in status change handler:', error);
      }
    }
  });
  
  // Use polling data as the primary source of truth
  const currentExecution = execution;

  logger.log('Banner - Current execution:', currentExecution?.status, 'ID:', currentExecution?.id);
  
  // Handle polling errors
  useEffect(() => {
    if (error) {
      handleApiError(error, { fallbackMessage: t('toast.pollingError') });
    }
  }, [error]);

  // Don't show banner if no execution or if execution is in final successful state
  if (!currentExecution || ['completed', 'approved'].includes(currentExecution.status)) {
    logger.log('Banner hidden - no execution or final state:', currentExecution?.status);
    return null;
  }

  // Forma del icono por estado — el color sale de `executionStatusBannerStyle`
  // (`lib/lifecycle-colors.ts`, única fuente, compartida con los badges de
  // lifecycle y ejecución): así el icono nunca se desincroniza del fondo si
  // cambia el hue del estado.
  const statusIconShapeMap: Record<string, typeof Loader2> = {
    importing: Loader2,
    import_failed: XCircle,
    running: Loader2,
    approving: Loader2,
    generating: Loader2,
    pending: Clock,
    queued: Clock,
    completed: CheckCircle,
    failed: XCircle,
    cancelled: XCircle,
    paused: Clock,
  };
  const spinningStatuses = new Set(['importing', 'running', 'approving', 'generating']);

  const statusKeyMap: Record<string, string> = {
    importing: 'importing',
    import_failed: 'importFailed',
    running: 'running',
    approving: 'approving',
    pending: 'pending',
    queued: 'queued',
    completed: 'completed',
    failed: 'failed',
    cancelled: 'cancelled',
    paused: 'paused',
  };

  const getStatusConfig = (status: string) => {
    const tone = executionStatusBannerStyle(status);
    const IconShape = statusIconShapeMap[status] ?? Clock;
    const icon = <IconShape className={cn('h-5 w-5', spinningStatuses.has(status) && 'animate-spin', tone.icon)} />;
    const key = statusKeyMap[status];
    const text = key ? t(`banner.status.${key}`) : status;
    const description = status === 'import_failed'
      ? (currentExecution?.status_message || currentExecution?.error || t(`banner.description.importFailed`))
      : status === 'failed' && isMissingDependencyFailure(currentExecution?.status_message)
      ? t('banner.description.missingDependency')
      : t(`banner.description.${key || 'default'}`);
    return { icon, bgColor: tone.bg, borderColor: tone.border, textColor: tone.text, text, description };
  };

  const statusConfig = getStatusConfig(currentExecution.status);

  return (
    <div className={cn(
      "border-l-4 p-4 mb-4 rounded-lg",
      statusConfig.bgColor,
      statusConfig.borderColor,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="shrink-0 mt-0.5">
            {statusConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium", statusConfig.textColor)}>
              {currentExecution.status === 'import_failed' || currentExecution.status === 'failed'
                ? t('banner.documentError', { status: statusConfig.text })
                : t('banner.documentPrefix', { status: statusConfig.text })}
            </p>
            <p className={cn("text-xs mt-1", statusConfig.textColor)}>
              {statusConfig.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {(currentExecution.status === 'running' || currentExecution.status === 'pending' || currentExecution.status === 'approving' || currentExecution.status === 'importing') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={invalidateExecution}
              className="hover:cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}