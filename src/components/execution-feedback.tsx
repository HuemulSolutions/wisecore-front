import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getExecutionById } from '@/services/executions';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ExecutionFeedbackProps {
  executionId: string | null;
  executionMode: 'full' | 'single' | 'from';
  onComplete?: () => void;
  className?: string;
}

export function ExecutionFeedback({
  executionId,
  executionMode,
  onComplete,
  className
}: ExecutionFeedbackProps) {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);

  // Poll execution status
  const { data: execution, refetch } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => {
      console.log('🔄 Fetching execution status for:', executionId);
      return getExecutionById(executionId!, selectedOrganizationId!);
    },
    enabled: !!executionId && !!selectedOrganizationId && pollingInterval !== false,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  // Log execution status changes
  useEffect(() => {
    if (execution) {
      console.log('📊 Execution status updated:', execution.status, 'ID:', execution.id);
    }
  }, [execution?.status, execution?.id]);

  // Handle status changes
  useEffect(() => {
    if (!execution) return;

    const status = execution.status;

    if (status === 'completed') {
      console.log('✅ Execution completed!');
      setPollingInterval(false);
      toast.success('Content generation completed!');
      onComplete?.();
    } else if (status === 'failed') {
      console.log('❌ Execution failed!');
      setPollingInterval(false);
      toast.error('Content generation failed');
      onComplete?.();
    }
  }, [execution?.status, onComplete]);

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
  };

  // Show different UI for full mode (overlay)
  if (executionMode === 'full') {
    if (!execution || execution.status === 'completed') {
      return null;
    }

    return (
      <div className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center",
        className
      )}>
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
          <div className="flex flex-col items-center text-center">
            {execution.status === 'running' && (
              <>
                <div className="w-16 h-16 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Generating Complete Document
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Creating a new version with all sections. This may take a few minutes...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="hover:cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </>
            )}
            {execution.status === 'pending' && (
              <>
                <div className="w-16 h-16 mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Execution Queued
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your execution is waiting to start...
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="hover:cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </>
            )}
            {execution.status === 'failed' && (
              <>
                <div className="w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Generation Failed
                </h3>
                <p className="text-sm text-gray-600">
                  There was an error generating the content.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For single/from modes, return null as we'll show inline feedback
  return null;
}

// Component to show inline feedback for sections being regenerated
interface SectionRegenerationFeedbackProps {
  sectionIndex: number;
  executionId: string;
  executionMode: 'single' | 'from';
  totalSections: number;
}

export function SectionRegenerationFeedback({
  sectionIndex,
  executionId,
  executionMode}: SectionRegenerationFeedbackProps) {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);

  // Poll execution status
  const { data: execution, refetch } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => {
      console.log('🔄 Fetching section execution status for:', executionId);
      return getExecutionById(executionId!, selectedOrganizationId!);
    },
    enabled: !!executionId && !!selectedOrganizationId && pollingInterval !== false,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (execution?.status === 'completed' || execution?.status === 'failed') {
      console.log('🛑 Section execution stopped polling:', execution.status);
      setPollingInterval(false);
    }
  }, [execution?.status]);

  const handleRefresh = () => {
    console.log('🔄 Manual section refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
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
            ? 'Regenerating this section...'
            : `Regenerating from section ${sectionIndex + 1}...`
          }
        </p>
        <p className="text-xs text-gray-600 mt-1 mb-3">
          {execution.status === 'pending' ? 'Starting...' : 'Processing...'}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="hover:cursor-pointer text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

// Component to show a banner when there's an execution in progress on a different version
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
      return getExecutionById(executionId!, selectedOrganizationId!);
    },
    enabled: !!executionId && !!selectedOrganizationId && pollingInterval !== false && !isDismissed,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (execution?.status === 'completed' || execution?.status === 'failed') {
      console.log('🛑 Other version execution stopped polling:', execution.status);
      setPollingInterval(false);
    }
  }, [execution?.status]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  const handleRefresh = () => {
    console.log('🔄 Manual other version refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
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

// Component to show a banner for the currently selected version that is executing
interface CurrentVersionExecutionBannerProps {
  executionId: string;
  executionName: string;
  onComplete?: () => void;
}

export function CurrentVersionExecutionBanner({
  executionId,
  onComplete
}: CurrentVersionExecutionBannerProps) {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);

  // Poll execution status
  const { data: execution, refetch } = useQuery({
    queryKey: ['execution-status', executionId],
    queryFn: () => {
      console.log('🔄 Fetching current version execution status for:', executionId);
      return getExecutionById(executionId!, selectedOrganizationId!);
    },
    enabled: !!executionId && !!selectedOrganizationId && pollingInterval !== false,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (execution?.status === 'completed' || execution?.status === 'failed') {
      console.log('🛑 Current version execution stopped polling:', execution.status);
      setPollingInterval(false);
      
      // Call onComplete callback when execution finishes
      if (execution?.status === 'completed') {
        console.log('✅ Current version completed, triggering refresh...');
        onComplete?.();
      }
    }
  }, [execution?.status, onComplete]);

  const handleRefresh = () => {
    console.log('🔄 Manual current version refresh triggered');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
    queryClient.invalidateQueries({ queryKey: ['document-content'] });
  };

  if (!execution) {
    return null;
  }

  const getStatusInfo = () => {
    switch (execution.status) {
      case 'running':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          text: 'Content is being generated',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          description: 'This version is currently being generated. The content will update automatically when complete.'
        };
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: 'Generation queued',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          description: 'This version is waiting in the queue to start generation.'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: 'Generation completed',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          description: 'Content generation completed successfully!'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          text: 'Generation failed',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          description: 'There was an error generating the content.'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          text: execution.status,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          description: `Status: ${execution.status}`
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
              {statusInfo.text}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {statusInfo.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="hover:cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
