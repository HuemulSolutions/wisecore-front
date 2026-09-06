"use client"

import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"
import RoleFormFields from "./roles-form-fields"
import type { RoleDetailsFormApi } from "@/types/roles/details-form"

export interface RolesDetailDetailsTabProps {
  form: RoleDetailsFormApi
  permissionsSummary: { assigned: number; total: number }
  onGoToPermissions: () => void
}

/**
 * Tab "Detalles": nombre/descripción/jerarquía (reemplaza esa mitad de
 * `EditRoleSheet`) + resumen de permisos con atajo al tab Permisos. Las
 * acciones Clonar/Eliminar viven en el footer del panel (ver
 * `RoleDetailPanel`), no acá — ia context/list-detail-panel-guide.md.
 */
export function RolesDetailDetailsTab({
  form,
  permissionsSummary,
  onGoToPermissions,
}: RolesDetailDetailsTabProps) {
  const { t } = useTranslation(["roles", "common"])

  return (
    <div className="flex flex-col gap-4 p-4">
      <RoleFormFields
        name={form.name}
        description={form.description}
        onNameChange={form.setName}
        onDescriptionChange={form.setDescription}
        includeTextarea
        isPosition={form.isPosition}
        onIsPositionChange={form.setIsPosition}
        parentRoleId={form.parentRoleId}
        onParentRoleIdChange={form.setParentRoleId}
        positionRoleOptions={form.positionRoleOptions}
      />

      <div className="rounded-lg border border-border p-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase">
          {t("detail.permissionsSectionTitle")}
        </p>
        <p className="mt-1 text-[13px] font-medium text-foreground">
          {t("detail.permissionsSummary", permissionsSummary)}
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {t("detail.permissionsSectionHint")}
        </p>
        <HuemulButton
          variant="outline"
          size="sm"
          className="mt-2"
          label={t("detail.goToPermissions")}
          onClick={onGoToPermissions}
        />
      </div>
    </div>
  )
}
