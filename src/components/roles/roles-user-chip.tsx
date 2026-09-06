import { RotateCcw, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HuemulButton } from "@/huemul/components/huemul-button"
import type { StagedRoleUser, StagedRoleUserStatus } from "@/types/roles/users-staging"

export interface RolesUserChipProps {
  user: StagedRoleUser
  onToggle: (userId: string) => void
  disabled?: boolean
}

// Espejo de STATUS_CONTAINER_CLASS en users-role-chip.tsx.
const STATUS_CONTAINER_CLASS: Record<StagedRoleUserStatus, string> = {
  assigned: "bg-white border-[#e6ebf2]",
  added: "bg-[#f3fbf5] border-[#cdefd7]",
  created: "bg-[#f3fbf5] border-[#cdefd7] border-dashed",
  removed: "bg-[#fef4f4] border-[#fbd5d5]",
}

function getInitials(user: StagedRoleUser) {
  return `${user.name?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
}

/** Fila de usuario dentro del staging del panel de detalle de rol — espejo de `UserRoleChip`. */
export function RolesUserChip({ user, onToggle, disabled }: RolesUserChipProps) {
  const { t } = useTranslation("roles")
  const isRemoved = user.status === "removed"

  const statusLabel =
    user.status === "added" ? t("detail.status.added")
    : user.status === "created" ? t("detail.status.created")
    : user.status === "removed" ? t("detail.status.removed")
    : null

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        STATUS_CONTAINER_CLASS[user.status],
      )}
    >
      <Avatar size="sm">
        {user.photoUrl && <AvatarImage src={user.photoUrl} alt={user.name} />}
        <AvatarFallback className="bg-[#475569] text-[10px] font-semibold text-white">{getInitials(user)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "truncate text-[13px] font-medium text-foreground",
              isRemoved && "text-muted-foreground line-through",
            )}
          >
            {user.name} {user.lastName}
          </span>
          {statusLabel && (
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0 text-[10px] font-medium",
                user.status === "removed" ? "text-[#b91c1c]" : "text-[#15803d]",
              )}
            >
              {statusLabel}
            </span>
          )}
        </div>
        {!isRemoved && (
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        )}
      </div>
      <HuemulButton
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        icon={isRemoved ? RotateCcw : X}
        tooltip={isRemoved ? t("detail.undoRemove") : t("detail.removeUser")}
        onClick={() => onToggle(user.id)}
        disabled={disabled}
      />
    </div>
  )
}
