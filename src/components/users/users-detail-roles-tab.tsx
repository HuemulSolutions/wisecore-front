"use client"

import { useTranslation } from "react-i18next"
import { Plus, Shield } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { UserRoleChip } from "./users-role-chip"
import { UsersRoleAddPopover } from "./users-role-add-popover"
import type { UserRolesStagingApi } from "@/types/users/roles-staging"
import type { Role } from "@/types/rbac"

export interface UsersDetailRolesTabProps {
  staging: UserRolesStagingApi
  /** Catálogo completo de roles (`useRolesMap`), para resolver el nombre del rol padre. */
  rolesById: Record<string, Role>
  canAssignRoles: boolean
  canListRoles: boolean
  canCreateRole: boolean
  onOpenCreateRoleSheet: (initialName: string) => void
}

/**
 * Tab "Roles": lista con los 4 estados del staging + bloque "Cargo y
 * jerarquía" (solo lectura en esta entrega — ver plan de implementación §4,
 * evita mezclar la mutación `PATCH /rbac/roles/{id}` con el guardado de
 * asignación bajo un solo botón).
 */
export function UsersDetailRolesTab({
  staging,
  rolesById,
  canAssignRoles,
  canListRoles,
  canCreateRole,
  onOpenCreateRoleSheet,
}: UsersDetailRolesTabProps) {
  const { t } = useTranslation("users")

  const visibleRoles = staging.stagedRoles
  const excludeIds = new Set(visibleRoles.map((r) => r.id))
  const positionRole = visibleRoles.find((r) => r.isPosition && r.status !== "removed")
  const parentName = positionRole?.parentRoleId ? rolesById[positionRole.parentRoleId]?.name : null

  return (
    <div className="flex flex-col gap-4 p-4">
      {canAssignRoles && canListRoles && (
        <div className="flex gap-2">
          <div className="flex-1">
            <UsersRoleAddPopover
              excludeRoleIds={excludeIds}
              onRoleAdded={staging.add}
              disabled={staging.isSaving}
            />
          </div>
          {canCreateRole && (
            <HuemulButton
              variant="outline"
              size="sm"
              icon={Plus}
              label={t("detail.createRoleButton")}
              onClick={() => onOpenCreateRoleSheet("")}
            />
          )}
        </div>
      )}

      {staging.isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : staging.error ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <p className="text-xs text-destructive">{t("detail.errorLoadingRoles")}</p>
          <button
            type="button"
            onClick={() => staging.refetch()}
            className="text-xs font-medium text-primary hover:cursor-pointer hover:underline"
          >
            {t("common:tryAgain")}
          </button>
        </div>
      ) : visibleRoles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t("detail.rolesEmpty")}
        </div>
      ) : (
        <div className="space-y-1.5">
          {visibleRoles.map((role) => (
            <UserRoleChip
              key={role.id}
              role={role}
              onToggle={staging.toggle}
              disabled={!canAssignRoles || staging.isSaving}
            />
          ))}
        </div>
      )}

      {positionRole && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Shield className="size-3" />
            {t("detail.hierarchyTitle")}
          </p>
          <p className="text-[13px] font-medium text-foreground">{positionRole.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {parentName
              ? t("detail.reportsTo", { name: parentName })
              : t("detail.noParent")}
          </p>
        </div>
      )}
    </div>
  )
}
