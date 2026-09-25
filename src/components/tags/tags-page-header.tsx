"use client"

import { Tag as TagIcon, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import type { TagsPageHeaderProps } from '@/types/tags'

export type { TagsPageHeaderProps } from '@/types/tags'

export function TagsPageHeader({
  searchTerm,
  onSearchChange,
  tagsCount,
  isLoading,
  onRefresh,
  onCreateClick,
  hasError,
  canCreate = false,
}: TagsPageHeaderProps) {
  const { t } = useTranslation('tags')

  return (
    <PageHeader
      icon={TagIcon}
      title={t('header.title')}
      badges={[
        { label: "", value: t('header.tagsCount', { count: tagsCount }) }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={canCreate ? {
        label: t('header.addTag'),
        icon: Plus,
        onClick: onCreateClick,
        disabled: hasError,
      } : undefined}
      searchConfig={{
        placeholder: t('header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange,
        triggerOnEnter: true,
      }}
    />
  )
}
