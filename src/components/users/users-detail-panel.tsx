"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Edit, Trash2, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulPanelSaveBar } from "@/huemul/components/huemul-panel-save-bar"
import { useRolesMap } from "@/contexts/role-refs-context"
import { UsersDetailProfileTab } from "./users-detail-profile-tab"
import { UsersDetailRolesTab } from "./users-detail-roles-tab"
import type { User, UserDetailTab } from "@/types/users"
import type { UserRolesStagingApi } from "@/types/users/roles-staging"
import type { useUserMutations } from "@/hooks/useUsers"

/**
 * Registro imperativo (mismo idioma que `onRegisterEditor` de
 * ia context/sheet-footer-batch-save-guide.md): la tabla/página consulta
 * "¿hay cambios pendientes?" antes de cambiar de fila. `onRegisterGuard`
 * debe ser estable (`useCallback`, deps vacías) en el padre.
 */
export interface UserDetailPanelGuardApi {
  isDirty: boolean
  attemptNavigate: (proceed: () => void) => void
}

export interface UserDetailPanelProps {
  user: User
  activeTab: UserDetailTab
  onTabChange: (tab: UserDetailTab) => void
  onClose: () => void
  onEditUser: () => void
  onDeleteUser: () => void
  onOpenCreateRoleSheet: (initialName: string) => void
  userMutations: ReturnType<typeof useUserMutations>
  canUpdate: boolean
  canDelete: boolean
  canManageRootAdmin: boolean
  canAssignRoles: boolean
  canListRoles: boolean
  canCreateRole: boolean
  onRegisterGuard?: (api: UserDetailPanelGuardApi | null) => void
  /**
   * El staging vive en la página (`useUserRolesStaging` en `users.tsx`), no
   * acá adentro: `CreateRoleSheet` se monta como sibling del layout (ver
   * ia context/inline-create-entity-in-sheet-guide.md) y su `onCreated`
   * necesita llegar a `staging.add` sin pasar por este componente.
   */
  staging: UserRolesStagingApi
}

function getInitials(user: User) {
  return `${user.name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
}

const UNDO_BANNER_TTL_MS = 8000

export function UserDetailPanel({
  user,
  activeTab,
  onTabChange,
  onClose,
  onEditUser,
  onDeleteUser,
  onOpenCreateRoleSheet,
  userMutations,
  canUpdate,
  canDelete,
  canManageRootAdmin,
  canAssignRoles,
  canListRoles,
  canCreateRole,
  onRegisterGuard,
  staging,
}: UserDetailPanelProps) {
  const { t } = useTranslation(["users", "common"])
  const { byId: rolesById } = useRolesMap(canListRoles)

  const [discardGuardOpen, setDiscardGuardOpen] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Solo las 3 acciones que efectivamente sacan al usuario de un staging
  // pendiente (cambiar de tab, cerrar el panel, cambiar de fila — esto
  // último vía onRegisterGuard) pasan por el guard. Editar/eliminar/admin
  // root abren un overlay que no toca el staging de roles: no tiene sentido
  // pedir descartar roles para abrir el sheet de edición de datos.
  const attemptNavigate = useCallback((proceed: () => void) => {
    if (!staging.isDirty) {
      proceed()
      return
    }
    pendingActionRef.current = proceed
    setDiscardGuardOpen(true)
  }, [staging.isDirty])

  useEffect(() => {
    onRegisterGuard?.({ isDirty: staging.isDirty, attemptNavigate })
    return () => onRegisterGuard?.(null)
  }, [staging.isDirty, attemptNavigate, onRegisterGuard])

  // La banda "N roles asignados... Deshacer" se retira sola tras un rato.
  useEffect(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    if (!staging.lastSaved) return undefined
    undoTimerRef.current = setTimeout(() => staging.dismissUndo(), UNDO_BANNER_TTL_MS)
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staging.lastSaved])

  const handleTabChange = (value: string) => {
    const tab = value as UserDetailTab
    if (tab === activeTab) return
    attemptNavigate(() => onTabChange(tab))
  }

  const handleClose = () => attemptNavigate(onClose)

  const pendingSummary = [
    staging.addedCount > 0 ? t("detail.pendingAdded", { count: staging.addedCount }) : null,
    staging.removedCount > 0 ? t("detail.pendingRemoved", { count: staging.removedCount }) : null,
  ].filter(Boolean).join(" · ")

  const activeRolesCount = staging.stagedRoles.filter((r) => r.status !== "removed").length
  const showRolesSaveBar = activeTab === "roles" && canAssignRoles && (staging.isDirty || staging.isSaving)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbfcfe]">
      <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
        <Avatar size="lg">
          {user.photo_url && <AvatarImage src={user.photo_url} alt={user.name} />}
          <AvatarFallback className="bg-[#475569] text-xs font-semibold text-white">{getInitials(user)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-foreground">
            {user.name} {user.last_name}
          </p>
          <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
        </div>
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          icon={X}
          tooltip={t("detail.close")}
          onClick={handleClose}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 border-b border-border px-4 pt-2">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t("detail.tabProfile")}
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t("detail.tabRoles")}
              <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
                {activeRolesCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <TabsContent value="profile" className="m-0 h-full">
            <UsersDetailProfileTab
              user={user}
              userMutations={userMutations}
              canUpdate={canUpdate}
              canManageRootAdmin={canManageRootAdmin}
            />
          </TabsContent>
          <TabsContent value="roles" className="m-0 h-full">
            <UsersDetailRolesTab
              staging={staging}
              rolesById={rolesById}
              canAssignRoles={canAssignRoles}
              canListRoles={canListRoles}
              canCreateRole={canCreateRole}
              onOpenCreateRoleSheet={onOpenCreateRoleSheet}
            />
          </TabsContent>
        </div>
      </Tabs>

      {(canUpdate || canDelete) && !showRolesSaveBar && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border p-4">
          {canDelete ? (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={Trash2}
              label={t("users:actions.deleteUser")}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDeleteUser}
            />
          ) : <span />}
          {canUpdate && (
            <HuemulButton
              variant="outline"
              size="sm"
              icon={Edit}
              label={t("users:actions.editUser")}
              onClick={onEditUser}
            />
          )}
        </div>
      )}

      {staging.lastSaved && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#cdefd7] bg-[#f3fbf5] px-4 py-2 text-[12px] text-[#15803d]">
          <span>
            {t("detail.saved", { count: staging.lastSaved.applied.length, name: user.name })}
            {staging.lastSaved.hadCreated ? ` ${t("detail.savedKeepsCreated")}` : ""}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="font-medium hover:cursor-pointer hover:underline"
              onClick={() => void staging.undo()}
            >
              {t("common:undo")}
            </button>
            <button
              type="button"
              aria-label={t("common:close")}
              className="text-[#15803d]/70 hover:cursor-pointer"
              onClick={staging.dismissUndo}
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {showRolesSaveBar && (
        <div className="shrink-0 px-4 pb-4">
          <HuemulPanelSaveBar
            isDirty={staging.isDirty}
            isSaving={staging.isSaving}
            dirtyLabel={pendingSummary}
            saveLabel={t("detail.saveChanges")}
            discardLabel={t("detail.discardChanges")}
            onSave={() => void staging.save()}
            onDiscard={() => staging.discard()}
          />
        </div>
      )}

      <HuemulAlertDialog
        open={discardGuardOpen}
        onOpenChange={setDiscardGuardOpen}
        title={t("detail.discardTitle")}
        description={
          staging.createdCount > 0
            ? t("detail.discardDescriptionWithCreated")
            : t("detail.discardDescription")
        }
        actionLabel={t("detail.discardChanges")}
        actionVariant="destructive"
        onAction={async () => {
          staging.discard()
          pendingActionRef.current?.()
          pendingActionRef.current = null
        }}
      />
    </div>
  )
}
