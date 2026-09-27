"use client"

import { Plus, Settings2 } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { useTranslation } from "react-i18next"
import type { CustomFieldPageHeaderProps } from '@/types/custom-fields'

export type { CustomFieldPageHeaderProps } from '@/types/custom-fields'

export function CustomFieldPageHeader({
  customFieldCount,
  onCreateCustomField,
  onRefresh,
  isLoading = false,
  hasError = false,
  searchTerm,
  onSearchChange,
  canCreate = false
}: CustomFieldPageHeaderProps) {
  const { t } = useTranslation('custom-fields')

  return (
    <PageHeader
      icon={Settings2}
      title={t('header.title')}
      badges={[
        { label: "", value: t('header.customFieldsCount', { count: customFieldCount }) }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={canCreate ? {
        label: t('header.createCustomField'),
        icon: Plus,
        onClick: onCreateCustomField,
        disabled: hasError
      } : undefined}
      searchConfig={{
        placeholder: t('header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange,
        triggerOnEnter: true
      }}
    />
  )
}