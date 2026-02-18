import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getExecutionStatus } from '@/services/executions';
import { useOrganization } from '@/contexts/organization-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OtherVersionExecutionBannerProps {
  executionId: string;
  executionName: string;
  onDismiss: () => void;
  onViewVersion: () => void;
}

export function OtherVersionExecutionBanner({
  executionId,
  executionName,
  onDismiss,
  onViewVersion
}: OtherVersionExecutionBannerProps) {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);
  const [isDismissed, setIsDismissed] = useState(false);

  // Poll execution status
  const { data: execution, refetch } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => {
      console.log('🔄 Fetching other version execution status for:', executionId);
      return getExecutionStatus(executionId!, selectedOrganizationId!);
    },
    enabled: !!executionId && !!selectedOrganizationId && pollingInterval !== false && !isDismissed,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const terminalStates = ['completed', 'failed', 'cancelled'];
    if (execution?.status && terminalStates.includes(execution.status)) {
      console.log('🛑 Other version execution stopped polling:', execution.status);
      setPollingInterval(false);
    } else if (execution?.status === 'running' || execution?.status === 'pending' || execution?.status === 'paused') {
      // Ensure polling is active for active states (including paused to check for resume)
      if (pollingInterval === false && !isDismissed) {
        console.log('🔄 Restarting other version polling for active execution');
        setPollingInterval(2000);
      }
    }
  }, [execution?.status, pollingInterval, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  const handleRefresh = () => {
    console.log('🔄 Manual other version refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
    
    // Restart polling if it was stopped and not dismissed
    if (pollingInterval === false && !isDismissed) {
      console.log('🔄 Restarting other version polling after manual refresh');
      setPollingInterval(2000);
    }
  };

  if (isDismissed || !execution) {
    return null;
  }

  const getStatusInfo = () => {
    switch (execution.status) {
      case 'running':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          text: 'generating',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: 'queued',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: 'completed',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          text: 'failed',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-5 w-5 text-gray-600" />,
          text: 'cancelled',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
      case 'paused':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: 'paused',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          text: execution.status,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={cn(
      "border-l-4 p-4 mb-4 rounded-lg",
      statusInfo.bgColor,
      statusInfo.borderColor
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {statusInfo.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium", statusInfo.textColor)}>
              Version "{executionName}" is {statusInfo.text}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {execution.status === 'running' && 'Content is being generated for this version...'}
              {execution.status === 'pending' && 'Waiting in queue to start generation...'}
              {execution.status === 'completed' && 'Generation completed successfully!'}
              {execution.status === 'failed' && 'Generation encountered an error.'}
              {execution.status === 'cancelled' && 'Generation was cancelled.'}
              {execution.status === 'paused' && 'Generation is paused.'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {(execution.status === 'running' || execution.status === 'pending') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="hover:cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {execution.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewVersion}
              className="hover:cursor-pointer"
            >
              View Version
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="hover:cursor-pointer"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
