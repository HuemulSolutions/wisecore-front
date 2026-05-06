import { useState, useCallback, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Play, History, Home, CheckCircle2, SkipForward, XCircle, FileSpreadsheet, Download, FileText } from "lucide-react"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { MassExecutionForm } from "@/components/execution/mass-execution-form"
import type { MassExecutionConfig } from "@/components/execution/mass-execution-form"
import { CombinedExportForm } from "@/components/execution/combined-export-form"
import type { CombinedExportConfig } from "@/components/execution/combined-export-form"
import { AssetSelectionPanel } from "@/components/execution/asset-selection-panel"
import { ChangeHistoryPanel } from "@/components/execution/change-history-panel"
import { bulkGenerateByTemplateSection, bulkAiFixByTemplateSection, bulkExportExcel, bulkExportCustomWord } from "@/services/executions"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { cn } from "@/lib/utils"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"

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
  const canAccessWordExport = isOrgAdmin || hasPermission('version:r')
  const canAccessExports = canAccessExcelExport || canAccessWordExport

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

  const [selectedExportTemplateId, setSelectedExportTemplateId] = useState("")
  const [combinedExportConfig, setCombinedExportConfig] = useState<CombinedExportConfig | null>(null)
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
      setSelectedExportTemplateId("")
      setCombinedExportConfig(null)
    }
  }, [activeSection])

  const handleSectionChange = useCallback((section: AdvancedSection) => {
    navigate(`/advanced/${section}`)
  }, [navigate])

  const handleNavigateToSection = useCallback((section: AdvancedSection) => {
    navigate(`/advanced/${section}`)
  }, [navigate])

  const navigateToExportTab = useCallback(() => {
    navigate(`/advanced/excel-export`)
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

  const handleExport = useCallback(async (executionIds: string[]) => {
    if (!combinedExportConfig || !selectedOrganizationId) return
    setIsExporting(true)
    try {
      if (combinedExportConfig.type === "excel") {
        await bulkExportExcel({
          templateId: combinedExportConfig.templateId,
          executionIds,
          templateSectionIds: combinedExportConfig.templateSectionIds,
          organizationId: selectedOrganizationId,
        })
        toast.success(t("excelExport.exportSuccess"))
      } else {
        const useTemplateDocx = combinedExportConfig.docxSource === "template"
        await bulkExportCustomWord({
          templateId: combinedExportConfig.templateId,
          executionIds,
          docxTemplateId: useTemplateDocx ? combinedExportConfig.docxTemplateId : null,
          file: useTemplateDocx ? combinedExportConfig.file : null,
          organizationId: selectedOrganizationId,
        })
        toast.success(t("wordExport.exportSuccess"))
      }
    } catch (error) {
      handleApiError(error, {
        fallbackMessage: combinedExportConfig.type === "excel" ? t("excelExport.exportError") : t("wordExport.exportError"),
        showDescription: false,
      })
    } finally {
      setIsExporting(false)
    }
  }, [combinedExportConfig, selectedOrganizationId, t])

  const menuItems: { key: AdvancedSection; label: string; icon: React.ElementType; visible: boolean }[] = [
    { key: "home", label: t("menu.home"), icon: Home, visible: true },
    { key: "mass-execution", label: t("menu.massExecution"), icon: Play, visible: canAccessMassExecution },
    { key: "excel-export", label: t("menu.excelExport"), icon: FileSpreadsheet, visible: canAccessExports },
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
        {canAccessExports && (
          <button
            onClick={() => navigateToExportTab()}
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

  const exportForm = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide flex flex-col gap-6">
      <CombinedExportForm
        canAccessExcelExport={canAccessExcelExport}
        canAccessWordExport={canAccessWordExport}
        onTemplateChange={setSelectedExportTemplateId}
        onConfigChange={setCombinedExportConfig}
      />
    </div>
  )

  const executeDisabled = !canCreateExecution || !massExecutionConfig || !massExecutionConfig.sectionId || (massExecutionConfig.editType === "execute-ai" && (!massExecutionConfig.llmId || !canListLlms)) || (massExecutionConfig.editType === "edit-ai" && massExecutionConfig.executionMode !== "review" && massExecutionConfig.executionMode !== "save") || (massExecutionConfig.editType === "edit-ai" && !massExecutionConfig.instructions?.trim()) || (massExecutionConfig.editType !== "execute-ai" && massExecutionConfig.editType !== "edit-ai")

  const exportDisabled = !combinedExportConfig
    || (combinedExportConfig.type === "excel" && (!canAccessExcelExport || combinedExportConfig.templateSectionIds.length === 0))
    || (combinedExportConfig.type === "word" && (!canAccessWordExport || !combinedExportConfig.docxTemplateId))

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

  const exportAssetSelection = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <AssetSelectionPanel
        templateId={selectedExportTemplateId}
        onExecute={handleExport}
        isExecuting={isExporting}
        executeDisabled={exportDisabled}
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

  const activeExportType = combinedExportConfig?.type
  const sectionIcon = isMassExecution ? Play : isExcelExport ? (activeExportType === "word" ? FileText : FileSpreadsheet) : History
  const sectionTitle = isMassExecution
    ? t("home.massExecution.title")
    : isExcelExport
      ? (activeExportType === "word" ? t("home.wordExport.title") : t("home.excelExport.title"))
      : t("home.changeHistory.title")
  const sectionDescription = isMassExecution
    ? t("home.massExecution.description")
    : isExcelExport
      ? (activeExportType === "word" ? t("home.wordExport.description") : t("home.excelExport.description"))
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
        ? exportForm
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
          content: isMassExecution ? assetSelection : exportAssetSelection,
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

      <HuemulDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        title={t("massExecution.result.title")}
        description={t("massExecution.result.total", { count: executionResult?.total ?? 0 })}
        showCancelButton={false}
        saveAction={{ label: t("massExecution.result.close"), closeOnSuccess: true }}
        maxWidth="sm:max-w-md"
      >
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
      </HuemulDialog>
    </>
  )
}
