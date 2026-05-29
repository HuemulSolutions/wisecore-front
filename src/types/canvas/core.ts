// Main entity — must match backend response shape exactly
export interface Canvas {
  id: string
  name: string
  width: number
  height: number
  is_active: boolean
  is_editable: boolean
  properties: Record<string, unknown> | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

// Paginated list response
export interface CanvasListResponse {
  data: Canvas[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

// Single-item response wrapper
export interface CanvasResponse {
  data: Canvas
  transaction_id: string
}

// Query params for list endpoint
export interface GetCanvasListParams {
  page?: number
  page_size?: number
  search?: string
  is_active?: boolean
}

// Request bodies
export interface CreateCanvasRequest {
  name: string
  width?: number
  height?: number
  is_active?: boolean
  is_editable?: boolean
  properties?: Record<string, unknown>
}

export interface UpdateCanvasRequest {
  name?: string
  width?: number
  height?: number
  is_active?: boolean
  is_editable?: boolean
  properties?: Record<string, unknown>
}
