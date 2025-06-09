import { useQuery } from '@tanstack/react-query';
import { getExecutionsByDocumentId } from '@/services/executions';

export function useExecutionsByDocumentId(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['executions', documentId],
    queryFn: () => getExecutionsByDocumentId(documentId),
    enabled,
  });
}
