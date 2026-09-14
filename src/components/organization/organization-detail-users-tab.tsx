"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { RefreshCw, UserPlus } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { isStatusCode } from "@/lib/error-utils"
import { assignUserToOrganization, removeUserFromOrganization } from "@/services/users"
import { useOrganizationUsers, useSetOrganizationAdmin, organizationQueryKeys } from "@/hooks/useOrganizations"
import { globalUserQueryKeys } from "@/hooks/useUsers"
import { OrganizationUserRow } from "./organization-user-row"
import { OrganizationUserAddPopover } from "./organization-user-add-popover"
import CreateUserSheet from "@/components/users/users-create-sheet"
import type { Organization, OrganizationUser } from "@/types/organizations"
import type { User } from "@/types/users"

export interface OrganizationDetailUsersTabProps {
  organization: Organization
  canListUsers: boolean
  canSetAdmin: boolean
  /** Root-admin-only: agrega "Agregar usuario" y "Quitar" por fila. */
  canManageMembers?: boolean
}

/**
 * Tab "Usuarios": lista de `GET /organizations/{id}/users` + "Hacer admin"
 * por fila (siempre visible con `canSetAdmin`). Con `canManageMembers`
 * (root-admin) suma agregar/quitar membership — espejo acotado del tab
 * Usuarios de `/roles`, con las dos mutaciones de
 * `POST`/`DELETE /organizations/{id}/users` (antes solo en
 * `UserOrganizationsDialog`, root-admin-only vía `/global-admin`).
 */
export function OrganizationDetailUsersTab({ organization, canListUsers, canSetAdmin, canManageMembers = false }: OrganizationDetailUsersTabProps) {
  const { t } = useTranslation(['organizations', 'users', 'common'])
  const queryClient = useQueryClient()
  const [confirmingUser, setConfirmingUser] = useState<OrganizationUser | null>(null)
  const [removingUser, setRemovingUser] = useState<OrganizationUser | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)

  const { data, isLoading, isFetching, error, refetch } = useOrganizationUsers(
    canListUsers ? organization.id : undefined
  )
  const setAdminMutation = useSetOrganizationAdmin()

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: organizationQueryKeys.usersBase(organization.id) })
  }

  const assignMutation = useMutation({
    mutationFn: (user: User) => assignUserToOrganization(organization.id, { user_id: user.id }),
    meta: { successMessage: t('users:organizations.assignedSuccess') },
    onSuccess: invalidateMembers,
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeUserFromOrganization(organization.id, userId),
    meta: { successMessage: t('users:organizations.removedSuccess') },
    onSuccess: invalidateMembers,
  })

  const users = [...(data?.data ?? [])].sort((a, b) => {
    if (a.is_org_admin !== b.is_org_admin) return a.is_org_admin ? -1 : 1
    return `${a.name} ${a.last_name}`.localeCompare(`${b.name} ${b.last_name}`)
  })
  const memberUserIds = new Set(users.map((u) => u.id))
  const isForbidden = isStatusCode(error, 403)

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground">{t('detail.usersSectionTitle')}</p>
          <p className="text-[11px] text-muted-foreground">{t('detail.usersSectionHint')}</p>
        </div>
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          icon={RefreshCw}
          tooltip={t('common:refresh')}
          loading={isFetching}
          onClick={() => void refetch()}
          disabled={!canListUsers}
        />
      </div>

      {canManageMembers && canListUsers && (
        <div className="flex gap-2">
          <div className="flex-1">
            <OrganizationUserAddPopover
              excludeUserIds={memberUserIds}
              onUserAdded={(user) => assignMutation.mutate(user)}
              disabled={assignMutation.isPending}
            />
          </div>
          <HuemulButton
            variant="outline"
            size="sm"
            icon={UserPlus}
            label={t('detail.createUserButton')}
            onClick={() => setShowCreateUser(true)}
          />
        </div>
      )}

      {!canListUsers ? null : isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <p className="text-xs text-destructive">
            {isForbidden ? t('detail.usersForbidden') : t('detail.errorLoadingUsers')}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-xs font-medium text-primary hover:cursor-pointer hover:underline"
          >
            {t('common:tryAgain')}
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t('detail.usersEmpty')}
        </div>
      ) : (
        <div className="space-y-1.5">
          {users.map((user) => (
            <OrganizationUserRow
              key={user.id}
              user={user}
              canSetAdmin={canSetAdmin}
              onMakeAdmin={setConfirmingUser}
              canRemove={canManageMembers}
              onRemove={setRemovingUser}
              disabled={setAdminMutation.isPending || removeMutation.isPending}
            />
          ))}
        </div>
      )}

      <HuemulAlertDialog
        open={!!confirmingUser}
        onOpenChange={(open) => { if (!open) setConfirmingUser(null) }}
        title={confirmingUser ? t('detail.makeAdminTitle', { name: `${confirmingUser.name} ${confirmingUser.last_name}` }) : undefined}
        description={confirmingUser ? t('detail.makeAdminDescription', { name: `${confirmingUser.name} ${confirmingUser.last_name}`, organization: organization.name }) : undefined}
        actionLabel={t('detail.makeAdmin')}
        actionVariant="default"
        onAction={async () => {
          if (!confirmingUser) return
          await setAdminMutation.mutateAsync({ organizationId: organization.id, userId: confirmingUser.id })
          setConfirmingUser(null)
        }}
      />

      <HuemulAlertDialog
        open={!!removingUser}
        onOpenChange={(open) => { if (!open) setRemovingUser(null) }}
        title={t('users:organizations.removeTitle')}
        description={removingUser ? t('users:organizations.removeDescription', { userName: `${removingUser.name} ${removingUser.last_name}`, orgName: organization.name }) : undefined}
        actionLabel={t('users:organizations.removeButton')}
        onAction={async () => {
          if (!removingUser) return
          await removeMutation.mutateAsync(removingUser.id)
          setRemovingUser(null)
        }}
      />

      {/* Sibling del contenido del tab, no anidado en ningún overlay — ver
          ia context/inline-create-entity-in-sheet-guide.md. Acá no hay
          staging (a diferencia de /roles y /users): el usuario recién creado
          se asigna de inmediato a ESTA organización, no a la activa. */}
      <CreateUserSheet
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
        canCreate={canManageMembers}
        addToOrganization={false}
        onSuccess={(user) => {
          setShowCreateUser(false)
          assignMutation.mutate(user)
          // `createUserMutation` solo invalida userQueryKeys.listBase(), que
          // no cubre la familia que lee `OrganizationUserAddPopover`.
          queryClient.invalidateQueries({ queryKey: globalUserQueryKeys.all })
        }}
      />
    </div>
  )
}
