import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { getAllTemplates, getTemplateById } from "@/services/templates"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { HuemulFieldOption } from "@/huemul/components/huemul-field"
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

export interface ExcelExportConfig {
  templateId: string
  templateSectionIds: string[]
}

interface ExcelExportFormProps {
  onTemplateChange?: (templateId: string) => void
  onConfigChange?: (config: ExcelExportConfig) => void
}

export function ExcelExportForm({ onTemplateChange, onConfigChange }: ExcelExportFormProps) {
  const { t } = useTranslation("advanced")
  const { selectedOrganizationId } = useOrganization()

  const [templateId, setTemplateId] = useState("")
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", selectedOrganizationId],
    queryFn: () => getAllTemplates(selectedOrganizationId!),
    enabled: !!selectedOrganizationId,
  })

  const { data: templateDetail, isLoading: isLoadingSections } = useQuery({
    queryKey: ["template", templateId, selectedOrganizationId],
    queryFn: () => getTemplateById(templateId, selectedOrganizationId!),
    enabled: !!templateId && !!selectedOrganizationId,
  })

  const templateOptions: HuemulFieldOption[] = (templatesData?.data ?? []).map((tmpl) => ({
    label: tmpl.name,
    value: tmpl.id,
  }))

  const sections: TemplateSection[] = useMemo(
    () =>
      [...((templateDetail?.sections ?? []) as TemplateSection[])].sort((a, b) => a.order - b.order),
    [templateDetail]
  )

  const filtered = useMemo(() => {
    if (!search) return sections
    const lower = search.toLowerCase()
    return sections.filter((s) => s.name.toLowerCase().includes(lower))
  }, [sections, search])

  // Reset sections when template changes
  useEffect(() => {
    setSelectedSectionIds(new Set())
    setSearch("")
  }, [templateId])

  // Emit config changes
  useEffect(() => {
    onConfigChange?.({
      templateId,
      templateSectionIds: Array.from(selectedSectionIds),
    })
  }, [templateId, selectedSectionIds, onConfigChange])

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

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Step 1: Template */}
      <div>
        <StepHeader step={1} label={t("massExecution.steps.template")} />
        <HuemulField
          type="combobox"
          label=""
          name="excel-template"
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

      {/* Step 2: Sections (multi-select combobox) */}
      <div>
        <StepHeader step={2} label={t("excelExport.steps.sections")} />
        {isLoadingSections ? (
          <p className="text-xs text-muted-foreground">{t("massExecution.loadingSections")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Combobox trigger */}
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
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                <div className="max-h-60 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
                  {filtered.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {sections.length === 0 ? t("excelExport.noSections") : t("excelExport.noResults")}
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
                          <span>{i + 1} · {section.name}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Selected section badges */}
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
    </div>
  )
}

