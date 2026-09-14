"use client"

import { Crown, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HuemulButton } from "@/huemul/components/huemul-button"
import type { OrganizationUser } from "@/types/organizations"

export interface OrganizationUserRowProps {
  user: OrganizationUser
  canSetAdmin: boolean
  onMakeAdmin: (user: OrganizationUser) => void
  /** Root-admin-only: agrega el botón "Quitar" (membership, no "Hacer admin"). */
  canRemove?: boolean
  onRemove?: (user: OrganizationUser) => void
  disabled?: boolean
}

function getInitials(user: OrganizationUser) {
  return `${user.name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
}

/** Fila de usuario del tab "Usuarios" del panel de organización. */
export function OrganizationUserRow({ user, canSetAdmin, onMakeAdmin, canRemove = false, onRemove, disabled }: OrganizationUserRowProps) {
  const { t } = useTranslation(['organizations', 'users', 'common'])

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
      <Avatar size="sm">
        <AvatarFallback className="bg-[#475569] text-[10px] font-semibold text-white">
          {getInitials(user)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-foreground">
            {user.name} {user.last_name}
          </span>
          {user.is_org_admin && (
            <Badge variant="secondary" className="h-5 shrink-0 gap-1 px-1.5 text-[10px]">
              <Crown className="size-3 text-amber-500" />
              {t('setAdmin.adminBadge')}
            </Badge>
          )}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
      </div>
      {canSetAdmin && !user.is_org_admin && (
        <HuemulButton
          variant="outline"
          size="sm"
          className="shrink-0"
          label={t('detail.makeAdmin')}
          onClick={() => onMakeAdmin(user)}
          disabled={disabled}
        />
      )}
      {canRemove && onRemove && (
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          icon={Trash2}
          tooltip={t('users:organizations.removeTooltip')}
          onClick={() => onRemove(user)}
          disabled={disabled}
        />
      )}
    </div>
  )
}
