"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Share2, Plus, Trash2, Edit2, Check, X, Eye, ShieldCheck } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useRoles } from "@/hooks/useRbac"
import {
  useRoleFolderAccessLevels,
  useRoleFolderPermissionsByFolder,
  useRoleFolderMutations,
} from "@/hooks/useRoleFolder"
import type { RoleFolderAccessLevel } from "@/types/role-folder"

const ACCESS_LEVEL_ICON: Record<RoleFolderAccessLevel, typeof Eye> = {
  view: Eye,
  administer: ShieldCheck,
}

interface FolderPermissionsSheetProps {
  folder: { id: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FolderPermissionsSheet({ folder, open, onOpenChange }: FolderPermissionsSheetProps) {
  const { t } = useTranslation(["role-folder", "common"])
  const { selectedOrganizationId } = useOrganization()
  const [searchRole, setSearchRole] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [newLevels, setNewLevels] = useState<Set<RoleFolderAccessLevel>>(new Set())
  const [roleToRevoke, setRoleToRevoke] = useState<{ id: string; name: string } | null>(null)
  const [editingGrant, setEditingGrant] = useState<{ roleId: string; levels: Set<RoleFolderAccessLevel> } | null>(null)

  const { data: rolesData, isLoading: isLoadingRoles } = useRoles(open, 1, 1000)
  const { data: accessLevelsData, isLoading: isLoadingAccessLevels } = useRoleFolderAccessLevels(
    selectedOrganizationId || "",
    open && !!selectedOrganizationId,
  )
  const { data: grantsData, isLoading: isLoadingGrants } = useRoleFolderPermissionsByFolder(
    selectedOrganizationId || "",
    folder?.id || "",
    { enabled: open && !!selectedOrganizationId && !!folder },
  )
  const { createRoleFolder, updateRoleFolder, deleteRoleFolder } = useRoleFolderMutations(selectedOrganizationId || "")

  const isLoading = isLoadingRoles || isLoadingAccessLevels || isLoadingGrants
  const roles = rolesData?.data || []
  const accessLevels = accessLevelsData?.data || []

  // role_id -> niveles ya otorgados, agrupando las filas (una por nivel) que devuelve el backend.
  const grantsByRole = new Map<string, Set<RoleFolderAccessLevel>>()
  ;(grantsData?.data || []).forEach((grant) => {
    const set = grantsByRole.get(grant.role_id) ?? new Set<RoleFolderAccessLevel>()
    set.add(grant.access_level)
    grantsByRole.set(grant.role_id, set)
  })

  const grantedRoles = roles.filter((role) => grantsByRole.has(role.id))
  const availableRoles = roles.filter((role) => !grantsByRole.has(role.id))

  const filteredGrantedRoles = grantedRoles.filter((role) =>
    role.name.toLowerCase().includes(searchRole.toLowerCase())
  )

  const toggleNewLevel = (level: RoleFolderAccessLevel, checked: boolean) => {
    setNewLevels((prev) => {
      const next = new Set(prev)
      if (checked) next.add(level)
      else next.delete(level)
      return next
    })
  }

  const handleAddRole = () => {
    if (!folder || !selectedRoleId || newLevels.size === 0) return
    createRoleFolder.mutate(
      { role_id: selectedRoleId, folder_id: folder.id, access_levels: [...newLevels] },
      {
        onSuccess: () => {
          setSelectedRoleId("")
          setNewLevels(new Set())
        },
      },
    )
  }

  const startEditingGrant = (roleId: string) => {
    const current = grantsByRole.get(roleId) ?? new Set<RoleFolderAccessLevel>()
    setEditingGrant({ roleId, levels: new Set(current) })
  }

  const cancelEditingGrant = () => setEditingGrant(null)

  const toggleEditingGrantLevel = (level: RoleFolderAccessLevel, checked: boolean) => {
    setEditingGrant((prev) => {
      if (!prev) return prev
      const next = new Set(prev.levels)
      if (checked) next.add(level)
      else next.delete(level)
      return { ...prev, levels: next }
    })
  }

  const handleSaveEditingGrant = async () => {
    if (!editingGrant || !folder || editingGrant.levels.size === 0) return
    await updateRoleFolder.mutateAsync({
      role_id: editingGrant.roleId,
      folder_id: folder.id,
      access_levels: [...editingGrant.levels],
    })
    setEditingGrant(null)
  }

  const isRevoking = (roleId: string) =>
    deleteRoleFolder.isPending && deleteRoleFolder.variables?.roleId === roleId

  if (!folder) return null

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('role-folder:permissionsDialog.title', { name: folder.name })}
        description={t('role-folder:permissionsDialog.description')}
        icon={Share2}
        side="right"
        maxWidth="sm:max-w-xl"
        showFooter={false}
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {availableRoles.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                <div>
                  <div className="text-sm font-medium">{t('role-folder:permissionsDialog.grantSection')}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('role-folder:permissionsDialog.grantSectionDescription')}
                  </p>
                </div>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('role-folder:permissionsDialog.selectRolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AccessLevelOptions
                  accessLevels={accessLevels}
                  checked={newLevels}
                  onToggle={toggleNewLevel}
                  t={t}
                />
                <HuemulButton
                  label={t('role-folder:permissionsDialog.addButton')}
                  icon={Plus}
                  size="sm"
                  onClick={handleAddRole}
                  disabled={!selectedRoleId || newLevels.size === 0}
                  loading={createRoleFolder.isPending}
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="text-sm font-medium">{t('role-folder:permissionsDialog.grantedSection')}</div>

              {grantedRoles.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('role-folder:permissionsDialog.searchPlaceholder')}
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    className="pl-8"
                  />
                </div>
              )}

              {grantedRoles.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {t('role-folder:permissionsDialog.noRolesAvailable')}
                  </p>
                </div>
              ) : filteredGrantedRoles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">{t('role-folder:permissionsDialog.noRolesFound')}</p>
                  <p className="text-muted-foreground text-xs mt-1">{t('role-folder:permissionsDialog.adjustSearch')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGrantedRoles.map((role) => {
                    const levels = grantsByRole.get(role.id) ?? new Set<RoleFolderAccessLevel>()
                    const isEditingRow = editingGrant?.roleId === role.id
                    const isOtherRowEditing = editingGrant !== null && !isEditingRow
                    const revoking = isRevoking(role.id)

                    if (isEditingRow && editingGrant) {
                      return (
                        <div key={role.id} className="border rounded-lg p-4 bg-muted/20 space-y-4">
                          <div className="text-sm font-medium truncate">{role.name}</div>
                          <AccessLevelOptions
                            accessLevels={accessLevels}
                            checked={editingGrant.levels}
                            onToggle={toggleEditingGrantLevel}
                            disabled={updateRoleFolder.isPending}
                            t={t}
                          />
                          <div className="flex items-center gap-2">
                            <HuemulButton
                              label={t('common:save')}
                              icon={Check}
                              size="sm"
                              disabled={editingGrant.levels.size === 0}
                              loading={updateRoleFolder.isPending}
                              onClick={handleSaveEditingGrant}
                            />
                            <HuemulButton
                              label={t('common:cancel')}
                              icon={X}
                              variant="outline"
                              size="sm"
                              disabled={updateRoleFolder.isPending}
                              onClick={cancelEditingGrant}
                            />
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={role.id}
                        className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition"
                      >
                        <div className="font-medium text-sm truncate">{role.name}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            {accessLevels
                              .filter((level) => levels.has(level))
                              .map((level) => (
                                <Badge key={level} variant="outline" className="text-xs font-normal">
                                  {t(`role-folder:permissionsDialog.${level}`, level)}
                                </Badge>
                              ))}
                          </div>
                          <HuemulButton
                            icon={Edit2}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={isOtherRowEditing || revoking}
                            onClick={() => startEditingGrant(role.id)}
                            tooltip={t('role-folder:permissionsDialog.editButton')}
                            tooltipSide="left"
                          />
                          <HuemulButton
                            icon={Trash2}
                            size="sm"
                            variant="destructive"
                            className="h-6 px-2"
                            disabled={isOtherRowEditing}
                            loading={revoking}
                            onClick={() => setRoleToRevoke({ id: role.id, name: role.name })}
                            tooltip={t('role-folder:permissionsDialog.removeButton')}
                            tooltipSide="left"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </HuemulSheet>

      <HuemulAlertDialog
        open={!!roleToRevoke}
        onOpenChange={(open) => !open && setRoleToRevoke(null)}
        title={t('role-folder:permissionsDialog.removeTitle')}
        description={t('role-folder:permissionsDialog.removeDescription', {
          roleName: roleToRevoke?.name,
          folderName: folder.name,
        })}
        actionLabel={t('role-folder:permissionsDialog.removeButton')}
        onAction={async () => {
          if (!roleToRevoke) return
          await new Promise<void>((resolve, reject) => {
            deleteRoleFolder.mutate(
              { roleId: roleToRevoke.id, folderId: folder.id },
              { onSuccess: () => resolve(), onError: (e) => reject(e) },
            )
          })
        }}
      />
    </>
  )
}

function AccessLevelOptions({
  accessLevels,
  checked,
  onToggle,
  disabled,
  t,
}: {
  accessLevels: RoleFolderAccessLevel[]
  checked: Set<RoleFolderAccessLevel>
  onToggle: (level: RoleFolderAccessLevel, checked: boolean) => void
  disabled?: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <div className="space-y-2">
      {accessLevels.map((level) => {
        const Icon = ACCESS_LEVEL_ICON[level]
        return (
          <label
            key={level}
            className="flex items-start gap-3 rounded-md border bg-background p-3 hover:bg-muted/40 hover:cursor-pointer transition"
          >
            <Checkbox
              checked={checked.has(level)}
              disabled={disabled}
              onCheckedChange={(c) => onToggle(level, c as boolean)}
              className="mt-0.5"
            />
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium">{t(`role-folder:permissionsDialog.${level}`, level)}</div>
              <div className="text-xs text-muted-foreground">
                {t(`role-folder:permissionsDialog.${level}Description`)}
              </div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
