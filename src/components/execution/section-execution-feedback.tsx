import { useEffect, useState } from 'react';
import { Loader2, Clock, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getExecutionStatus, getExecutionSectionsStatus } from '@/services/executions';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SectionExecutionFeedbackProps {
  executionId: string;
  sectionId: string;
  sectionIndex: number;  // 0-based index of the section
  executionMode: 'single' | 'from';
  onComplete?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function SectionExecutionFeedback({
  executionId,
  sectionId,
  sectionIndex,
  executionMode,
  onComplete,
  onDismiss,
  className
}: SectionExecutionFeedbackProps) {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);
  const [hasShownCompletedToast, setHasShownCompletedToast] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  console.log('🎯 SectionExecutionFeedback rendered with:', { 
    executionId, 
    sectionId,
    sectionIndex, 
    executionMode,
    selectedOrganizationId,
    pollingInterval
  });

  // Log when polling interval changes
  useEffect(() => {
    console.log('⏱️ Polling interval changed to:', pollingInterval);
  }, [pollingInterval]);

  // Poll sections status
  const queryEnabled = !!executionId && !!selectedOrganizationId && pollingInterval !== false;
  console.log('🔧 Query enabled check:', { 
    queryEnabled,
    hasExecutionId: !!executionId, 
    hasOrgId: !!selectedOrganizationId, 
    pollingActive: pollingInterval !== false 
  });

  const { data: sectionsStatus, refetch } = useQuery({
    queryKey: ['execution-sections-status', executionId],
    queryFn: () => {
      console.log('🔄 [SECTIONS_STATUS] Fetching sections status for execution:', executionId);
      return getExecutionSectionsStatus(executionId!, selectedOrganizationId!);
    },
    enabled: queryEnabled && !isDismissed,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  // Log sections data structure
  useEffect(() => {
    if (sectionsStatus?.sections) {
      console.log('📋 Sections array received:');
      console.log('  Total sections:', sectionsStatus.sections.length);
      console.log('  Looking for sectionIndex:', sectionIndex, '(0-based, so order should be', sectionIndex + 1, ')');
      console.log('  Section orders:', sectionsStatus.sections.map((s: any) => ({ order: s.order, name: s.name, status: s.status })));
    }
  }, [sectionsStatus, sectionIndex]);

  // Find the current section's status using 'order' field
  // Backend returns sections with order 1-based, so we add 1 to sectionIndex
  const targetOrder = sectionIndex + 1;
  const currentSectionStatus = sectionsStatus?.sections?.find(
    (section: any) => section.order === targetOrder
  );

  // Log status changes
  useEffect(() => {
    if (currentSectionStatus) {
      console.log('✅ Section status found:', {
        sectionIndex,
        targetOrder,
        status: currentSectionStatus.status,
        name: currentSectionStatus.name
      });
    } else if (sectionsStatus?.sections) {
      console.log('⚠️ Could not find section with order:', {
        targetOrder,
        sectionIndex,
        availableOrders: sectionsStatus.sections.map((s: any) => ({ order: s.order, name: s.name }))
      });
    }
  }, [currentSectionStatus?.status, sectionIndex, currentSectionStatus?.name, sectionsStatus, targetOrder]);

  // Handle completion based on section status (not overall execution status)
  useEffect(() => {
    if (!sectionsStatus || isDismissed) return;

    // Check if all sections are done (completed successfully)
    const allSectionsDone = sectionsStatus.sections?.every(
      (section: any) => section.status === 'done'
    );

    if (allSectionsDone) {
      console.log(`🛑 All sections completed, stopping polling`);
      setPollingInterval(false);

      // Show toast only once but don't dismiss banner automatically
      if (!hasShownCompletedToast) {
        console.log('✅ Section execution completed!');
        toast.success(
          executionMode === 'single' 
            ? 'Section regenerated successfully!' 
            : 'Sections regenerated successfully!'
        );
        setHasShownCompletedToast(true);
        onComplete?.();
      }
    }
  }, [sectionsStatus, hasShownCompletedToast, executionMode, onComplete, isDismissed]);

  // Separate effect to handle errors via overall execution status
  const { data: executionStatus } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => {
      console.log('🔄 [STATUS] Fetching overall execution status for:', executionId);
      return getExecutionStatus(executionId!, selectedOrganizationId!);
    },
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
      console.log(`❌ Execution ${overallStatus}, stopping polling`);
      setPollingInterval(false);

      if (!hasShownCompletedToast) {
        if (overallStatus === 'failed') {
          console.log('❌ Section execution failed!');
          toast.error('Section regeneration failed');
          setHasShownCompletedToast(true);
          onComplete?.();
        } else if (overallStatus === 'cancelled') {
          console.log('🚫 Section execution cancelled!');
          toast.info('Section regeneration was cancelled');
          setHasShownCompletedToast(true);
          onComplete?.();
        }
      }
    }
  }, [executionStatus?.status, hasShownCompletedToast, onComplete]);

  const handleRefresh = () => {
    console.log('🔄 Manual section refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-sections-status', executionId] });
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
    
    // Restart polling if it was stopped
    if (pollingInterval === false && !isDismissed) {
      console.log('🔄 Restarting section polling after manual refresh');
      setPollingInterval(2000);
    }
  };

  const handleDismiss = () => {
    console.log('❌ Section feedback dismissed by user');
    setIsDismissed(true);
    setPollingInterval(false);
    onDismiss?.();
  };

  // Log section status
  console.log('📊 Section feedback decision:', {
    currentSectionStatus: currentSectionStatus?.status,
    isDismissed,
    willShow: !isDismissed && currentSectionStatus && currentSectionStatus.status !== null
  });

  // Don't show if dismissed or no status yet
  if (isDismissed || !currentSectionStatus || currentSectionStatus.status === null) {
    console.log('❌ SectionExecutionFeedback: Not showing feedback - dismissed:', isDismissed, 'status:', currentSectionStatus?.status || 'no status');
    return null;
  }

  const getStatusDisplay = () => {
    switch (currentSectionStatus.status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: 'pending',
          description: executionMode === 'single' 
            ? 'This section is queued for regeneration'
            : 'Waiting for previous sections to complete',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      case 'generating':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          text: 'generating',
          description: executionMode === 'single'
            ? 'AI is regenerating this section...'
            : 'AI is working on this section...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      case 'done':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: 'completed',
          description: executionMode === 'single' 
            ? 'This section has been successfully regenerated. Click dismiss to remove this message.'
            : 'This section has been regenerated. Click dismiss to remove this message.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          text: 'processing',
          description: 'Section is being processed',
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
              Section is {statusDisplay.text}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {statusDisplay.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {(currentSectionStatus.status === 'running' || currentSectionStatus.status === 'pending' || currentSectionStatus.status === 'generating') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="hover:cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="hover:cursor-pointer"
            title="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
