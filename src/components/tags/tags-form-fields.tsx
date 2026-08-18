"use client"

import { useTranslation } from "react-i18next"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import type { TagFormFieldsProps } from '@/types/tags'

export type { TagFormFieldsProps } from '@/types/tags'

const FALLBACK_DOT_COLOR = "#94a3b8"

export function TagFormFields({ formData, onChange, errors = {}, disabled = false }: TagFormFieldsProps) {
  const { t } = useTranslation(['tags', 'common'])

  const previewColor = formData.color || FALLBACK_DOT_COLOR
  const previewName = formData.name.trim() || t('form.previewPlaceholder')

  return (
    <HuemulFieldGroup className="py-2">
      <HuemulField
        label={t('common:name')}
        name="name"
        value={formData.name}
        onChange={(value) => onChange("name", value as string)}
        placeholder={t('form.namePlaceholder')}
        error={errors.name}
        disabled={disabled}
        required
      />
      <HuemulField
        type="color-swatches"
        label={t('form.colorLabel')}
        name="color"
        value={formData.color ?? ""}
        onChange={(value) => onChange("color", (value as string) || null)}
        description={t('form.colorHint')}
        disabled={disabled}
      />
      <HuemulField
        type="textarea"
        label={t('form.descriptionLabel')}
        name="description"
        value={formData.description ?? ""}
        onChange={(value) => onChange("description", (value as string) || null)}
        placeholder={t('form.descriptionPlaceholder')}
        rows={3}
        disabled={disabled}
      />

      <div className="space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('form.previewLabel')}</span>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${previewColor}1a`,
              borderColor: previewColor,
              color: previewColor,
            }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: previewColor }} />
            {previewName}
          </span>
          <span className="text-sm text-muted-foreground">{t('form.previewCaption')}</span>
        </div>
      </div>
    </HuemulFieldGroup>
  )
}
