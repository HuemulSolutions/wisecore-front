import { useEffect } from 'react';
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
  
  // Hacer polling para obtener el estado más actual
  const { execution, stopPolling, invalidateExecution, error } = useExecutionPolling({
    executionId,
    enabled: !!executionId && !!selectedOrganizationId,
    pollingInterval: 5000, // Poll every 5 seconds for better responsiveness
    onStatusChange: (status, executionData) => {
      console.log('Banner - Execution status changed:', status, executionData);
      
      try {
        // Invalidate related queries when status changes to ensure UI consistency
        if (executionData?.execution_id) {
          queryClient.invalidateQueries({ queryKey: ['document-content'] });
          queryClient.invalidateQueries({ queryKey: ['executions'] });
        }
        
        if (status === 'completed') {
          toast.success('Document generation completed successfully!');
          onExecutionComplete?.(executionData?.execution_id || executionId);
          stopPolling();
          // Force re-render by invalidating current query
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
          }, 100);
        } else if (status === 'approved') {
          // Execution was approved - this is also a successful completion state
          // Don't show toast here as it's already handled in assets-content.tsx
          onExecutionComplete?.(executionData?.execution_id || executionId);
          stopPolling();
          // Force re-render by invalidating current query
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
          }, 100);
        } else if (status === 'failed') {
          toast.error('Document generation failed. Please try again.');
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
      handleApiError(error, { fallbackMessage: 'Error checking execution status. Please refresh the page.' });
    }
  }, [error]);

  // Don't show banner if no execution or if execution is in final state
  if (!currentExecution || ['completed', 'approved'].includes(currentExecution.status)) {
    console.log('Banner hidden - no execution or final state:', currentExecution?.status);
    return null;
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          text: 'generating',
          description: 'Content is being generated. This may take a few minutes.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      case 'approving':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-green-600" />,
          text: 'approving',
          description: 'Execution is being approved. Please wait...',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: 'pending',
          description: 'Waiting in queue to start generation...',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      case 'queued':
        return {
          icon: <Clock className="h-5 w-5 text-orange-600" />,
          text: 'queued',
          description: 'Your execution is queued and will start soon.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: 'completed',
          description: 'Generation completed successfully!',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          text: 'failed',
          description: 'There was an error generating your document. Please try again.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-5 w-5 text-gray-600" />,
          text: 'cancelled',
          description: 'Generation was cancelled.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
      case 'paused':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: 'paused',
          description: 'Generation is paused.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          text: status,
          description: 'Processing your request...',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
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
              Document is {statusConfig.text}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {statusConfig.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {(currentExecution.status === 'running' || currentExecution.status === 'pending' || currentExecution.status === 'approving') && (
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