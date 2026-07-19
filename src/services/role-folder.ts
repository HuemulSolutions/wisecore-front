import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  RoleFolderAccessLevelsResponse,
  RoleFolderByRoleResponse,
  RoleFolderByFolderResponse,
  GetRoleFolderListParams,
  CreateRoleFolderRequest,
  UpdateRoleFolderRequest,
} from '@/types/role-folder'

const BASE_URL = `${backendUrl}/role-folder`

export async function getRoleFolderAccessLevels(
  organizationId: string,
): Promise<RoleFolderAccessLevelsResponse> {
  const response = await httpClient.get(`${BASE_URL}/access-levels`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<RoleFolderAccessLevelsResponse>
}

export async function getRoleFolderPermissionsByRole(
  organizationId: string,
  roleId: string,
  params: GetRoleFolderListParams = {},
): Promise<RoleFolderByRoleResponse> {
  const { page = 1, page_size = 100 } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })

  const response = await httpClient.get(`${BASE_URL}/roles/${roleId}?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<RoleFolderByRoleResponse>
}

export async function getRoleFolderPermissionsByFolder(
  organizationId: string,
  folderId: string,
  params: GetRoleFolderListParams = {},
): Promise<RoleFolderByFolderResponse> {
  const { page = 1, page_size = 100 } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })

  const response = await httpClient.get(`${BASE_URL}/folders/${folderId}?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<RoleFolderByFolderResponse>
}

export async function createRoleFolder(
  organizationId: string,
  body: CreateRoleFolderRequest,
): Promise<void> {
  await httpClient.post(BASE_URL, body, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export async function updateRoleFolder(
  organizationId: string,
  body: UpdateRoleFolderRequest,
): Promise<void> {
  await httpClient.put(BASE_URL, body, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export async function deleteRoleFolder(
  organizationId: string,
  roleId: string,
  folderId: string,
): Promise<void> {
  const query = new URLSearchParams({ role_id: roleId, folder_id: folderId })
  await httpClient.delete(`${BASE_URL}?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { RoleFolderByRole, RoleFolderByFolder } from '@/types/role-folder'
