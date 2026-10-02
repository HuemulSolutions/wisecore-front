import { backendUrl } from "@/config"
import { httpClient } from "@/lib/http-client"
import type {
  ExternalAssetImportRequest,
  ExternalAssetImportResponse,
  ExternalAssetImportResult,
  ExternalAssetImportRun,
  ExternalAssetImportRunResponse,
  ExternalAssetImportedAsset,
} from "@/types/external-asset-import"

const BASE_URL = `${backendUrl}/external-asset-import`

// Invokes the external system.
// - Sync functionality: waits for the created asset (200). The backend times out at 120s;
//   callers should race this with their own AbortSignal.
// - Async functionality: the external system only accepts the task (202) and the asset is
//   created later; poll getExternalAssetImportRun with the returned run.
export async function importAssetFromExternal(
  organizationId: string,
  body: ExternalAssetImportRequest,
  options: { signal?: AbortSignal } = {},
): Promise<ExternalAssetImportResult> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: {
      'X-Org-Id': organizationId,
    },
    signal: options.signal,
  })

  if (response.status === 202) {
    const data = (await response.json()) as ExternalAssetImportRunResponse
    return { kind: 'async', run: data.data }
  }
  const data = (await response.json()) as ExternalAssetImportResponse
  return { kind: 'created', asset: data.data }
}

// State of an async import. Only its creator or an org admin can read it (404 otherwise).
export async function getExternalAssetImportRun(
  organizationId: string,
  importRunId: string,
): Promise<ExternalAssetImportRun> {
  const response = await httpClient.get(`${BASE_URL}/runs/${importRunId}`, {
    headers: {
      'X-Org-Id': organizationId,
    },
  })
  const data = (await response.json()) as ExternalAssetImportRunResponse
  return data.data
}

export type {
  ExternalAssetImportRequest,
  ExternalAssetImportResponse,
  ExternalAssetImportResult,
  ExternalAssetImportRun,
  ExternalAssetImportedAsset,
}
