import { useQuery } from '@tanstack/react-query';
import { getExecutionsByDocumentId } from '@/services/executions';

export function useExecutionsByDocumentId(documentId: string, organizationId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['executions', documentId, organizationId],
    queryFn: () => getExecutionsByDocumentId(documentId, organizationId),
    enabled,
    refetchInterval: (query) => {
      try {
        // Check if there are any running executions
        const executions = query.state.data as any[];
        if (!executions) return false;
        
        const hasRunningExecution = executions.some((execution: any) => 
          ['running', 'pending', 'queued'].includes(execution.status)
        );
        
        // Poll every 45 seconds if there are running executions, otherwise don't poll
        // Las ejecuciones cambian menos frecuentemente que el contenido
        return hasRunningExecution ? 45000 : false;
      } catch {
        console.error('Error in refetchInterval for executions');
        return false; // Stop polling on error
      }
    },
    refetchOnWindowFocus: (query) => {
      // Solo refetch en window focus si hay ejecuciones activas
      try {
        const executions = query.state.data as any[];
        if (!executions) return false;
        return executions.some((execution: any) => 
          ['running', 'pending', 'queued'].includes(execution.status)
        );
      } catch {
        return false;
      }
    },
    refetchOnReconnect: true,
    staleTime: 30000, // Consider data stale after 30 seconds
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
