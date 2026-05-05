import { useState, useCallback, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Play, History, Home, CheckCircle2, SkipForward, XCircle, FileSpreadsheet, Download } from "lucide-react"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { MassExecutionForm } from "@/components/execution/mass-execution-form"
import type { MassExecutionConfig } from "@/components/execution/mass-execution-form"
import { ExcelExportForm } from "@/components/execution/excel-export-form"
import type { ExcelExportConfig } from "@/components/execution/excel-export-form"
import { AssetSelectionPanel } from "@/components/execution/asset-selection-panel"
import { ChangeHistoryPanel } from "@/components/execution/change-history-panel"
import { bulkGenerateByTemplateSection, bulkAiFixByTemplateSection, bulkExportExcel } from "@/services/executions"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type AdvancedSection = "home" | "mass-execution" | "change-history" | "excel-export"

export default function AdvancedPage() {
  const { t } = useTranslation("advanced")
  const { selectedOrganizationId } = useOrganization()
  const { isOrgAdmin, hasPermission, hasAnyPermission } = useUserPermissions()
  const navigate = useOrgNavigate()
  const { section: sectionParam } = useParams<{ section: string }>()

  // Permission flags
  const canListTemplates = isOrgAdmin || hasAnyPermission(['template:l', 'template:r'])
  const canListTemplateSections = isOrgAdmin || hasAnyPermission(['template_section:l', 'template_section:r'])
  const canListLlms = isOrgAdmin || hasAnyPermission(['llm:l', 'llm:r'])
  const canCreateExecution = isOrgAdmin || hasPermission('section_execution:c')
  const canListExecutions = isOrgAdmin || hasAnyPermission(['section_execution:l', 'section_execution:r'])

  const canAccessMassExecution = canListTemplates && canListTemplateSections && canListExecutions
  const canAccessExcelExport = isOrgAdmin || (canListTemplates && canListTemplateSections && canListExecutions)

  const VALID_SECTIONS: AdvancedSection[] = ["home", "mass-execution", "change-history", "excel-export"]
  const activeSection: AdvancedSection =
    VALID_SECTIONS.includes(sectionParam as AdvancedSection)
      ? (sectionParam as AdvancedSection)
      : "home"

  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [massExecutionConfig, setMassExecutionConfig] = useState<MassExecutionConfig | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<{ total: number; enqueued: number; skipped: number; failed: number } | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [selectionKey, setSelectionKey] = useState(0)

  const [selectedExcelTemplateId, setSelectedExcelTemplateId] = useState("")
  const [excelExportConfig, setExcelExportConfig] = useState<ExcelExportConfig | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Reset form state when leaving mass-execution
  useEffect(() => {
    if (activeSection !== "mass-execution") {
      setSelectedTemplateId("")
      setMassExecutionConfig(null)
      setExecutionResult(null)
    }
  }, [activeSection])

  // Reset form state when leaving excel-export
  useEffect(() => {
    if (activeSection !== "excel-export") {
      setSelectedExcelTemplateId("")
      setExcelExportConfig(null)
    }
  }, [activeSection])

  const handleSectionChange = useCallback((section: AdvancedSection) => {
    navigate(`/advanced/${section}`)
  }, [navigate])

  const handleNavigateToSection = useCallback((section: AdvancedSection) => {
    navigate(`/advanced/${section}`)
  }, [navigate])

  const handleExecute = useCallback(async (executionIds: string[]) => {
    if (!massExecutionConfig || !selectedOrganizationId || !canCreateExecution) return

    setIsExecuting(true)
    setExecutionResult(null)
    try {
      let result
      if (massExecutionConfig.editType === "execute-ai") {
        result = await bulkGenerateByTemplateSection({
          executionIds,
          templateSectionId: massExecutionConfig.sectionId,
          llmId: massExecutionConfig.llmId,
          instructions: massExecutionConfig.instructions,
          singleSectionMode: massExecutionConfig.executionMode === "single",
          organizationId: selectedOrganizationId,
        })
      } else if (massExecutionConfig.editType === "edit-ai") {
        result = await bulkAiFixByTemplateSection({
          executionIds,
          templateSectionId: massExecutionConfig.sectionId,
          instruction: massExecutionConfig.instructions,
          autoApply: massExecutionConfig.executionMode === "save",
          organizationId: selectedOrganizationId,
        })
      }
      if (result?.summary) {
        setExecutionResult({
          total: result.summary.total ?? 0,
          enqueued: result.summary.enqueued ?? 0,
          skipped: result.summary.skipped ?? 0,
          failed: result.summary.failed ?? 0,
        })
        setShowResultDialog(true)
        setSelectionKey((k) => k + 1)
      }
      toast.success(t("massExecution.executeSuccess"))
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("massExecution.executeError") })
    } finally {
      setIsExecuting(false)
    }
  }, [massExecutionConfig, selectedOrganizationId, canCreateExecution, t])

  const handleExcelExport = useCallback(async (executionIds: string[]) => {
    if (!excelExportConfig || !selectedOrganizationId) return
    setIsExporting(true)
    try {
      await bulkExportExcel({
        templateId: excelExportConfig.templateId,
        executionIds,
        templateSectionIds: excelExportConfig.templateSectionIds,
        organizationId: selectedOrganizationId,
      })
      toast.success(t("excelExport.exportSuccess"))
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("excelExport.exportError"), showDescription: false })
    } finally {
      setIsExporting(false)
    }
  }, [excelExportConfig, selectedOrganizationId, t])

  const menuItems: { key: AdvancedSection; label: string; icon: React.ElementType; visible: boolean }[] = [
    { key: "home", label: t("menu.home"), icon: Home, visible: true },
    { key: "mass-execution", label: t("menu.massExecution"), icon: Play, visible: canAccessMassExecution },
    { key: "excel-export", label: t("menu.excelExport"), icon: FileSpreadsheet, visible: canAccessExcelExport },
    { key: "change-history", label: t("menu.changeHistory"), icon: History, visible: canListExecutions },
  ]

  const visibleMenuItems = menuItems.filter((item) => item.visible)

  const sidebar = (
    <nav className="flex flex-col gap-1 p-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 truncate">
        {t("title")}
      </h2>
      {visibleMenuItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.key}
            onClick={() => handleSectionChange(item.key)}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:cursor-pointer",
              activeSection === item.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )

  const homeContent = (
    <div className="p-8 h-full overflow-y-auto scrollbar-hide">
      <h1 className="text-2xl font-semibold">{t("home.title")}</h1>
      <p className="text-muted-foreground mt-2">{t("home.description")}</p>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-8 mb-4">
        {t("home.availableOptions")}
      </h2>

      <div className="flex flex-col gap-3">
        {canAccessMassExecution && (
          <button
            onClick={() => handleNavigateToSection("mass-execution")}
            className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted hover:cursor-pointer"
          >
            <Play className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t("home.massExecution.title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("home.massExecution.description")}</p>
            </div>
          </button>
        )}
        {canAccessExcelExport && (
          <button
            onClick={() => handleNavigateToSection("excel-export")}
            className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted hover:cursor-pointer"
          >
            <FileSpreadsheet className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t("home.excelExport.title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("home.excelExport.description")}</p>
            </div>
          </button>
        )}
        {canListExecutions && (
          <button
            onClick={() => handleNavigateToSection("change-history")}
            className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted hover:cursor-pointer"
          >
            <History className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t("home.changeHistory.title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("home.changeHistory.description")}</p>
            </div>
          </button>
        )}
      </div>
    </div>
  )

  const massExecutionForm = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <MassExecutionForm
        onTemplateChange={setSelectedTemplateId}
        onConfigChange={setMassExecutionConfig}
      />
    </div>
  )

  const excelExportForm = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <ExcelExportForm
        onTemplateChange={setSelectedExcelTemplateId}
        onConfigChange={setExcelExportConfig}
      />
    </div>
  )

  const executeDisabled = !canCreateExecution || !massExecutionConfig || !massExecutionConfig.sectionId || (massExecutionConfig.editType === "execute-ai" && (!massExecutionConfig.llmId || !canListLlms)) || (massExecutionConfig.editType === "edit-ai" && massExecutionConfig.executionMode !== "review" && massExecutionConfig.executionMode !== "save") || (massExecutionConfig.editType === "edit-ai" && !massExecutionConfig.instructions?.trim()) || (massExecutionConfig.editType !== "execute-ai" && massExecutionConfig.editType !== "edit-ai")

  const excelExportDisabled = !canAccessExcelExport || !excelExportConfig || !excelExportConfig.templateId || excelExportConfig.templateSectionIds.length === 0

  const assetSelection = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <AssetSelectionPanel
        templateId={selectedTemplateId}
        onExecute={handleExecute}
        isExecuting={isExecuting}
        executeDisabled={executeDisabled}
        selectionKey={selectionKey}
      />
    </div>
  )

  const excelAssetSelection = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <AssetSelectionPanel
        templateId={selectedExcelTemplateId}
        onExecute={handleExcelExport}
        isExecuting={isExporting}
        executeDisabled={excelExportDisabled}
        actionLabel={t("assetSelection.export")}
        actionLoadingLabel={t("assetSelection.exporting")}
        ActionIcon={Download}
      />
    </div>
  )

  const changeHistory = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <ChangeHistoryPanel />
    </div>
  )

  const isMassExecution = activeSection === "mass-execution"
  const isExcelExport = activeSection === "excel-export"
  const isHome = activeSection === "home"

  const sectionIcon = isMassExecution ? Play : isExcelExport ? FileSpreadsheet : History
  const sectionTitle = isMassExecution
    ? t("home.massExecution.title")
    : isExcelExport
      ? t("home.excelExport.title")
      : t("home.changeHistory.title")
  const sectionDescription = isMassExecution
    ? t("home.massExecution.description")
    : isExcelExport
      ? t("home.excelExport.description")
      : t("home.changeHistory.description")

  const pageHeader = !isHome ? (
    <div className="px-6 py-3">
      <div className="-mb-6">
        <PageHeader icon={sectionIcon} title={sectionTitle} showRefresh={false} />
      </div>
      <p className="text-sm text-muted-foreground">{sectionDescription}</p>
    </div>
  ) : undefined

  const leftContent = isHome
    ? homeContent
    : isMassExecution
      ? massExecutionForm
      : isExcelExport
        ? excelExportForm
        : changeHistory

  const innerLayout = (
    <HuemulPageLayout
      header={pageHeader}
      showHeader={!isHome}
      columns={[
        {
          content: leftContent,
          defaultSize: isMassExecution || isExcelExport ? 35 : 100,
          minSize: 20,
          maxSize: 80,
        },
        {
          content: isMassExecution ? assetSelection : excelAssetSelection,
          defaultSize: 65,
          minSize: 20,
          maxSize: 80,
          show: isMassExecution || isExcelExport,
        },
      ]}
    />
  )

  return (
    <>
      <HuemulPageLayout
        columns={[
          { content: sidebar, defaultSize: 15, minSize: 12, maxSize: 50 },
          { content: innerLayout, defaultSize: 85, minSize: 50 },
        ]}
      />

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("massExecution.result.title")}</DialogTitle>
            <DialogDescription>
              {t("massExecution.result.total", { count: executionResult?.total ?? 0 })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t("massExecution.result.enqueued")}</p>
                <p className="text-xs text-muted-foreground">{t("massExecution.result.enqueuedDescription")}</p>
              </div>
              <span className="text-2xl font-bold text-primary">{executionResult?.enqueued ?? 0}</span>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4">
              <SkipForward className="h-8 w-8 shrink-0 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t("massExecution.result.skipped")}</p>
                <p className="text-xs text-muted-foreground">{t("massExecution.result.skippedDescription")}</p>
              </div>
              <span className="text-2xl font-bold text-yellow-500">{executionResult?.skipped ?? 0}</span>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4">
              <XCircle className="h-8 w-8 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t("massExecution.result.failed")}</p>
                <p className="text-xs text-muted-foreground">{t("massExecution.result.failedDescription")}</p>
              </div>
              <span className="text-2xl font-bold text-destructive">{executionResult?.failed ?? 0}</span>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="w-full hover:cursor-pointer">{t("massExecution.result.close")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
