import { RotateCcw, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { roleRowSwatch } from "@/lib/reference-colors"
import { HuemulButton } from "@/huemul/components/huemul-button"
import type { StagedRole, StagedRoleStatus } from "@/types/users/roles-staging"

export interface UserRoleChipProps {
  role: StagedRole
  onToggle: (roleId: string) => void
  disabled?: boolean
}

// Los 4 estados visuales del staging — ver ia context/sheet-footer-batch-save-guide.md
// y src/types/users/roles-staging.ts.
const STATUS_CONTAINER_CLASS: Record<StagedRoleStatus, string> = {
  assigned: "bg-white border-[#e6ebf2]",
  added: "bg-[#f3fbf5] border-[#cdefd7]",
  created: "bg-[#f3fbf5] border-[#cdefd7] border-dashed",
  removed: "bg-[#fef4f4] border-[#fbd5d5]",
}

/**
 * Fila de rol dentro del staging del panel de detalle de usuario. El punto de
 * color y el markup base replican `role-reference-node.tsx:37,47` (mismo
 * `roleRowSwatch`).
 */
export function UserRoleChip({ role, onToggle, disabled }: UserRoleChipProps) {
  const { t } = useTranslation("users")
  const swatch = roleRowSwatch(role.color)
  const isRemoved = role.status === "removed"

  const statusLabel =
    role.status === "added" ? t("detail.status.added")
    : role.status === "created" ? t("detail.status.created")
    : role.status === "removed" ? t("detail.status.removed")
    : null

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        STATUS_CONTAINER_CLASS[role.status],
      )}
    >
      <span className="size-1.75 shrink-0 rounded-full" style={{ backgroundColor: swatch.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "truncate text-[13px] font-medium text-foreground",
              isRemoved && "text-muted-foreground line-through",
            )}
          >
            {role.name}
          </span>
          {role.isPosition && (
            <span className="shrink-0 rounded-full border border-border bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
              {t("detail.positionBadge")}
            </span>
          )}
          {statusLabel && (
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0 text-[10px] font-medium",
                role.status === "removed" ? "text-[#b91c1c]" : "text-[#15803d]",
              )}
            >
              {statusLabel}
            </span>
          )}
        </div>
        {role.description && !isRemoved && (
          <p className="truncate text-[11px] text-muted-foreground">{role.description}</p>
        )}
      </div>
      {role.permissionNum != null && !isRemoved && (
        <span className="shrink-0 rounded-full border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {t("detail.permissionCount", { count: role.permissionNum })}
        </span>
      )}
      <HuemulButton
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        icon={isRemoved ? RotateCcw : X}
        tooltip={isRemoved ? t("detail.undoRemove") : t("detail.removeRole")}
        onClick={() => onToggle(role.id)}
        disabled={disabled}
      />
    </div>
  )
}
