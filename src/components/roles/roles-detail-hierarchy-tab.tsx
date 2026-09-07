"use client"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Shield } from "lucide-react"
import type { Role } from "@/types/rbac"

export interface RolesDetailHierarchyTabProps {
  role: Role
  /** Catálogo completo de roles (`useRolesMap`), para resolver padre e hijos. */
  rolesById: Record<string, Role>
}

/** Tab "Jerarquía": rol padre + hijos directos. Solo lectura en esta entrega. */
export function RolesDetailHierarchyTab({ role, rolesById }: RolesDetailHierarchyTabProps) {
  const { t } = useTranslation("roles")

  const parentName = role.parent_role_id ? rolesById[role.parent_role_id]?.name : null
  const children = useMemo(
    () => Object.values(rolesById).filter((r) => r.parent_role_id === role.id),
    [rolesById, role.id],
  )

  if (!role.is_position) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t("detail.notAPosition")}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">{t("detail.reportsToLabel")}</p>
        <p className="text-[13px] font-medium text-foreground">
          {parentName ?? t("detail.noParent")}
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
          {t("detail.hierarchyChildren", { count: children.length })}
        </p>
        {children.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("detail.noChildren")}</p>
        ) : (
          <div className="space-y-1">
            {children.map((child) => (
              <div key={child.id} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-[13px]">
                <Shield className="size-3 text-muted-foreground" />
                {child.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
