"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Copy, Shield, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulPanelSaveBar } from "@/huemul/components/huemul-panel-save-bar"
import { roleRowSwatch } from "@/lib/reference-colors"
import { formatDate } from "@/lib/utils"
import { RolesDetailDetailsTab } from "./roles-detail-details-tab"
import { RolesDetailPermissionsTab } from "./roles-detail-permissions-tab"
import { RolesDetailUsersTab } from "./roles-detail-users-tab"
import { RolesDetailHierarchyTab } from "./roles-detail-hierarchy-tab"
import type { Role } from "@/types/rbac"
import type { RoleDetailTab } from "@/types/roles"
import type { RoleUsersStagingApi } from "@/types/roles/users-staging"
import type { RolePermissionsStagingApi } from "@/types/roles/permissions-staging"
import type { RoleDetailsFormApi } from "@/types/roles/details-form"

/** Espejo de `UserDetailPanelGuardApi` — ver ia context/sheet-footer-batch-save-guide.md. */
export interface RoleDetailPanelGuardApi {
  isDirty: boolean
  attemptNavigate: (proceed: () => void) => void
}

export interface RoleDetailPanelProps {
  role: Role
  activeTab: RoleDetailTab
  onTabChange: (tab: RoleDetailTab) => void
  onClose: () => void
  onDeleteRole: () => void
  onCloneRole: () => void
  staging: RoleUsersStagingApi
  permsStaging: RolePermissionsStagingApi
  detailsForm: RoleDetailsFormApi
  rolesById: Record<string, Role>
  canUpdate: boolean
  canDelete: boolean
  canClone: boolean
  canAssignUsers: boolean
  canListUsers: boolean
  canCreateUser: boolean
  onOpenCreateUserSheet: () => void
  onRegisterGuard?: (api: RoleDetailPanelGuardApi | null) => void
}

const UNDO_BANNER_TTL_MS = 8000

/** Panel de detalle de rol — espejo de `UserDetailPanel` (Permisos · Usuarios(n) · Jerarquía). */
export function RoleDetailPanel({
  role,
  activeTab,
  onTabChange,
  onClose,
  onDeleteRole,
  onCloneRole,
  staging,
  permsStaging,
  detailsForm,
  rolesById,
  canUpdate,
  canDelete,
  canClone,
  canAssignUsers,
  canListUsers,
  canCreateUser,
  onOpenCreateUserSheet,
  onRegisterGuard,
}: RoleDetailPanelProps) {
  const { t } = useTranslation(["roles", "common"])
  const swatch = roleRowSwatch(role.color)

  const [discardGuardOpen, setDiscardGuardOpen] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDirty = staging.isDirty || permsStaging.isDirty || detailsForm.isDirty

  const attemptNavigate = useCallback((proceed: () => void) => {
    if (!isDirty) {
      proceed()
      return
    }
    pendingActionRef.current = proceed
    setDiscardGuardOpen(true)
  }, [isDirty])

  useEffect(() => {
    onRegisterGuard?.({ isDirty, attemptNavigate })
    return () => onRegisterGuard?.(null)
  }, [isDirty, attemptNavigate, onRegisterGuard])

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
    const tab = value as RoleDetailTab
    if (tab === activeTab) return
    attemptNavigate(() => onTabChange(tab))
  }

  const handleClose = () => attemptNavigate(onClose)

  const pendingSummary = [
    staging.addedCount > 0 ? t("detail.pendingAdded", { count: staging.addedCount }) : null,
    staging.removedCount > 0 ? t("detail.pendingRemoved", { count: staging.removedCount }) : null,
  ].filter(Boolean).join(" · ")

  const activeUsersCount = staging.stagedUsers.filter((u) => u.status !== "removed").length
  const showUsersSaveBar = activeTab === "users" && canAssignUsers && (staging.isDirty || staging.isSaving)
  const showPermissionsSaveBar = activeTab === "permissions" && canUpdate && (permsStaging.isDirty || permsStaging.isSaving)
  const showDetailsSaveBar = activeTab === "details" && canUpdate && (detailsForm.isDirty || detailsForm.isSaving)

  const subtitle = [
    role.description || null,
    t("detail.permissionsSummary", { assigned: permsStaging.selectedIds.size, total: permsStaging.permissions.length }),
    t("detail.createdOn", { date: formatDate(new Date(role.created_at)) }),
  ].filter(Boolean).join(" · ")

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbfcfe]">
      <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: swatch.background }}
        >
          <Shield className="size-4" style={{ color: swatch.color }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-foreground">{role.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          icon={X}
          tooltip={t("common:close")}
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
              value="details"
              className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t("detail.tabDetails")}
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t("detail.tabPermissions")}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t("detail.tabUsers")}
              <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
                {activeUsersCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="hierarchy"
              className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t("detail.tabHierarchy")}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <TabsContent value="details" className="m-0 h-full">
            <RolesDetailDetailsTab
              form={detailsForm}
              permissionsSummary={{ assigned: permsStaging.selectedIds.size, total: permsStaging.permissions.length }}
              onGoToPermissions={() => handleTabChange("permissions")}
            />
          </TabsContent>
          <TabsContent value="permissions" className="m-0 h-full">
            <RolesDetailPermissionsTab staging={permsStaging} canUpdate={canUpdate} />
          </TabsContent>
          <TabsContent value="users" className="m-0 h-full">
            <RolesDetailUsersTab
              staging={staging}
              canAssignUsers={canAssignUsers}
              canListUsers={canListUsers}
              canCreateUser={canCreateUser}
              onOpenCreateUserSheet={onOpenCreateUserSheet}
            />
          </TabsContent>
          <TabsContent value="hierarchy" className="m-0 h-full">
            <RolesDetailHierarchyTab role={role} rolesById={rolesById} />
          </TabsContent>
        </div>
      </Tabs>

      {(canDelete || canClone) && !showUsersSaveBar && !showPermissionsSaveBar && !showDetailsSaveBar && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border p-4">
          {canDelete ? (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={Trash2}
              label={t("actions.deleteRole")}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDeleteRole}
            />
          ) : <span />}
          {canClone && (
            <HuemulButton
              variant="outline"
              size="sm"
              icon={Copy}
              label={t("actions.cloneRole")}
              onClick={onCloneRole}
            />
          )}
        </div>
      )}

      {staging.lastSaved && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#cdefd7] bg-[#f3fbf5] px-4 py-2 text-[12px] text-[#15803d]">
          <span>{t("detail.usersSaved", { count: staging.lastSaved.applied.length, name: role.name })}</span>
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

      {showUsersSaveBar && (
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

      {showPermissionsSaveBar && (
        <div className="shrink-0 px-4 pb-4">
          <HuemulPanelSaveBar
            isDirty={permsStaging.isDirty}
            isSaving={permsStaging.isSaving}
            saveLabel={t("detail.saveChanges")}
            discardLabel={t("detail.discardChanges")}
            onSave={() => void permsStaging.save()}
            onDiscard={() => permsStaging.discard()}
          />
        </div>
      )}

      {showDetailsSaveBar && (
        <div className="shrink-0 px-4 pb-4">
          <HuemulPanelSaveBar
            isDirty={detailsForm.isDirty}
            canSave={detailsForm.canSave}
            isSaving={detailsForm.isSaving}
            saveLabel={t("detail.saveChanges")}
            discardLabel={t("detail.discardChanges")}
            onSave={() => void detailsForm.save()}
            onDiscard={() => detailsForm.discard()}
          />
        </div>
      )}

      <HuemulAlertDialog
        open={discardGuardOpen}
        onOpenChange={setDiscardGuardOpen}
        title={t("detail.discardTitle")}
        description={t("detail.discardPendingDescription")}
        actionLabel={t("detail.discardChanges")}
        actionVariant="destructive"
        onAction={async () => {
          staging.discard()
          permsStaging.discard()
          detailsForm.discard()
          pendingActionRef.current?.()
          pendingActionRef.current = null
        }}
      />
    </div>
  )
}
