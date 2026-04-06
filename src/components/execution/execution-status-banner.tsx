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

interface ExecutionStatusBannerProps {
  executionId: string | null;
  onExecutionComplete?: (completedExecutionId?: string) => void;
  className?: string;
}

export function ExecutionStatusBanner({
  executionId,
  onExecutionComplete,
  className
}: ExecutionStatusBannerProps) {
  console.log('ExecutionStatusBanner rendering with executionId:', executionId);
  
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { t } = useTranslation('execute');
  
  // Hacer polling para obtener el estado más actual
  const { execution, stopPolling, invalidateExecution, error } = useExecutionPolling({
    executionId,
    enabled: !!executionId && !!selectedOrganizationId,
    pollingInterval: 3000,
    onStatusChange: (status, executionData) => {
      console.log('Banner - Execution status changed:', status, executionData);
      
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
          toast.error(t('toast.generationFailed'));
          stopPolling();
        } else if (status === 'import_failed') {
          const message = executionData?.status_message || executionData?.error || t('toast.importFailed');
          toast.error(message);
          stopPolling();
        }
      } catch (error) {
        console.error('Error in status change handler:', error);
      }
    }
  });
  
  // Use polling data as the primary source of truth
  const currentExecution = execution;

  console.log('Banner - Current execution:', currentExecution?.status, 'ID:', currentExecution?.id);
  
  // Handle polling errors
  useEffect(() => {
    if (error) {
      handleApiError(error, { fallbackMessage: t('toast.pollingError') });
    }
  }, [error]);

  // Don't show banner if no execution or if execution is in final successful state
  if (!currentExecution || ['completed', 'approved'].includes(currentExecution.status)) {
    console.log('Banner hidden - no execution or final state:', currentExecution?.status);
    return null;
  }

  const statusStyleMap: Record<string, { icon: React.ReactNode; bgColor: string; borderColor: string; textColor: string }> = {
    importing: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800'
    },
    import_failed: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    },
    running: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800'
    },
    approving: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800'
    },
    pending: {
      icon: <Clock className="h-5 w-5 text-amber-600" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800'
    },
    queued: {
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800'
    },
    completed: {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800'
    },
    failed: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    },
    cancelled: {
      icon: <XCircle className="h-5 w-5 text-gray-600" />,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800'
    },
    paused: {
      icon: <Clock className="h-5 w-5 text-amber-600" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800'
    },
  };

  const defaultStyle = {
    icon: <Clock className="h-5 w-5 text-gray-600" />,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800'
  };

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
    const style = statusStyleMap[status] || defaultStyle;
    const key = statusKeyMap[status];
    const text = key ? t(`banner.status.${key}`) : status;
    const description = status === 'import_failed'
      ? (currentExecution?.status_message || currentExecution?.error || t(`banner.description.importFailed`))
      : t(`banner.description.${key || 'default'}`);
    return { ...style, text, description };
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
          <div className="flex-shrink-0 mt-0.5">
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