"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulRolePickerDialog } from "@/huemul/components/huemul-role-picker"
import { rbacQueryKeys } from "@/hooks/useRbac"
import { assignRolesToUser } from "@/services/rbac"
import { userQueryKeys } from "@/hooks/useUsers"
import type { User } from "@/types/users"

export interface UsersBulkActionsBarProps {
  selectedUsers: User[]
  onClear: () => void
  canAssignRoles: boolean
  canListRoles: boolean
  /** Deshabilitada mientras el panel de detalle tiene staging pendiente (ver
   *  ia context/sheet-footer-batch-save-guide.md regla 7 — un solo camino de
   *  escritura a la vez). */
  disabled?: boolean
}

type BulkMode = "add" | "remove"

/**
 * Reemplaza a `roles-assign-sheet.tsx` (eliminado) en su rol de acción
 * masiva. Sin staging propio: no existe endpoint bulk multi-usuario para
 * roles, así que se resuelve con N llamadas `assignRolesToUser` en paralelo,
 * cada una con la lista final propia del usuario (unión/diferencia con el rol
 * elegido) — ver plan de implementación §6.
 */
export function UsersBulkActionsBar({
  selectedUsers,
  onClear,
  canAssignRoles,
  canListRoles,
  disabled,
}: UsersBulkActionsBarProps) {
  const { t } = useTranslation(["users", "common"])
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const [pickerMode, setPickerMode] = useState<BulkMode | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const runBulk = async (roleId: string) => {
    const mode = pickerMode
    if (!mode) return
    setIsApplying(true)
    const results = await Promise.allSettled(
      selectedUsers.map((user) => {
        const currentIds = user.roles.map((r) => r.id)
        const nextIds = mode === "add"
          ? Array.from(new Set([...currentIds, roleId]))
          : currentIds.filter((id) => id !== roleId)
        return assignRolesToUser(user.id, { role_ids: nextIds })
      }),
    )
    const ok = results.filter((r) => r.status === "fulfilled").length
    // Invalida el prefijo entero de rbac (no solo `roles`/`userAllRoles` de un
    // usuario puntual): si el panel de detalle está abierto sobre uno de los
    // usuarios del lote, su staging debe reflejar el cambio recién aplicado.
    queryClient.invalidateQueries({ queryKey: rbacQueryKeys.all })
    queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
    setIsApplying(false)
    setPickerMode(null)
    if (ok === selectedUsers.length) {
      toast.success(t("bulk.applied", { ok, total: selectedUsers.length }))
    } else {
      toast.error(t("bulk.appliedPartial", { ok, total: selectedUsers.length }))
    }
  }

  const canBulkAssign = canAssignRoles && canListRoles && !!selectedOrganizationId

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#dbe7fe] bg-[#eef4ff] px-3 py-2">
      <span className="text-[12px] font-medium text-foreground">
        {t("bulk.selected", { count: selectedUsers.length })}
      </span>
      <div className="flex items-center gap-2">
        {canBulkAssign && (
          <>
            <HuemulButton
              variant="outline"
              size="sm"
              label={t("bulk.addRole")}
              disabled={disabled || isApplying}
              loading={isApplying && pickerMode === "add"}
              onClick={() => setPickerMode("add")}
            />
            <HuemulButton
              variant="outline"
              size="sm"
              label={t("bulk.removeRole")}
              disabled={disabled || isApplying}
              loading={isApplying && pickerMode === "remove"}
              onClick={() => setPickerMode("remove")}
            />
          </>
        )}
        <HuemulButton
          variant="ghost"
          size="sm"
          icon={X}
          label={t("bulk.clear")}
          onClick={onClear}
        />
      </div>

      <HuemulRolePickerDialog
        open={pickerMode != null}
        onOpenChange={(open) => !open && setPickerMode(null)}
        onSelect={(id) => void runBulk(id)}
      />
    </div>
  )
}
