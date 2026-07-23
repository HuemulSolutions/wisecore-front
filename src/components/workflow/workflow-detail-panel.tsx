import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, AlertCircle, Loader2 } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { AssetFormSection } from "@/components/assets/content/asset-form-section"
import { getDocumentContent } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import type { AssetContentResponse } from "@/types/assets"
import type { WorkflowItem } from "@/types/workflow"

interface WorkflowDetailPanelProps {
  row: WorkflowItem
  onClose: () => void
}

/** Panel derecho: campos del formulario (solo lectura) de la sección `current_step` de la fila seleccionada. */
export function WorkflowDetailPanel({ row, onClose }: WorkflowDetailPanelProps) {
  const { t } = useTranslation("workflow")
  const { selectedOrganizationId } = useOrganization()

  const { data, isLoading, error } = useQuery({
    queryKey: ["document-content", row.document_id, row.execution_id],
    queryFn: () =>
      getDocumentContent(row.document_id, selectedOrganizationId ?? "", row.execution_id) as Promise<
        AssetContentResponse["data"]
      >,
    enabled: !!selectedOrganizationId && !!row.current_step,
    staleTime: 60 * 1000,
    retry: 0,
  })

  const section = data?.content.find((s) => s.id === row.current_step?.section_execution_id)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-4 shrink-0">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{row.document_name}</p>
          <p className="truncate text-xs font-mono text-muted-foreground">{row.internal_code}</p>
        </div>
        <HuemulButton
          variant="ghost"
          size="sm"
          icon={X}
          tooltip={t("panel.close")}
          onClick={onClose}
          className="h-8 w-8 p-0 shrink-0"
        />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!row.current_step ? (
          <p className="text-sm text-muted-foreground">{t("panel.noCurrentStep")}</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t("panel.loadError")}
          </div>
        ) : !section ? (
          <p className="text-sm text-muted-foreground">{t("panel.sectionNotFound")}</p>
        ) : (
          <AssetFormSection
            sectionExecutionId={section.id}
            formFields={section.form_fields ?? []}
            organizationId={selectedOrganizationId ?? undefined}
            documentId={row.document_id}
            canInteract={false}
            isEditing={false}
            onExitEditing={() => {}}
          />
        )}
      </div>
    </div>
  )
}
