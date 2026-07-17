import type { ExecutionRelationshipType, ExecutionRelationshipAttributeValue } from './execution-relationships'

// Persisted entities (shape returned by GET, embedded in Diagram.details / Diagram.texts)
export interface DiagramDetail {
  id: string
  diagram_id: string
  execution_id: string
  document_id: string
  position: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Denormalized by the backend so the canvas can render a node without
  // re-fetching the execution/document per detail (avoids an N+1 on load).
  execution_name: string
  document_type: { id: string; name: string; color: string }
}

export interface DiagramText {
  id: string
  diagram_id: string
  content: string
  position: Record<string, unknown>
  has_border: boolean
  border_type: string | null
  border_color: string | null
  font_color: string | null
  font_family: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface DiagramRelationshipDetail {
  id: string
  diagram_id: string
  execution_relationship_id: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Denormalized by the backend so the canvas can draw the saved edge without
  // re-fetching execution relationships per node (avoids an N+1 on load).
  relationship_type: ExecutionRelationshipType
  execution_relationship_name: string | null
  source_execution_id: string
  target_execution_id: string
  document_type_relationship: { id: string; name: string; min_count: number; max_count: number } | null
  attributes: ExecutionRelationshipAttributeValue[]
}

export interface Diagram {
  id: string
  name: string
  execution_id: string
  description: string | null
  snapshot_media_id: string | null
  details: DiagramDetail[]
  texts: DiagramText[]
  relationships: DiagramRelationshipDetail[]
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface DiagramsResponse {
  transaction_id: string
  data: Diagram[]
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface DiagramResponse {
  data: Diagram
  transaction_id: string
  timestamp: string
}

// execution_id matches diagram.execution_id OR any diagram_detail.execution_id (resolved backend-side)
export interface GetDiagramsParams {
  page?: number
  page_size?: number
  search?: string
  execution_id?: string
}

// Input shapes for create/update bodies — no id/diagram_id/audit fields, those are backend-assigned
export interface DiagramDetailInput {
  execution_id: string
  document_id: string
  position: Record<string, unknown>
}

export interface DiagramTextInput {
  content: string
  position: Record<string, unknown>
  has_border: boolean
  border_type?: string
  border_color?: string
  font_color?: string
  font_family?: string
}

export interface DiagramRelationshipInput {
  execution_relationship_id: string
}

export interface CreateDiagramRequest {
  name: string
  execution_id: string
  description?: string
  snapshot_media_id?: string | null
  // Backend requires at least 1 item (DIAGRAM_DETAILS_REQUIRED)
  details: DiagramDetailInput[]
  texts: DiagramTextInput[]
  relationships: DiagramRelationshipInput[]
}

// PUT fully replaces details/texts/relationships (not a partial patch) — all required, mirroring CreateDiagramRequest
export interface UpdateDiagramRequest {
  name?: string
  execution_id?: string
  description?: string
  snapshot_media_id?: string | null
  details: DiagramDetailInput[]
  texts: DiagramTextInput[]
  relationships: DiagramRelationshipInput[]
}
