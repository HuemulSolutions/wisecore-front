import { useQuery } from '@tanstack/react-query';
import { getExecutionsByDocumentId } from '@/services/executions';

export function useExecutionsByDocumentId(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['executions', documentId],
    queryFn: () => getExecutionsByDocumentId(documentId),
    enabled,
    refetchInterval: (query) => {
      try {
        // Check if there are any running executions
        const executions = query.state.data as any[];
        if (!executions) return false;
        
        const hasRunningExecution = executions.some((execution: any) => 
          ['running', 'pending', 'queued'].includes(execution.status)
        );
        
        // Poll every 3 seconds if there are running executions, otherwise don't poll
        return hasRunningExecution ? 3000 : false;
      } catch (error) {
        console.error('Error in refetchInterval for executions:', error);
        return false; // Stop polling on error
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 1000, // Consider data stale after 1 second
    retry: (failureCount) => {
      // Only retry up to 3 times
      if (failureCount >= 3) {
        console.error('Max retries reached for executions polling');
        return false;
      }
      return true;
    },
  });
}
