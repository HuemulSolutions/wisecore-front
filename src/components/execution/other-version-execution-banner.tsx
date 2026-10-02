import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getExecutionStatus } from '@/services/executions';
import { useOrganization } from '@/contexts/organization-context';
import { logger } from '@/lib/logger';
import { isMissingDependencyFailure } from '@/lib/execution-failure-message';
import { getExecutionPollInterval } from '@/lib/polling-intervals';
import { VersionBanner } from '@/components/assets/content/version-banner';
import type { VersionBannerTone } from '@/components/assets/content/version-banner-variants';
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
  const [isPolling, setIsPolling] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  // Este banner se monta una vez por executionId (key={execution.id} en el
  // padre), así que un solo Date.now() al montar alcanza como base del
  // backoff — se reinicia también al reanudar el polling a mano, más abajo.
  const startedAtRef = useRef(Date.now());

  // Poll execution status
  const { data: execution, refetch } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => {
      logger.log('🔄 Fetching other version execution status for:', executionId);
      return getExecutionStatus(executionId!, selectedOrganizationId!);
    },
    enabled: !!executionId && !!selectedOrganizationId && isPolling && !isDismissed,
    refetchInterval: () => (isPolling ? getExecutionPollInterval(Date.now() - startedAtRef.current) : false),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const terminalStates = ['completed', 'failed', 'cancelled'];
    if (execution?.status && terminalStates.includes(execution.status)) {
      logger.log('🛑 Other version execution stopped polling:', execution.status);
      setIsPolling(false);
    } else if (execution?.status === 'running' || execution?.status === 'pending' || execution?.status === 'paused') {
      // Ensure polling is active for active states (including paused to check for resume)
      if (!isPolling && !isDismissed) {
        logger.log('🔄 Restarting other version polling for active execution');
        startedAtRef.current = Date.now();
        setIsPolling(true);
      }
    }
  }, [execution?.status, isPolling, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  const handleRefresh = () => {
    logger.log('🔄 Manual other version refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });

    // Restart polling if it was stopped and not dismissed
    if (!isPolling && !isDismissed) {
      logger.log('🔄 Restarting other version polling after manual refresh');
      startedAtRef.current = Date.now();
      setIsPolling(true);
    }
  };

  if (isDismissed || !execution) {
    return null;
  }

  const statusText: Record<string, string> = {
    running: 'banner.status.running',
    pending: 'banner.status.queued',
    completed: 'banner.status.completed',
    failed: 'banner.status.failed',
    cancelled: 'banner.status.cancelled',
    paused: 'banner.status.paused',
  };

  const description =
    execution.status === 'failed'
      ? isMissingDependencyFailure(execution.status_message)
        ? t('otherVersionBanner.description.missingDependency')
        : t('otherVersionBanner.description.failed')
      : ['running', 'pending', 'completed', 'cancelled', 'paused'].includes(execution.status)
        ? t(`otherVersionBanner.description.${execution.status}`)
        : undefined;

  const tone: VersionBannerTone | undefined =
    execution.status === 'completed'
      ? 'green'
      : execution.status === 'failed'
        ? 'red'
        : execution.status === 'cancelled'
          ? 'gray'
          : undefined;

  const isActive = execution.status === 'running' || execution.status === 'pending';

  return (
    <VersionBanner
      variant="otherVersion"
      tone={tone}
      pulsing={isActive}
      title={t('otherVersionBanner.versionTitle', {
        name: executionName,
        status: statusText[execution.status] ? t(statusText[execution.status]) : execution.status,
      })}
      text={description}
      className="mb-4"
      actions={[
        ...(isActive
          ? [{ icon: RefreshCw, title: t('executionRun.refreshStatus'), onClick: handleRefresh }]
          : []),
        ...(execution.status === 'completed'
          ? [{ label: t('otherVersionBanner.viewVersion'), onClick: onViewVersion }]
          : []),
        { label: t('otherVersionBanner.dismissNotice'), onClick: handleDismiss },
      ]}
    />
  );
}
