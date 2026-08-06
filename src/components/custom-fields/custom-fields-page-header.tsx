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
  searchTerm,
  onSearchChange,
  canManage = false
}: CustomFieldPageHeaderProps) {
  const { t } = useTranslation('custom-fields')

  return (
    <PageHeader
      icon={Settings2}
      title={t('header.title')}
      badges={[
        { label: "", value: customFieldCount }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      primaryAction={canManage ? {
        label: t('header.createCustomField'),
        icon: Plus,
        onClick: onCreateCustomField
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