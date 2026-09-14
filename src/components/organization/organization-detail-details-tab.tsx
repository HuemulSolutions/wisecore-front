"use client"

import { useTranslation } from "react-i18next"
import { HuemulField } from "@/huemul/components/huemul-field"
import { formatDate } from "@/lib/utils"
import type { Organization, OrganizationDetailsFormApi } from "@/types/organizations"

export interface OrganizationDetailDetailsTabProps {
  organization: Organization
  form: OrganizationDetailsFormApi
  /** Root-admin-only (`/global-admin`): agrega los 2 campos de límites de sistema. */
  canManageSystemLimits?: boolean
}

/**
 * Tab "Detalles": nombre/descripción editables inline (reemplaza a
 * `EditOrganizationDialog`) + metadata read-only. Los límites de sistema
 * (`max_users`/`token_limit`) solo se muestran con `canManageSystemLimits`
 * (root-admin, `/global-admin`) — `/organizations` no los expone. La acción
 * Eliminar vive en el footer del panel (ver `OrganizationDetailPanel`), no
 * acá — ia context/list-detail-panel-guide.md.
 */
export function OrganizationDetailDetailsTab({ organization, form, canManageSystemLimits = false }: OrganizationDetailDetailsTabProps) {
  const { t } = useTranslation(['organizations', 'common'])

  return (
    <div className="flex flex-col gap-4 p-4">
      <HuemulField
        type="text"
        label={t('form.name')}
        name="name"
        placeholder={t('form.namePlaceholder')}
        value={form.name}
        onChange={(v) => form.setName(String(v))}
        required
        disabled={form.isSaving}
      />
      <HuemulField
        type="textarea"
        label={t('form.description')}
        name="description"
        placeholder={t('form.descriptionPlaceholder')}
        value={form.description}
        onChange={(v) => form.setDescription(String(v))}
        disabled={form.isSaving}
        rows={3}
      />

      {canManageSystemLimits && (
        <>
          <HuemulField
            type="number"
            label={t('form.maxUsers')}
            name="max_users"
            placeholder={t('form.maxUsersPlaceholder')}
            value={form.maxUsers ?? ''}
            onChange={(v) => form.setMaxUsers(v !== '' ? parseInt(String(v)) : null)}
            min={1}
            disabled={form.isSaving}
            description={t('form.maxUsersDescription')}
          />
          <HuemulField
            type="number"
            label={t('form.tokenLimit')}
            name="token_limit"
            placeholder={t('form.tokenLimitPlaceholder')}
            value={form.tokenLimit ?? ''}
            onChange={(v) => form.setTokenLimit(v !== '' ? parseInt(String(v)) : null)}
            min={1}
            disabled={form.isSaving}
            description={t('form.tokenLimitDescription')}
          />
        </>
      )}

      <div className="rounded-lg border border-border p-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase">
          {t('detail.organizationId')}
        </p>
        <p className="mt-1 text-[13px] font-medium text-foreground">{organization.id}</p>
        {organization.created_at && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {t('detail.createdOn', { date: formatDate(new Date(organization.created_at)) })}
          </p>
        )}
      </div>
    </div>
  )
}
