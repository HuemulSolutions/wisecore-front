"use client"

import { LayoutPanelTop, Plus } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { useTranslation } from "react-i18next"
import type { CanvasPageHeaderProps } from '@/types/canvas'
export type { CanvasPageHeaderProps } from '@/types/canvas'

export function CanvasPageHeader({
  canvasCount,
  onCreateCanvas,
  onRefresh,
  isLoading = false,
  searchTerm,
  onSearchChange,
  canManage = false,
}: CanvasPageHeaderProps) {
  const { t } = useTranslation('canvas')

  return (
    <PageHeader
      icon={LayoutPanelTop}
      title={t('header.title')}
      badges={[{ label: "", value: isLoading ? "..." : canvasCount }]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      primaryAction={canManage ? {
        label: t('header.createCanvas'),
        icon: Plus,
        onClick: onCreateCanvas,
      } : undefined}
      searchConfig={{
        placeholder: t('header.searchPlaceholder'),
        value: searchTerm ?? '',
        onChange: onSearchChange,
        triggerOnEnter: true,
      }}
    />
  )
}
