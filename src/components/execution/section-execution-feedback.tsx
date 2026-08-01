import { useEffect, useState } from 'react';
import { Loader2, Clock, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getExecutionStatus } from '@/services/executions';
import { useSectionsExecutionStatus } from '@/components/assets/content/hooks/useSectionsExecutionStatus';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SectionExecutionFeedbackProps } from '@/types/sections';

export type { SectionExecutionFeedbackProps } from '@/types/sections';

export function SectionExecutionFeedback({
  executionId,
  // Kept in the props contract for callers (matches the section being fed back on);
  // matching against the status endpoint is done by 'order' via sectionIndex, not this id.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sectionId,
  sectionIndex,
  executionMode,
  onComplete,
  onDismiss,
  className
}: SectionExecutionFeedbackProps) {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { t } = useTranslation('execute');
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);
  const [hasShownCompletedToast, setHasShownCompletedToast] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [executionFailed, setExecutionFailed] = useState(false);

  // Passive subscriber: reads the same ['execution-sections-status', executionId]
  // cache that AssetContent owns and polls (poll: true there). Not opening a second
  // timer here avoids one extra request per rendered section every 2s in 'from' mode.
  const { getSectionStatus, refetch } = useSectionsExecutionStatus({
    executionId,
    executionMode,
    startSectionIndex: sectionIndex,
    poll: false,
    enabled: !isDismissed,
  });

  const currentSectionStatus = { status: getSectionStatus(sectionIndex) };

  // Handle completion based on section status (not overall execution status)
  useEffect(() => {
    if (isDismissed) return;

    // Completion depends only on this section's own status, both in 'single' and
    // 'from' mode: each section reveals its content and fires its own toast as
    // soon as it individually finishes, without waiting on the rest of the batch.
    const relevantSectionsDone = currentSectionStatus.status === 'done';

    if (relevantSectionsDone) {
      setPollingInterval(false);

      // Show toast only once but don't dismiss banner automatically. Deduped by
      // executionId so a 'from' batch with N sections finishing shows one toast,
      // not N.
      if (!hasShownCompletedToast) {
        toast.success(
          executionMode === 'single'
            ? t('sectionFeedback.toast.successSingle')
            : t('sectionFeedback.toast.successMultiple'),
          { id: `section-execution-${executionId}` },
        );
        setHasShownCompletedToast(true);
        onComplete?.();
      }
    }
  }, [currentSectionStatus.status, hasShownCompletedToast, executionMode, onComplete, isDismissed, executionId, t]);

  // Separate effect to handle errors via overall execution status
  const { data: executionStatus } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => getExecutionStatus(executionId!, selectedOrganizationId!),
    enabled: !!executionId && !!selectedOrganizationId && pollingInterval !== false && !isDismissed,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!executionStatus) return;

    const overallStatus = executionStatus.status;
    const errorStates = ['failed', 'cancelled'];

    // Only stop polling on errors, not on completion (sections handle completion)
    if (errorStates.includes(overallStatus)) {
      setPollingInterval(false);

      if (!hasShownCompletedToast) {
        if (overallStatus === 'failed') {
          setExecutionFailed(true);
          toast.error(t('sectionFeedback.toast.failed'));
          setHasShownCompletedToast(true);
          onComplete?.();
        } else if (overallStatus === 'cancelled') {
          toast.info(t('sectionFeedback.toast.cancelled'));
          setHasShownCompletedToast(true);
          onComplete?.();
        }
      }
    }
  }, [executionStatus?.status, hasShownCompletedToast, onComplete]);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-sections-status', executionId] });
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });

    // Restart polling if it was stopped
    if (pollingInterval === false && !isDismissed) {
      setPollingInterval(2000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setPollingInterval(false);
    onDismiss?.();
  };

  // Don't show if dismissed or no status yet
  if (isDismissed || currentSectionStatus.status === null || currentSectionStatus.status === undefined) {
    return null;
  }

  const getStatusDisplay = () => {
    if (executionFailed) {
      return {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        text: t('sectionFeedback.status.failed'),
        description: t('sectionFeedback.description.failed'),
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      };
    }
    switch (currentSectionStatus.status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: t('sectionFeedback.status.pending'),
          description: executionMode === 'single' 
            ? t('sectionFeedback.description.pendingSingle')
            : t('sectionFeedback.description.pendingFrom'),
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      case 'generating':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          text: t('sectionFeedback.status.generating'),
          description: executionMode === 'single'
            ? t('sectionFeedback.description.generatingSingle')
            : t('sectionFeedback.description.generatingFrom'),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      case 'done':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: t('sectionFeedback.status.completed'),
          description: executionMode === 'single' 
            ? t('sectionFeedback.description.doneSingle')
            : t('sectionFeedback.description.doneFrom'),
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          text: t('sectionFeedback.status.processing'),
          description: t('sectionFeedback.description.default'),
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className={cn(
      "border-l-4 p-4 mb-4 rounded-lg",
      statusDisplay.bgColor,
      statusDisplay.borderColor,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {statusDisplay.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium", statusDisplay.textColor)}>
              {t('sectionFeedback.sectionIs', { status: statusDisplay.text })}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {statusDisplay.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {!executionFailed && (currentSectionStatus.status === 'running' || currentSectionStatus.status === 'pending' || currentSectionStatus.status === 'generating') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="hover:cursor-pointer"
              title={t('sectionFeedback.refreshStatus')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="hover:cursor-pointer"
            title={t('sectionFeedback.dismiss')}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
