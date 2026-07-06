"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, FileText } from "lucide-react"
import type { CustomFieldTemplateEmptyStateProps } from '@/types/templates';
export type { CustomFieldTemplateEmptyStateProps } from '@/types/templates';

export function CustomFieldTemplateEmptyState({
  onAddCustomFieldTemplate,
}: CustomFieldTemplateEmptyStateProps) {
  const { t } = useTranslation('templates')
  return (
    <Card className="border border-dashed border-border/50 bg-card">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        
        <h3 className="mt-5 text-lg font-semibold text-foreground">
          {t('customFields.emptyTitle')}
        </h3>
        
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {t('customFields.emptyDescription')}
        </p>
        
        <Button
          onClick={onAddCustomFieldTemplate}
          className="mt-7 hover:cursor-pointer h-9 px-4"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('customFields.addCustomField')}
        </Button>
      </div>
    </Card>
  )
}