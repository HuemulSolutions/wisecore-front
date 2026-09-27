"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FileJson } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { importDocumentsConfig } from "@/services/assets"
import type { ImportDocumentsConfigData } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
import type { ImportConfigSheetProps } from "@/types/assets"
export type { ImportConfigSheetProps } from "@/types/assets"

export function ImportConfigSheet({ open, onOpenChange, onImported }: ImportConfigSheetProps) {
  const { selectedOrganizationId } = useOrganization()
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')

  const [file, setFile] = useState<File | null>(null)
  const [onConflict, setOnConflict] = useState<'skip' | 'overwrite'>('skip')
  const [result, setResult] = useState<ImportDocumentsConfigData | null>(null)

  React.useEffect(() => {
    if (open) {
      setFile(null)
      setOnConflict('skip')
      setResult(null)
    }
  }, [open])

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrganizationId) throw new Error("Organization ID not found")
      if (!file) throw new Error("No file selected")
      return importDocumentsConfig(selectedOrganizationId, file, { on_conflict: onConflict })
    },
    meta: { showSuccessToast: false },
    onError: (error) => {
      handleApiError(error, { fallbackMessage: t('importConfig.errorFailed') })
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success(t('importConfig.success', { count: data.imported }))
      onImported?.()
    },
  })

  const handleImport = () => {
    if (!selectedOrganizationId) {
      toast.error(t('create.errorOrganizationRequired'))
      return
    }
    if (!file) {
      toast.error(t('importConfig.errorFileRequired'))
      return
    }
    importMutation.mutate()
  }

  const handleImportAnother = () => {
    setFile(null)
    setResult(null)
  }

  const isValid = !!file && !!selectedOrganizationId

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('importConfig.title')}
      description={t('importConfig.description')}
      icon={FileJson}
      side="right"
      maxWidth="sm:max-w-xl"
      cancelLabel={result ? tCommon('close') : tCommon('cancel')}
      saveAction={
        result
          ? {
              label: t('importConfig.importAnother'),
              onClick: handleImportAnother,
              variant: 'secondary',
              closeOnSuccess: false,
            }
          : {
              label: t('importConfig.submitLabel'),
              onClick: handleImport,
              loading: importMutation.isPending,
              disabled: !isValid,
              closeOnSuccess: false,
            }
      }
    >
      {result ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{t('importConfig.resultImported')}</p>
              <p className="text-lg font-semibold">{result.imported}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{t('importConfig.resultSkipped')}</p>
              <p className="text-lg font-semibold">{result.skipped}</p>
            </div>
          </div>
          {result.warnings.length > 0 && (
            <div className="grid gap-1">
              <p className="text-sm font-medium">{t('importConfig.resultWarnings')}</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="grid gap-1">
              <p className="text-sm font-medium text-destructive">{t('importConfig.resultErrors')}</p>
              <ul className="list-disc pl-5 text-sm text-destructive">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          <HuemulField
            type="file"
            label={t('importConfig.fileLabel')}
            name="file"
            required
            accept=".json"
            onFileChange={(files) => setFile(files?.[0] ?? null)}
            description={t('importConfig.fileDescription')}
          />

          <HuemulField
            type="select"
            label={t('importConfig.onConflictLabel')}
            name="onConflict"
            value={onConflict}
            onChange={(v) => setOnConflict(v as 'skip' | 'overwrite')}
            options={[
              { label: t('importConfig.onConflictSkip'), value: 'skip' },
              { label: t('importConfig.onConflictOverwrite'), value: 'overwrite' },
            ]}
            description={t('importConfig.onConflictDescription')}
          />
        </div>
      )}
    </HuemulSheet>
  )
}
