import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Play, History } from "lucide-react"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { MassExecutionForm } from "@/components/execution/mass-execution-form"
import type { MassExecutionConfig } from "@/components/execution/mass-execution-form"
import { AssetSelectionPanel } from "@/components/execution/asset-selection-panel"
import { bulkGenerateByTemplateSection, bulkAiFixByTemplateSection } from "@/services/executions"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { cn } from "@/lib/utils"

type AdvancedSection = "mass-execution" | "change-history"

export default function AdvancedPage() {
  const { t } = useTranslation("advanced")
  const { selectedOrganizationId } = useOrganization()
  const { isOrgAdmin, hasPermission, hasAnyPermission } = useUserPermissions()

  // Permission flags
  const canListTemplates = isOrgAdmin || hasAnyPermission(['template:l', 'template:r'])
  const canListTemplateSections = isOrgAdmin || hasAnyPermission(['template_section:l', 'template_section:r'])
  const canListLlms = isOrgAdmin || hasAnyPermission(['llm:l', 'llm:r'])
  const canCreateExecution = isOrgAdmin || hasPermission('section_execution:c')
  const canListExecutions = isOrgAdmin || hasAnyPermission(['section_execution:l', 'section_execution:r'])

  const canAccessMassExecution = canListTemplates && canListTemplateSections && canListExecutions

  const [activeSection, setActiveSection] = useState<AdvancedSection>("mass-execution")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [massExecutionConfig, setMassExecutionConfig] = useState<MassExecutionConfig | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleSectionChange = useCallback((section: AdvancedSection) => {
    setActiveSection(section)
    if (section !== "mass-execution") {
      setSelectedTemplateId("")
      setMassExecutionConfig(null)
    }
  }, [])

  const handleExecute = useCallback(async (executionIds: string[]) => {
    if (!massExecutionConfig || !selectedOrganizationId || !canCreateExecution) return

    setIsExecuting(true)
    try {
      if (massExecutionConfig.editType === "execute-ai") {
        await bulkGenerateByTemplateSection({
          executionIds,
          templateSectionId: massExecutionConfig.sectionId,
          llmId: massExecutionConfig.llmId,
          instructions: massExecutionConfig.instructions,
          singleSectionMode: massExecutionConfig.executionMode === "single",
          organizationId: selectedOrganizationId,
        })
      } else if (massExecutionConfig.editType === "edit-ai") {
        await bulkAiFixByTemplateSection({
          executionIds,
          templateSectionId: massExecutionConfig.sectionId,
          instruction: massExecutionConfig.instructions,
          autoApply: massExecutionConfig.executionMode === "save",
          organizationId: selectedOrganizationId,
        })
      }
      toast.success(t("massExecution.executeSuccess"))
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("massExecution.executeError") })
    } finally {
      setIsExecuting(false)
    }
  }, [massExecutionConfig, selectedOrganizationId, canCreateExecution, t])

  const menuItems: { key: AdvancedSection; label: string; icon: React.ElementType; visible: boolean }[] = [
    { key: "mass-execution", label: t("menu.massExecution"), icon: Play, visible: canAccessMassExecution },
    { key: "change-history", label: t("menu.changeHistory"), icon: History, visible: canListExecutions },
  ]

  const visibleMenuItems = menuItems.filter((item) => item.visible)

  const sidebar = (
    <nav className="flex flex-col gap-1 p-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {t("title")}
      </h2>
      {visibleMenuItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.key}
            onClick={() => handleSectionChange(item.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:cursor-pointer",
              activeSection === item.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  const massExecutionForm = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <MassExecutionForm
        onTemplateChange={setSelectedTemplateId}
        onConfigChange={setMassExecutionConfig}
      />
    </div>
  )

  const executeDisabled = !canCreateExecution || !massExecutionConfig || !massExecutionConfig.sectionId || (massExecutionConfig.editType === "execute-ai" && (!massExecutionConfig.llmId || !canListLlms)) || (massExecutionConfig.editType === "edit-ai" && massExecutionConfig.executionMode !== "review" && massExecutionConfig.executionMode !== "save") || (massExecutionConfig.editType !== "execute-ai" && massExecutionConfig.editType !== "edit-ai")

  const assetSelection = (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <AssetSelectionPanel
        templateId={selectedTemplateId}
        onExecute={handleExecute}
        isExecuting={isExecuting}
        executeDisabled={executeDisabled}
      />
    </div>
  )

  const changeHistory = (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{t("menu.changeHistory")}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {/* Placeholder for change history content */}
      </p>
    </div>
  )

  const isMassExecution = activeSection === "mass-execution"

  return (
    <HuemulPageLayout
      columns={[
        { content: sidebar, defaultSize: 15, resizable: false },
        {
          content: isMassExecution ? massExecutionForm : changeHistory,
          defaultSize: 30,
          resizable: false,
        },
        {
          content: assetSelection,
          show: isMassExecution,
          resizable: false,
        },
      ]}
    />
  )
}
