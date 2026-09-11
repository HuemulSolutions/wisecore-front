"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Building2, Plus, Trash2 } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { assignUserToOrganization, removeUserFromOrganization } from "@/services/users"
import { useUserOrganizations, userQueryKeys } from "@/hooks/useUsers"
import { useSetOrganizationAdmin, useOrganizationMutations } from "@/hooks/useOrganizations"
import { UserOrganizationAddPopover } from "./user-organization-add-popover"
import { CreateOrganizationDialog } from "@/components/organization"
import type { User, UserOrganization } from "@/types/users"
import type { Organization } from "@/types/organizations"

export interface UsersDetailOrganizationsTabProps {
  user: User
  /**
   * Root-admin-only en ambos consumidores (`/users` y `/global-admin`): agrega
   * "Agregar organización", "Quitar" y "Hacer admin" por fila. Sin este
   * permiso el tab queda de solo lectura.
   */
  canManageMembers: boolean
}

/**
 * Tab "Organizaciones" del panel de usuario — reemplaza a
 * `UserOrganizationsDialog`. Lista las organizaciones de las que el usuario
 * es miembro (`GET /users/organizations?user_id=`, que no expone si ya es
 * admin de cada una — "Hacer admin" se ofrece igual, sin badge de estado).
 */
export function UsersDetailOrganizationsTab({ user, canManageMembers }: UsersDetailOrganizationsTabProps) {
  const { t } = useTranslation(["users", "organizations", "common"])
  const queryClient = useQueryClient()
  const [removingOrg, setRemovingOrg] = useState<UserOrganization | null>(null)
  const [showCreateOrg, setShowCreateOrg] = useState(false)

  const { data, isLoading, error, refetch } = useUserOrganizations(user.id)
  const memberOrganizations = (data?.data ?? []).filter((org) => org.member)

  const invalidateMemberships = () => {
    queryClient.invalidateQueries({ queryKey: userQueryKeys.organizations(user.id) })
  }

  const assignMutation = useMutation({
    mutationFn: (organizationId: string) => assignUserToOrganization(organizationId, { user_id: user.id }),
    meta: { successMessage: t('users:organizations.assignedSuccess') },
    onSuccess: invalidateMemberships,
  })

  const removeMutation = useMutation({
    mutationFn: (organizationId: string) => removeUserFromOrganization(organizationId, user.id),
    meta: { successMessage: t('users:organizations.removedSuccess') },
    onSuccess: invalidateMemberships,
  })

  const setAdminMutation = useSetOrganizationAdmin()
  const { createOrganization } = useOrganizationMutations()

  const memberOrgIds = new Set(memberOrganizations.map((org) => org.id))

  return (
    <div className="flex flex-col gap-4 p-4">
      {canManageMembers && (
        <div className="flex gap-2">
          <div className="flex-1">
            <UserOrganizationAddPopover
              excludeOrganizationIds={memberOrgIds}
              onOrganizationAdded={(org: Organization) => assignMutation.mutate(org.id)}
              disabled={assignMutation.isPending}
            />
          </div>
          <HuemulButton
            variant="outline"
            size="sm"
            icon={Plus}
            label={t('users:detail.createOrganizationButton')}
            onClick={() => setShowCreateOrg(true)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <p className="text-xs text-destructive">{t('users:organizations.failedToLoad', { error: error.message })}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-xs font-medium text-primary hover:cursor-pointer hover:underline"
          >
            {t('common:tryAgain')}
          </button>
        </div>
      ) : memberOrganizations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t('users:organizations.noOrganizations')}
        </div>
      ) : (
        <div className="space-y-1.5">
          {memberOrganizations.map((org) => (
            <div key={org.id} className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Building2 className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{org.name}</p>
                {org.description && (
                  <p className="truncate text-[11px] text-muted-foreground">{org.description}</p>
                )}
              </div>
              {canManageMembers && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <HuemulButton
                    variant="outline"
                    size="sm"
                    label={t('organizations:detail.makeAdmin')}
                    onClick={() => setAdminMutation.mutate({ organizationId: org.id, userId: user.id })}
                    disabled={setAdminMutation.isPending}
                  />
                  <HuemulButton
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    icon={Trash2}
                    tooltip={t('users:organizations.removeTooltip')}
                    onClick={() => setRemovingOrg(org)}
                    disabled={removeMutation.isPending}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <HuemulAlertDialog
        open={!!removingOrg}
        onOpenChange={(open) => { if (!open) setRemovingOrg(null) }}
        title={t('users:organizations.removeTitle')}
        description={removingOrg ? t('users:organizations.removeDescription', { userName: `${user.name} ${user.last_name}`, orgName: removingOrg.name }) : undefined}
        actionLabel={t('users:organizations.removeButton')}
        onAction={async () => {
          if (!removingOrg) return
          await removeMutation.mutateAsync(removingOrg.id)
          setRemovingOrg(null)
        }}
      />

      {/* Sibling del contenido del tab, no anidado en ningún overlay — ver
          ia context/inline-create-entity-in-sheet-guide.md. Diálogo
          totalmente controlado (sin mutation propia): la organización creada
          llega por el onSuccess de `createOrganization`, no por el diálogo. */}
      <CreateOrganizationDialog
        open={showCreateOrg}
        onOpenChange={setShowCreateOrg}
        isPending={createOrganization.isPending}
        canCreate={canManageMembers}
        onSubmit={(orgData) => createOrganization.mutate(orgData, {
          onSuccess: (organization) => {
            setShowCreateOrg(false)
            assignMutation.mutate(organization.id)
          },
        })}
      />
    </div>
  )
}
