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

export interface Diagram {
  id: string
  name: string
  execution_id: string
  description: string | null
  snapshot_media_id: string | null
  details: DiagramDetail[]
  texts: DiagramText[]
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

export interface CreateDiagramRequest {
  name: string
  execution_id: string
  description?: string
  snapshot_media_id?: string | null
  // Backend requires at least 1 item (DIAGRAM_DETAILS_REQUIRED)
  details: DiagramDetailInput[]
  texts: DiagramTextInput[]
}

// PUT fully replaces details/texts (not a partial patch) — both required, mirroring CreateDiagramRequest
export interface UpdateDiagramRequest {
  name?: string
  execution_id?: string
  description?: string
  snapshot_media_id?: string | null
  details: DiagramDetailInput[]
  texts: DiagramTextInput[]
}
