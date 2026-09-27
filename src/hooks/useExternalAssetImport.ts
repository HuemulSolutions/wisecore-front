import { useMutation } from '@tanstack/react-query'
import { importAssetFromExternal } from '@/services/external-asset-import'
import type { ExternalAssetImportRequest } from '@/types/external-asset-import'

// Mutation-only hook — this flow has no list/detail query, so there are no queryKeys here.
export function useExternalAssetImportMutation(organizationId: string) {
  return useMutation({
    mutationFn: ({ body, signal }: { body: ExternalAssetImportRequest; signal?: AbortSignal }) =>
      importAssetFromExternal(organizationId, body, { signal }),
    // The success toast needs the created asset's name, so it's shown by the sheet itself.
    meta: { showSuccessToast: false },
  })
}
