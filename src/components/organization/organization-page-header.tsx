"use client"

import { Plus, Building2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import type { OrganizationPageHeaderProps } from "@/types/organizations"
export type { OrganizationPageHeaderProps } from "@/types/organizations"

export function OrganizationPageHeader({
  organizationCount,
  onCreateOrganization,
  onRefresh,
  isLoading = false,
  searchTerm,
  onSearchChange,
  canManage = false
}: OrganizationPageHeaderProps) {
  const { t } = useTranslation(['organizations'])

  return (
    <PageHeader
      icon={Building2}
      title={t('organizations:header.title')}
      badges={[
        { label: "", value: organizationCount }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      primaryAction={canManage ? {
        label: t('organizations:header.createOrganization'),
        icon: Plus,
        onClick: onCreateOrganization
      } : undefined}
      searchConfig={{
        placeholder: t('organizations:header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange,
        triggerOnEnter: true,
      }}
    />
  )
}
