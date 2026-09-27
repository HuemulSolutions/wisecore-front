"use client"

import { useTranslation } from "react-i18next"
import { UserPlus } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { RolesUserChip } from "./roles-user-chip"
import { RolesUserAddPopover } from "./roles-user-add-popover"
import type { RoleUsersStagingApi } from "@/types/roles/users-staging"

export interface RolesDetailUsersTabProps {
  staging: RoleUsersStagingApi
  canAssignUsers: boolean
  canListUsers: boolean
  canCreateUser: boolean
  onOpenCreateUserSheet: () => void
}

/** Tab "Usuarios": lista con los 4 estados del staging — espejo del tab Roles de `/users`. */
export function RolesDetailUsersTab({
  staging,
  canAssignUsers,
  canListUsers,
  canCreateUser,
  onOpenCreateUserSheet,
}: RolesDetailUsersTabProps) {
  const { t } = useTranslation(["roles", "common"])

  const visibleUsers = staging.stagedUsers
  const excludeIds = new Set(visibleUsers.map((u) => u.id))

  return (
    <div className="flex flex-col gap-4 p-4">
      {canAssignUsers && canListUsers && (
        <div className="flex gap-2">
          <div className="flex-1">
            <RolesUserAddPopover
              excludeUserIds={excludeIds}
              onUserAdded={staging.add}
              disabled={staging.isSaving}
            />
          </div>
          {canCreateUser && (
            <HuemulButton
              variant="outline"
              size="sm"
              icon={UserPlus}
              label={t("roles:detail.createUserButton")}
              onClick={onOpenCreateUserSheet}
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
          <p className="text-xs text-destructive">{t("detail.errorLoadingUsers")}</p>
          <button
            type="button"
            onClick={() => staging.refetch()}
            className="text-xs font-medium text-primary hover:cursor-pointer hover:underline"
          >
            {t("common:tryAgain")}
          </button>
        </div>
      ) : visibleUsers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t("detail.usersEmpty")}
        </div>
      ) : (
        <div className="space-y-1.5">
          {visibleUsers.map((user) => (
            <RolesUserChip
              key={user.id}
              user={user}
              onToggle={staging.toggle}
              disabled={!canAssignUsers || staging.isSaving}
            />
          ))}
        </div>
      )}
    </div>
  )
}
