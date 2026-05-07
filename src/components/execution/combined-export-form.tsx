import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { FileSpreadsheet, FileText, Check, ChevronsUpDown, X, type LucideIcon } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { getAllTemplates, getTemplateById } from "@/services/templates"
import { useDocxTemplatesForTemplate } from "@/hooks/useDocxTemplates"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { HuemulFieldOption } from "@/huemul/components/huemul-field"
import { WordDocxIcon } from "@/components/icons/word-docx-icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TemplateSection {
  id: string
  name: string
  order: number
}

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

export type ExportType = "excel" | "word"

export type DocxSource = "asset" | "template"

export interface CombinedExportConfig {
  type: ExportType
  templateId: string
  templateSectionIds: string[]
  docxSource: DocxSource | null
  docxTemplateId: string | null
  file: File | null
}

interface CombinedExportFormProps {
  canAccessExcelExport: boolean
  canAccessWordExport: boolean
  onTemplateChange?: (templateId: string) => void
  onConfigChange?: (config: CombinedExportConfig | null) => void
}

export function CombinedExportForm({
  canAccessExcelExport,
  canAccessWordExport,
  onTemplateChange,
  onConfigChange,
}: CombinedExportFormProps) {
  const { t } = useTranslation("advanced")
  const { selectedOrganizationId } = useOrganization()

  const showTypePicker = canAccessExcelExport && canAccessWordExport
  const defaultType: ExportType | null = showTypePicker
    ? null
    : canAccessExcelExport
    ? "excel"
    : "word"

  const [templateId, setTemplateId] = useState("")
  const [exportType, setExportType] = useState<ExportType | null>(defaultType)

  // Excel state
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Word state
  const [selectedDocxTemplateId, setSelectedDocxTemplateId] = useState<string | null>(null)

  const { data: docxTemplatesData, isLoading: isLoadingDocxTemplates } = useDocxTemplatesForTemplate(
    selectedOrganizationId ?? "",
    templateId,
    { enabled: !!templateId && !!selectedOrganizationId && exportType === "word" },
  )
  const docxTemplates = docxTemplatesData?.data ?? []

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", selectedOrganizationId],
    queryFn: () => getAllTemplates(selectedOrganizationId!),
    enabled: !!selectedOrganizationId,
  })

  const { data: templateDetail, isLoading: isLoadingSections } = useQuery({
    queryKey: ["template", templateId, selectedOrganizationId],
    queryFn: () => getTemplateById(templateId, selectedOrganizationId!),
    enabled: !!templateId && !!selectedOrganizationId && exportType === "excel",
  })

  const templateOptions: HuemulFieldOption[] = (templatesData?.data ?? []).map((tmpl) => ({
    label: tmpl.name,
    value: tmpl.id,
  }))

  const sections: TemplateSection[] = useMemo(
    () =>
      [...((templateDetail?.sections ?? []) as TemplateSection[])].sort(
        (a, b) => a.order - b.order
      ),
    [templateDetail]
  )

  const filtered = useMemo(() => {
    if (!search) return sections
    const lower = search.toLowerCase()
    return sections.filter((s) => s.name.toLowerCase().includes(lower))
  }, [sections, search])

  // Reset excel state when template changes
  useEffect(() => {
    setSelectedSectionIds(new Set())
    setSearch("")
  }, [templateId])

  // Reset type-specific state when export type changes
  useEffect(() => {
    setSelectedSectionIds(new Set())
    setSearch("")
    setSelectedDocxTemplateId(null)
  }, [exportType])

  // Reset docx template selection when template changes
  useEffect(() => {
    setSelectedDocxTemplateId(null)
  }, [templateId])

  // Emit config changes
  useEffect(() => {
    if (!exportType || !templateId) {
      onConfigChange?.(null)
      return
    }
    onConfigChange?.({
      type: exportType,
      templateId,
      templateSectionIds: Array.from(selectedSectionIds),
      docxSource: "template",
      docxTemplateId: selectedDocxTemplateId,
      file: null,
    })
  }, [exportType, templateId, selectedSectionIds, selectedDocxTemplateId, onConfigChange])

  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const removeSection = (sectionId: string) => {
    setSelectedSectionIds((prev) => {
      const next = new Set(prev)
      next.delete(sectionId)
      return next
    })
  }

  const selectedSections = sections.filter((s) => selectedSectionIds.has(s.id))

  // Step numbering
  let currentStep = 1
  const templateStep = currentStep++
  const typeStep = showTypePicker ? currentStep++ : null
  const exportSpecificStep = currentStep

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Step 1: Template */}
      <div>
        <StepHeader step={templateStep} label={t("massExecution.steps.template")} />
        <HuemulField
          type="combobox"
          label=""
          name="export-template"
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

      {/* Step 2: Export type (only if both are accessible) */}
      {showTypePicker && (
        <div>
          <StepHeader step={typeStep!} label={t("excelExport.steps.exportType")} />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setExportType("excel")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:cursor-pointer",
                exportType === "excel"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              )}
            >
              <FileSpreadsheet
                className={cn(
                  "h-5 w-5 shrink-0",
                  exportType === "excel" ? "text-primary" : "text-muted-foreground"
                )}
              />
              <p
                className={cn(
                  "text-sm font-medium",
                  exportType === "excel" ? "text-primary" : ""
                )}
              >
                {t("home.excelExport.title")}
              </p>
            </button>
            <button
              onClick={() => setExportType("word")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:cursor-pointer",
                exportType === "word"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              )}
            >
              <FileText
                className={cn(
                  "h-5 w-5 shrink-0",
                  exportType === "word" ? "text-primary" : "text-muted-foreground"
                )}
              />
              <p
                className={cn(
                  "text-sm font-medium",
                  exportType === "word" ? "text-primary" : ""
                )}
              >
                {t("home.wordExport.title")}
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Step 3+: Excel — sections */}
      {exportType === "excel" && (
        <div>
          <StepHeader step={exportSpecificStep} label={t("excelExport.steps.sections")} />
          {isLoadingSections ? (
            <p className="text-xs text-muted-foreground">{t("massExecution.loadingSections")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={!templateId || isLoadingSections}
                    className="w-full justify-between font-normal hover:cursor-pointer text-muted-foreground"
                  >
                    <span className="truncate">
                      {selectedSectionIds.size === 0
                        ? t("excelExport.selectSections")
                        : t("excelExport.sectionsSelected", { count: selectedSectionIds.size })}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <div className="flex items-center border-b px-3">
                    <Input
                      placeholder={t("excelExport.searchSections")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 h-9"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="text-muted-foreground hover:text-foreground hover:cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <div
                    className="max-h-60 overflow-y-auto p-1"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {filtered.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {sections.length === 0
                          ? t("excelExport.noSections")
                          : t("excelExport.noResults")}
                      </p>
                    ) : (
                      filtered.map((section, i) => {
                        const isSelected = selectedSectionIds.has(section.id)
                        return (
                          <button
                            key={section.id}
                            type="button"
                            className={cn(
                              "relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:cursor-pointer",
                              "hover:bg-accent hover:text-accent-foreground",
                              isSelected && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => toggleSection(section.id)}
                          >
                            <span className="flex size-4 items-center justify-center">
                              {isSelected && <Check className="size-4" />}
                            </span>
                            <span>
                              {i + 1} · {section.name}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {selectedSections.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSections.map((section) => (
                    <span
                      key={section.id}
                      className="inline-flex items-center gap-1 rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium"
                    >
                      {section.name}
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="text-muted-foreground hover:text-foreground hover:cursor-pointer ml-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3+: Word — DOCX template picker */}
      {exportType === "word" && (
        <div>
          <StepHeader step={exportSpecificStep} label={t("wordExport.steps.docxTemplate")} />

          {!templateId ? (
            <p className="text-xs text-muted-foreground italic">{t("wordExport.selectTemplateFirst")}</p>
          ) : (
            <HuemulField
              type="combobox"
              label=""
              name="docx-template"
              value={selectedDocxTemplateId ?? ""}
              onChange={(v) => setSelectedDocxTemplateId(String(v) || null)}
              options={docxTemplates.map((tpl) => ({ label: tpl.name, value: tpl.id, icon: WordDocxIcon as unknown as LucideIcon }))}
              placeholder={
                isLoadingDocxTemplates
                  ? t("wordExport.loadingDocxTemplates")
                  : docxTemplates.length === 0
                  ? t("wordExport.noDocxTemplates")
                  : t("wordExport.selectDocxTemplate")
              }
              disabled={isLoadingDocxTemplates || docxTemplates.length === 0}
            />
          )}
        </div>
      )}
    </div>
  )
}
