import { useEffect, useState } from 'react';
import { Loader2, Clock, RefreshCw, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getAiSuggestion } from '@/services/section_execution';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AiSuggestionFeedbackProps {
  sectionExecutionId: string;
  onCompleted: (content: string) => void;
  onFailed?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AiSuggestionFeedback({
  sectionExecutionId,
  onCompleted,
  onFailed,
  onDismiss,
  className,
}: AiSuggestionFeedbackProps) {
  const { selectedOrganizationId } = useOrganization();
  const { t } = useTranslation('execute');
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasHandledTerminalState, setHasHandledTerminalState] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['ai-suggestion', sectionExecutionId],
    queryFn: () => getAiSuggestion(sectionExecutionId, selectedOrganizationId ?? undefined),
    enabled: !!sectionExecutionId && !!selectedOrganizationId && pollingInterval !== false && !isDismissed,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!data || hasHandledTerminalState) return;

    if (data.status === 'completed' && data.content != null) {
      setPollingInterval(false);
      setHasHandledTerminalState(true);
      toast.success(t('aiSuggestion.toast.success'));
      onCompleted(data.content);
    } else if (data.status === 'failed') {
      setPollingInterval(false);
      setHasHandledTerminalState(true);
      toast.error(t('aiSuggestion.toast.failed'));
      onFailed?.();
    }
  }, [data?.status, data?.content, hasHandledTerminalState, onCompleted, onFailed, t]);

  const handleRefresh = () => {
    refetch();
    if (pollingInterval === false && !isDismissed) {
      setPollingInterval(2000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setPollingInterval(false);
    onDismiss?.();
  };

  if (isDismissed || data?.status === null || data?.status == null) {
    return null;
  }

  const getStatusDisplay = () => {
    switch (data?.status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: t('aiSuggestion.status.pending'),
          description: t('aiSuggestion.description.pending'),
          textColor: 'text-amber-800',
          bgColor: 'bg-amber-50 border-amber-200',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: t('aiSuggestion.status.completed'),
          description: t('aiSuggestion.description.completed'),
          textColor: 'text-green-800',
          bgColor: 'bg-green-50 border-green-200',
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          text: t('aiSuggestion.status.failed'),
          description: data?.error ?? t('aiSuggestion.description.failed'),
          textColor: 'text-red-800',
          bgColor: 'bg-red-50 border-red-200',
        };
      default:
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />,
          text: t('aiSuggestion.status.processing'),
          description: t('aiSuggestion.description.processing'),
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-50 border-blue-200',
        };
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
