import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getExecutionStatus } from '@/services/executions';
import { useOrganization } from '@/contexts/organization-context';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { isMissingDependencyFailure } from '@/lib/execution-failure-message';
import { Button } from '@/components/ui/button';
import type { OtherVersionExecutionBannerProps } from '@/types/other-version-execution-banner';

export type { OtherVersionExecutionBannerProps } from '@/types/other-version-execution-banner';

export function OtherVersionExecutionBanner({
  executionId,
  executionName,
  onDismiss,
  onViewVersion
}: OtherVersionExecutionBannerProps) {
  const { t } = useTranslation('execute');
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);
  const [isDismissed, setIsDismissed] = useState(false);

  // Poll execution status
  const { data: execution, refetch } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => {
      logger.log('🔄 Fetching other version execution status for:', executionId);
      return getExecutionStatus(executionId!, selectedOrganizationId!);
    },
    enabled: !!executionId && !!selectedOrganizationId && pollingInterval !== false && !isDismissed,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const terminalStates = ['completed', 'failed', 'cancelled'];
    if (execution?.status && terminalStates.includes(execution.status)) {
      logger.log('🛑 Other version execution stopped polling:', execution.status);
      setPollingInterval(false);
    } else if (execution?.status === 'running' || execution?.status === 'pending' || execution?.status === 'paused') {
      // Ensure polling is active for active states (including paused to check for resume)
      if (pollingInterval === false && !isDismissed) {
        logger.log('🔄 Restarting other version polling for active execution');
        setPollingInterval(2000);
      }
    }
  }, [execution?.status, pollingInterval, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  const handleRefresh = () => {
    logger.log('🔄 Manual other version refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
    
    // Restart polling if it was stopped and not dismissed
    if (pollingInterval === false && !isDismissed) {
      logger.log('🔄 Restarting other version polling after manual refresh');
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
          text: t('banner.status.running'),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: t('banner.status.queued'),
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: t('banner.status.completed'),
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          text: t('banner.status.failed'),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-5 w-5 text-gray-600" />,
          text: t('banner.status.cancelled'),
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
      case 'paused':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: t('banner.status.paused'),
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
              {t('otherVersionBanner.versionTitle', { name: executionName, status: statusInfo.text })}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {execution.status === 'running' && t('otherVersionBanner.description.running')}
              {execution.status === 'pending' && t('otherVersionBanner.description.pending')}
              {execution.status === 'completed' && t('otherVersionBanner.description.completed')}
              {execution.status === 'failed' && (
                isMissingDependencyFailure(execution.status_message)
                  ? t('otherVersionBanner.description.missingDependency')
                  : t('otherVersionBanner.description.failed')
              )}
              {execution.status === 'cancelled' && t('otherVersionBanner.description.cancelled')}
              {execution.status === 'paused' && t('otherVersionBanner.description.paused')}
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
              {t('otherVersionBanner.viewVersion')}
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
