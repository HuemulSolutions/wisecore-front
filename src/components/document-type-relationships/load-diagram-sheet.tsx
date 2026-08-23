"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Workflow } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField, type FetchOptionsParams, type FetchOptionsResult } from "@/huemul/components/huemul-field"
import { useDiagram } from "@/hooks/useDiagrams"
import { getDiagrams } from "@/services/diagrams"
import { isErrorCode } from "@/lib/error-utils"
import type { Diagram } from "@/types/diagrams"

export interface LoadDiagramSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onLoad: (diagram: Diagram) => void
}

export function LoadDiagramSheet({ open, onOpenChange, organizationId, onLoad }: LoadDiagramSheetProps) {
  const { t } = useTranslation('document-type-relationships')

  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(undefined)

  const { data: diagram, isLoading: isLoadingDiagram, error: diagramError } = useDiagram(
    organizationId,
    selectedDiagramId ?? '',
  )

  const isResolving = !!selectedDiagramId && isLoadingDiagram
  const hasError = !!selectedDiagramId && !!diagramError

  const fetchDiagramOptions = async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
    const res = await getDiagrams(organizationId, { search, page, page_size: pageSize })
    return {
      options: res.data.map((d) => ({ value: d.id, label: d.name })),
      hasMore: res.has_next ?? false,
    }
  }

  const reset = () => {
    setSelectedDiagramId(null)
    setSelectedLabel(undefined)
  }

  const handleLoad = () =>
    new Promise<void>((resolve, reject) => {
      if (!diagram) {
        reject(new Error('Diagram not ready'))
        return
      }
      onLoad(diagram)
      reset()
      resolve()
    })

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}
      title={t('loadDiagramSheet.title')}
      icon={Workflow}
      saveAction={{
        label: t('loadDiagramSheet.load'),
        onClick: handleLoad,
        loading: isResolving,
        disabled: !selectedDiagramId || isResolving || hasError,
      }}
    >
      <div className="space-y-4">
        <HuemulField
          type="async-combobox"
          label={t('loadDiagramSheet.diagramLabel')}
          placeholder={t('loadDiagramSheet.diagramPlaceholder')}
          value={selectedDiagramId ?? undefined}
          selectedLabel={selectedLabel}
          onChange={(v) => setSelectedDiagramId(String(v))}
          onSelectedLabelChange={setSelectedLabel}
          fetchOptions={fetchDiagramOptions}
          pageSize={50}
        />
        {hasError && (
          <p className="text-sm text-destructive">
            {isErrorCode(diagramError, 'DIAGRAM_NOT_FOUND')
              ? t('loadDiagramSheet.notFound')
              : t('loadDiagramSheet.loadingError')}
          </p>
        )}
      </div>
    </HuemulSheet>
  )
}
