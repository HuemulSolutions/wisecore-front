import { useQuery } from '@tanstack/react-query'
import { getLlmConfigurationStatus } from '@/services/llms'

export const llmConfigStatusQueryKey = (organizationId: string) =>
  ['llm-configuration-status', organizationId] as const

export function useLlmConfigurationStatus(organizationId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: llmConfigStatusQueryKey(organizationId ?? ''),
    queryFn: () => getLlmConfigurationStatus(organizationId!),
    enabled: !!organizationId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
