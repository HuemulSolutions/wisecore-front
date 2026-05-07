import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Upload, X } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { getAllTemplates } from "@/services/templates"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { HuemulFieldOption } from "@/huemul/components/huemul-field"
import { Button } from "@/components/ui/button"

interface StepHeaderProps {
  step: number
  label: string
}

function StepHeader({ step, label }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
        {step}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  )
}

export interface WordExportConfig {
  templateId: string
  file: File | null
}

interface WordExportFormProps {
  onTemplateChange?: (templateId: string) => void
  onConfigChange?: (config: WordExportConfig) => void
}

export function WordExportForm({ onTemplateChange, onConfigChange }: WordExportFormProps) {
  const { t } = useTranslation("advanced")
  const { selectedOrganizationId } = useOrganization()

  const [templateId, setTemplateId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", selectedOrganizationId],
    queryFn: () => getAllTemplates(selectedOrganizationId!),
    enabled: !!selectedOrganizationId,
  })

  const templateOptions: HuemulFieldOption[] = (templatesData?.data ?? []).map((tmpl) => ({
    label: tmpl.name,
    value: tmpl.id,
  }))

  // Emit config changes
  useEffect(() => {
    onConfigChange?.({ templateId, file })
  }, [templateId, file, onConfigChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    // reset so the same file can be re-selected if removed
    e.target.value = ""
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Step 1: Template */}
      <div>
        <StepHeader step={1} label={t("massExecution.steps.template")} />
        <HuemulField
          type="combobox"
          label=""
          name="word-template"
          value={templateId}
          onChange={(v) => {
            const val = String(v)
            setTemplateId(val)
            onTemplateChange?.(val)
          }}
          options={templateOptions}
          placeholder={
            isLoadingTemplates
              ? t("massExecution.loadingTemplates")
              : t("massExecution.selectTemplate")
          }
          disabled={isLoadingTemplates}
        />
      </div>

      {/* Step 2: DOCX template file (optional) */}
      <div>
        <StepHeader step={2} label={t("wordExport.steps.docxTemplate")} />
        <p className="text-xs text-muted-foreground mb-3">{t("wordExport.docxTemplateHint")}</p>

        {file ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={removeFile}
              className="text-muted-foreground hover:text-foreground hover:cursor-pointer shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full hover:cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4 mr-2" />
            {t("wordExport.uploadDocxTemplate")}
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
