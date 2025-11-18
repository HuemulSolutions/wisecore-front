import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { getExecutionStatus } from '@/services/executions';

interface ExecutionStatus {
  id: string;
  status: string;
  [key: string]: any;
}

interface UseExecutionPollingProps {
  executionId: string | null;
  enabled?: boolean;
  pollingInterval?: number;
  onStatusChange?: (status: string, execution: ExecutionStatus) => void;
}

export function useExecutionPolling({ 
  executionId, 
  enabled = true,
  pollingInterval = 3000,
  onStatusChange
}: UseExecutionPollingProps) {
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<string | null>(null);

  const { data: execution, isLoading, error, refetch } = useQuery<ExecutionStatus>({
    queryKey: ['execution-status', executionId],
    queryFn: () => getExecutionStatus(executionId!),
    enabled: enabled && !!executionId,
    refetchInterval: (query) => {
      try {
        // Stop polling if execution is completed or failed
        const executionData = query.state.data as ExecutionStatus;
        if (executionData?.status === 'completed' || executionData?.status === 'failed' || executionData?.status === 'approved') {
          return false;
        }
        return pollingInterval;
      } catch (error) {
        console.error('Error in refetchInterval:', error);
        return false; // Stop polling on error
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount) => {
      // Only retry up to 3 times
      if (failureCount >= 3) {
        console.error('Max retries reached for execution polling');
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Handle status changes in useEffect
  useEffect(() => {
    console.log('Polling execution status:', execution?.status, 'Previous:', previousStatusRef.current);
    if (onStatusChange && execution?.status && execution.status !== previousStatusRef.current) {
      console.log('Status changed from', previousStatusRef.current, 'to', execution.status);
      onStatusChange(execution.status, execution);
      previousStatusRef.current = execution.status;
    }
  }, [execution?.status, onStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queryClient.cancelQueries({ queryKey: ['execution-status', executionId] });
      previousStatusRef.current = null;
    };
  }, [queryClient, executionId]);

  const stopPolling = useCallback(() => {
    queryClient.cancelQueries({ queryKey: ['execution-status', executionId] });
  }, [queryClient, executionId]);

  const startPolling = useCallback(() => {
    refetch();
  }, [refetch]);

  const invalidateExecution = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['execution-status', executionId] });
  }, [queryClient, executionId]);

  return {
    execution,
    isLoading,
    error,
    stopPolling,
    startPolling,
    invalidateExecution,
    refetch
  };
}