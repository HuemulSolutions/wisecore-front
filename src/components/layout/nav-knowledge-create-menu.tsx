"use client"

import { Plus, File, Folder, FolderKanban, FileUp, FileJson, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useNavKnowledge } from "@/contexts/nav-knowledge-context"

export interface NavKnowledgeCreateMenuProps {
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

/**
 * Dropdown "+" de crear/importar assets y carpetas del panel de knowledge.
 * Compartido por el header del panel y por el rail colapsado.
 */
export function NavKnowledgeCreateMenu({ side, align = "end" }: NavKnowledgeCreateMenuProps = {}) {
  const { t } = useTranslation('layout')
  const { handleCreateAsset, handleImportAsset, handleImportAssetFromExternal, handleImportConfig, handleCreateFolder, handleCreateGroupFolder } = useNavKnowledge()
  const { canCreate, isOrgAdmin, hasAnyPermission, canManageGroupFolders } = useUserPermissions()

  const canCreateAsset = canCreate('asset')
  const canCreateFolder = canCreate('folder')
  // POST /folder/ con parent_folder_id: "root" requiere folder:c y (is_org_admin o folder:manage_groups).
  const canCreateGroupFolder = canCreateFolder && canManageGroupFolders
  // Requiere poder listar AMBOS catálogos: sin systems no hay cascada, sin functionalities no hay qué elegir.
  const canBrowseExternalCatalog =
    isOrgAdmin ||
    (hasAnyPermission(['external_system:l', 'external_system:r']) &&
      hasAnyPermission(['external_functionality:l', 'external_functionality:r']))
  const canImportFromExternal = canCreateAsset && canBrowseExternalCatalog

  if (!canCreateAsset && !canCreateFolder) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer">
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align}>
        {canCreateAsset && (
          <DropdownMenuItem
            onSelect={() => {
              setTimeout(() => handleCreateAsset(), 0)
            }}
            className="hover:cursor-pointer"
          >
            <File className="mr-2 h-4 w-4" />
            {t('knowledge.newAsset')}
          </DropdownMenuItem>
        )}
        {canCreateAsset && (
          <DropdownMenuItem
            onSelect={() => {
              setTimeout(() => handleImportAsset(), 0)
            }}
            className="hover:cursor-pointer"
          >
            <FileUp className="mr-2 h-4 w-4" />
            {t('knowledge.importAsset')}
          </DropdownMenuItem>
        )}
        {canImportFromExternal && (
          <DropdownMenuItem
            onSelect={() => {
              setTimeout(() => handleImportAssetFromExternal(), 0)
            }}
            className="hover:cursor-pointer"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t('knowledge.importAssetFromExternal')}
          </DropdownMenuItem>
        )}
        {canCreateAsset && (
          <DropdownMenuItem
            onSelect={() => {
              setTimeout(() => handleImportConfig(), 0)
            }}
            className="hover:cursor-pointer"
          >
            <FileJson className="mr-2 h-4 w-4" />
            {t('knowledge.importConfig')}
          </DropdownMenuItem>
        )}
        {canCreateFolder && (
          <DropdownMenuItem
            onSelect={() => {
              setTimeout(() => handleCreateFolder(), 0)
            }}
            className="hover:cursor-pointer"
          >
            <Folder className="mr-2 h-4 w-4" />
            {t('knowledge.newFolder')}
          </DropdownMenuItem>
        )}
        {canCreateGroupFolder && (
          <DropdownMenuItem
            onSelect={() => {
              setTimeout(() => handleCreateGroupFolder(), 0)
            }}
            className="hover:cursor-pointer"
          >
            <FolderKanban className="mr-2 h-4 w-4" />
            {t('knowledge.newGroupFolder')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
