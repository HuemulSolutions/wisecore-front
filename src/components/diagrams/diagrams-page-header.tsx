"use client"

import { Workflow } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { useTranslation } from "react-i18next"
import type { ReactNode } from "react"

export interface DiagramsPageHeaderProps {
  diagramCount: number
  isLoading?: boolean
  onRefresh?: () => void
  children?: ReactNode
}

export function DiagramsPageHeader({ diagramCount, isLoading = false, onRefresh, children }: DiagramsPageHeaderProps) {
  const { t } = useTranslation('diagrams')

  return (
    <PageHeader
      icon={Workflow}
      title={t('header.title')}
      badges={[{ label: "", value: isLoading ? "..." : diagramCount }]}
      onRefresh={onRefresh}
      isLoading={isLoading}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {children}
      </div>
    </PageHeader>
  )
}
