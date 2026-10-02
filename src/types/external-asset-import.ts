// Types for the "import asset from an external system" flow.
// POST /external-asset-import/ invokes an already-registered ExternalFunctionality
// (objective = 'import_asset'):
// - sync functionality: waits for the external system (backend timeout 120s) and returns the
//   created asset in one shot — same response shape as POST /documents/ (200).
// - async functionality: the external system only accepts the task; the backend answers 202 with
//   an ExternalAssetImportRun and creates the asset when the external system calls back. The
//   frontend polls GET /external-asset-import/runs/{import_run_id} until completed/failed.

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

export type ExternalAssetImportRunStatus = 'pending' | 'awaiting_callback' | 'completed' | 'failed'

// State of an async import (202 body and GET /external-asset-import/runs/{id}).
// document_id / document_name are set once the status is 'completed'.
export interface ExternalAssetImportRun {
  import_run_id: string
  status: ExternalAssetImportRunStatus
  external_functionality_id: string
  folder_id: string | null
  document_id: string | null
  document_name: string | null
  error_detail: string | null
  callback_expires_at: string | null
  created_at: string | null
  finished_at: string | null
}

export interface ExternalAssetImportRunResponse {
  data: ExternalAssetImportRun
  transaction_id: string
  timestamp: string
}

// What POST /external-asset-import/ resolves to.
export type ExternalAssetImportResult =
  | { kind: 'created'; asset: ExternalAssetImportedAsset }
  | { kind: 'async'; run: ExternalAssetImportRun }

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
