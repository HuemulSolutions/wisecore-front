import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getExecutionStatus } from '@/services/executions';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';

interface SectionRegenerationFeedbackProps {
  sectionIndex: number;
  executionId: string;
  executionMode: 'single' | 'from';
  totalSections: number;
}

export function SectionRegenerationFeedback({
  sectionIndex,
  executionId,
  executionMode,
  totalSections
}: SectionRegenerationFeedbackProps) {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { t } = useTranslation('execute');
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);

  // Poll execution status
  const { data: execution, refetch } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => {
      console.log('🔄 Fetching section execution status for:', executionId);
      return getExecutionStatus(executionId!, selectedOrganizationId!);
    },
    enabled: !!executionId && !!selectedOrganizationId && pollingInterval !== false,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const terminalStates = ['completed', 'failed', 'cancelled'];
    if (execution?.status && terminalStates.includes(execution.status)) {
      console.log('🛑 Section execution stopped polling:', execution.status);
      setPollingInterval(false);
    } else if (execution?.status === 'running' || execution?.status === 'pending') {
      // Ensure polling is active for active states
      if (pollingInterval === false) {
        console.log('🔄 Restarting section polling for active execution');
        setPollingInterval(2000);
      }
    }
  }, [execution?.status, pollingInterval]);

  const handleRefresh = () => {
    console.log('🔄 Manual section refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
    queryClient.invalidateQueries({ queryKey: ['document-content'] });
    
    // Restart polling if it was stopped
    if (pollingInterval === false) {
      console.log('🔄 Restarting section polling after manual refresh');
      setPollingInterval(2000);
    }
  };

  if (!execution || execution.status === 'completed') {
    return null;
  }

  const isRegenerating = execution.status === 'running' || execution.status === 'pending';
  
  if (!isRegenerating) return null;

  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
      <div className="text-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-900">
          {executionMode === 'single' 
            ? t('sectionRegeneration.regeneratingSingle', { current: sectionIndex + 1, ofTotal: totalSections ? t('sectionRegeneration.ofTotal', { total: totalSections }) : '' })
            : t('sectionRegeneration.regeneratingFrom', { current: sectionIndex + 1, ofTotal: totalSections ? t('sectionRegeneration.ofTotal', { total: totalSections }) : '' })
          }
        </p>
        <p className="text-xs text-gray-600 mt-1 mb-3">
          {execution.status === 'pending' ? t('sectionRegeneration.starting') : t('sectionRegeneration.processing')}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="hover:cursor-pointer text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          {t('sectionRegeneration.refresh')}
        </Button>
      </div>
    </div>
  );
}
