export type RoleFolderAccessLevel = 'view' | 'administer'

export interface RoleFolderAccessLevelsResponse {
  data: RoleFolderAccessLevel[]
  transaction_id: string
  page: number | null
  page_size: number | null
  has_next: boolean | null
  timestamp: string
}

// Item devuelto por GET /role-folder/roles/{role_id}
export interface RoleFolderByRole {
  id: string
  role_id: string
  folder_id: string
  folder_name: string
  access_level: RoleFolderAccessLevel
}

export interface RoleFolderByRoleResponse {
  data: RoleFolderByRole[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

// Item devuelto por GET /role-folder/folders/{folder_id}
export interface RoleFolderByFolder {
  id: string
  role_id: string
  role_name: string
  folder_id: string
  access_level: RoleFolderAccessLevel
}

export interface RoleFolderByFolderResponse {
  data: RoleFolderByFolder[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface GetRoleFolderListParams {
  page?: number
  page_size?: number
}

export interface CreateRoleFolderRequest {
  role_id: string
  folder_id: string
  access_levels: RoleFolderAccessLevel[]
}

export interface UpdateRoleFolderRequest {
  role_id: string
  folder_id: string
  access_levels: RoleFolderAccessLevel[]
}
