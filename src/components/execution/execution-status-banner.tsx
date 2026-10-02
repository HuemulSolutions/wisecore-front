import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { VersionBanner } from '@/components/assets/content/version-banner';
import type { VersionBannerTone } from '@/components/assets/content/version-banner-variants';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useExecutionPolling } from '@/hooks/useExecutionPolling';
import { useOrganization } from '@/contexts/organization-context';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { isMissingDependencyFailure } from '@/lib/execution-failure-message';
import type { ExecutionStatusBannerProps } from '@/types/execution';

export type { ExecutionStatusBannerProps } from '@/types/execution';

export function ExecutionStatusBanner({
  executionId,
  onExecutionComplete,
  progress,
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

  const status = currentExecution.status;
  const key = statusKeyMap[status];
  const statusText = key ? t(`banner.status.${key}`) : status;
  const description =
    status === 'import_failed'
      ? (currentExecution.status_message || currentExecution.error || t('banner.description.importFailed'))
      : status === 'failed' && isMissingDependencyFailure(currentExecution.status_message)
        ? t('banner.description.missingDependency')
        : t(`banner.description.${key || 'default'}`);

  const isFailure = status === 'import_failed' || status === 'failed';
  const isActive = ['importing', 'running', 'approving', 'generating', 'pending', 'queued'].includes(status);
  const tone: VersionBannerTone | undefined = isFailure ? 'red' : status === 'cancelled' ? 'gray' : undefined;

  return (
    <VersionBanner
      variant="generating"
      tone={tone}
      pulsing={isActive}
      title={isFailure ? t('banner.documentError', { status: statusText }) : t('banner.documentPrefix', { status: statusText })}
      text={description}
      progress={isActive ? progress : undefined}
      className={cn('mb-4', className)}
      actions={
        ['running', 'pending', 'approving', 'importing'].includes(status)
          ? [{ icon: RefreshCw, title: t('executionRun.refreshStatus'), onClick: invalidateExecution }]
          : undefined
      }
    />
  );
}
