import { backendUrl } from "@/config"
import { httpClient } from "@/lib/http-client"
import type {
  ExternalAssetImportRequest,
  ExternalAssetImportResponse,
  ExternalAssetImportedAsset,
} from "@/types/external-asset-import"

const BASE_URL = `${backendUrl}/external-asset-import`

// Synchronous call — invokes the external system and waits for the created asset.
// The backend times out at 120s; callers should race this with their own AbortSignal.
export async function importAssetFromExternal(
  organizationId: string,
  body: ExternalAssetImportRequest,
  options: { signal?: AbortSignal } = {},
): Promise<ExternalAssetImportedAsset> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: {
      'X-Org-Id': organizationId,
    },
    signal: options.signal,
  })

  const data = (await response.json()) as ExternalAssetImportResponse
  return data.data
}

export type { ExternalAssetImportRequest, ExternalAssetImportResponse, ExternalAssetImportedAsset }
