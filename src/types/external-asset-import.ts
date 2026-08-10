// Types for the "import asset from an external system" flow.
// POST /external-asset-import/ is synchronous (backend timeout 120s): it invokes an
// already-registered ExternalFunctionality (objective = 'import_asset') and returns the
// created asset in one shot — same response shape as POST /documents/. No job, no polling.

export interface ExternalAssetImportRequest {
  external_functionality_id: string
  folder_id?: string
  input: Record<string, string>
}

// Same shape as the POST /documents/ response (untyped there too — see services/assets.ts).
// Only the fields the frontend actually consumes are typed.
export interface ExternalAssetImportedAsset {
  id: string
  name: string
  [key: string]: unknown
}

export interface ExternalAssetImportResponse {
  data: ExternalAssetImportedAsset
  transaction_id: string
  timestamp: string
}

// Business error codes the endpoint can return (400/502). 404s are left unmapped —
// the backend message is shown as-is.
export type ExternalAssetImportErrorCode =
  | 'INVALID_EXTERNAL_IMPORT_FUNCTIONALITY_OBJECTIVE'
  | 'INACTIVE_EXTERNAL_SYSTEM'
  | 'EXTERNAL_INPUT_VALUE_NOT_FOUND'
  | 'EXTERNAL_ASSET_IMPORT_CALL_FAILED'
  | 'EXTERNAL_ASSET_IMPORT_HTTP_ERROR'
  | 'INVALID_EXTERNAL_ASSET_PAYLOAD'

// A form field derived from a {{input:key}} placeholder found in the functionality's body.
export interface ExternalInputField {
  key: string
  label: string
}
