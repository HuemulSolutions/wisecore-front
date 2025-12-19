import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { getExecutionStatus } from '@/services/executions';
import { useOrganizationId } from '@/hooks/use-organization';

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
  const selectedOrganizationId = useOrganizationId();
  const previousStatusRef = useRef<string | null>(null);

  const { data: execution, isLoading, error, refetch } = useQuery<ExecutionStatus>({
    queryKey: ['execution-status', executionId],
    queryFn: () => getExecutionStatus(executionId!, selectedOrganizationId!),
    enabled: enabled && !!executionId && !!selectedOrganizationId,
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
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount) => {
      // Only retry up to 3 times
      if (failureCount >= 3) {
        console.error('Max retries reached for execution polling');
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 2000, // Consider data stale after 2 seconds to ensure fresh data
  });

  // Handle status changes in useEffect
  useEffect(() => {
    console.log('Polling execution status:', execution?.status, 'Previous:', previousStatusRef.current);
    if (onStatusChange && execution?.status) {
      // Initialize previousStatusRef if this is the first time we get a status
      if (previousStatusRef.current === null && execution.status) {
        console.log('Initializing status tracking with:', execution.status);
        previousStatusRef.current = execution.status;
        return; // Don't trigger callback on initialization
      }
      
      // Trigger callback only when status actually changes
      if (execution.status !== previousStatusRef.current) {
        console.log('Status changed from', previousStatusRef.current, 'to', execution.status);
        // Update the ref before calling the callback to prevent race conditions
        const prevStatus = previousStatusRef.current;
        previousStatusRef.current = execution.status;
        
        // Call the callback with the execution data
        try {
          onStatusChange(execution.status, execution);
        } catch (error) {
          console.error('Error in onStatusChange callback:', error);
          // Revert the ref in case of error
          previousStatusRef.current = prevStatus;
        }
      }
    }
  }, [execution?.status, execution?.id, onStatusChange]);

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
    // Also invalidate related queries to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['document-content'] });
    queryClient.invalidateQueries({ queryKey: ['executions'] });
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