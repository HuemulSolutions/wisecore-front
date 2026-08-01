import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, AlertCircle, Loader2, ChevronLeft, ChevronRight, Check, Edit3, History } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AssetFormSection, type AssetFormSectionHandle } from "@/components/assets/content/asset-form-section"
import { WorkflowAssetEditSheet } from "@/components/workflow/workflow-asset-edit-sheet"
import { WorkflowPreviousAnswersSheet } from "@/components/workflow/workflow-previous-answers-sheet"
import { HuemulReviewStatusBadge } from "@/huemul/components/huemul-review-status-badge"
import { HuemulLifecycleStageBadge } from "@/huemul/components/huemul-lifecycle-stage-badge"
import { HuemulLifecycleActions } from "@/huemul/components/huemul-lifecycle-actions"
import { HuemulLifecycleDialogs } from "@/huemul/components/huemul-lifecycle-dialogs"
import { getDocumentContent } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import { workflowQueryKeys } from "@/hooks/useWorkflows"
import { useLifecycleActions } from "@/hooks/useLifecycleActions"
import type { AssetContentResponse, ContentSection } from "@/types/assets"
import type { WorkflowItem } from "@/types/workflow"
import type { WorkflowTemplateItem, CreateExpressResult } from "@/types/templates"
import type { FormValuesSectionPayload } from "@/types/sections/core"
import type { ReviewStatus } from "@/types/section-execution"

interface WorkflowDetailPanelProps {
  /** Fila existente seleccionada en la tabla. */
  row?: WorkflowItem | null
  /** Template elegido desde las tarjetas para iniciar un express nuevo. */
  template?: WorkflowTemplateItem | null
  /** Documento ya creado por el padre para este template (express sin/ con nombre). */
  createdDoc?: CreateExpressResult | null
  /** El padre está creando el documento express (mutación en curso). */
  isCreating?: boolean
  /** El usuario envió el paso de nombre/descripción — el padre dispara la creación. */
  onSubmitName?: (name: string, description?: string) => void
  onClose: () => void
}

/**
 * Panel derecho: asistente por pasos (una sección form por vez) para responder el
 * formulario de un workflow, sin salir de la página. Cubre dos orígenes:
 * - `row`: fila ya existente en la tabla → se edita el documento/ejecución tal cual.
 * - `template`: tarjeta "Iniciar" → crea el documento express (pidiendo nombre acá
 *   mismo si el template lo requiere) y luego continúa con el mismo asistente.
 */
export function WorkflowDetailPanel({
  row,
  template,
  createdDoc,
  isCreating,
  onSubmitName,
  onClose,
}: WorkflowDetailPanelProps) {
  const { t } = useTranslation(["workflow", "sections"])
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()

  const [step, setStep] = React.useState(0)
  const [nameValue, setNameValue] = React.useState("")
  const [descriptionValue, setDescriptionValue] = React.useState("")
  const [isFormSaving, setIsFormSaving] = React.useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
  const [isAnswersSheetOpen, setIsAnswersSheetOpen] = React.useState(false)
  const [editedAsset, setEditedAsset] = React.useState<{ name: string; internalCode?: string } | null>(null)
  const formSectionRef = React.useRef<AssetFormSectionHandle>(null)

  const documentId = row?.document_id ?? createdDoc?.id ?? null
  // Fija la ejecución a mostrar (fila ya existente). Para un express recién creado
  // no hay `row` todavía, así que el fetch trae la ejecución por defecto del
  // documento — una vez cargada, `lifecycleExecutionId` abajo la toma de `data`.
  const executionId = row?.execution_id

  const nameRequired = !!template?.require_name_on_express
  // Bloquea el resto del asistente hasta que se envíe el nombre (solo templates nuevos que lo exigen).
  const needsNameStep = !row && !!template && nameRequired && !createdDoc

  // Resetea el paso/formulario de nombre cada vez que cambia el origen (otra fila u otro template).
  // La creación del documento (createdDoc) la controla el padre.
  React.useEffect(() => {
    setStep(0)
    setNameValue("")
    setDescriptionValue("")
    setEditedAsset(null)
    setIsAnswersSheetOpen(false)
  }, [row?.execution_id, template?.id])

  const handleCreateWithName = () => {
    onSubmitName?.(nameValue.trim(), descriptionValue.trim() || undefined)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["document-content", documentId, executionId],
    queryFn: () =>
      getDocumentContent(documentId ?? "", selectedOrganizationId ?? "", executionId) as Promise<
        AssetContentResponse["data"]
      >,
    enabled: !!selectedOrganizationId && !!documentId,
    staleTime: 60 * 1000,
    retry: 0,
  })

  const formSections = React.useMemo(
    () => (data?.content ?? []).filter((s) => s.section_type === "form"),
    [data],
  )
  const currentSection = formSections[step]
  const isLastStep = step >= formSections.length - 1
  // Solo secciones YA respondidas: el autoguardado de la sección actual flushea recién al
  // desmontarse (key={currentSection.id}), así que su valor más reciente puede no estar en
  // el caché todavía. Memoizado: handleSectionUpdate/handleReviewStatusChange parchean el
  // caché en cada autoguardado, lo que recrea `data` (y por ende `formSections`) en cada render.
  const previousSections = React.useMemo(() => formSections.slice(0, step), [formSections, step])

  // Autoguardado (PATCH /form_values): parchea en el caché solo la sección devuelta,
  // sin refetch de /content — mismo patrón que assets-content.tsx.
  const handleSectionUpdate = React.useCallback(
    (payload?: FormValuesSectionPayload[]) => {
      if (!payload?.length || !documentId) return
      const formFieldsBySectionId = new Map(payload.map((p) => [p.section_execution_id, p.form_fields]))
      queryClient.setQueriesData(
        { queryKey: ["document-content", documentId] },
        (old: { content?: ContentSection[] } | undefined) => {
          if (!old?.content || !Array.isArray(old.content)) return old
          return {
            ...old,
            content: old.content.map((s) =>
              formFieldsBySectionId.has(s.id) ? { ...s, form_fields: formFieldsBySectionId.get(s.id) } : s,
            ),
          }
        },
      )
    },
    [queryClient, documentId],
  )

  // review_status es puramente visual: al terminar de responder el paso (handleDoneEditing
  // dentro de AssetFormSection) queda en 'finished'. Se parchea igual que form_fields —sin
  // refetch— para que el badge del header refleje el cambio al volver con "Atrás".
  const handleReviewStatusChange = React.useCallback(
    (sectionExecutionId: string, status: ReviewStatus) => {
      if (!documentId) return
      queryClient.setQueriesData(
        { queryKey: ["document-content", documentId] },
        (old: { content?: ContentSection[] } | undefined) => {
          if (!old?.content || !Array.isArray(old.content)) return old
          return {
            ...old,
            content: old.content.map((s) => (s.id === sectionExecutionId ? { ...s, review_status: status } : s)),
          }
        },
      )
    },
    [queryClient, documentId],
  )

  const handleClose = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: workflowQueryKeys.listBase() })
    onClose()
  }, [queryClient, onClose])

  // AssetFormSection ya validó (required/formato) y guardó antes de llamar esto.
  const goNext = React.useCallback(() => {
    if (isLastStep) {
      handleClose()
    } else {
      setStep((s) => s + 1)
    }
  }, [isLastStep, handleClose])

  const documentName = editedAsset?.name ?? row?.document_name ?? createdDoc?.name ?? template?.name
  const internalCode = editedAsset?.internalCode ?? row?.internal_code

  // Ciclo de vida del documento (completar/devolver, publicar, archivar, restaurar,
  // asignar versión, re-lanzar publish externo) — mismo controlador que assets-content.tsx.
  const lifecycleExecutionId = executionId ?? data?.execution_id
  const lifecycle = useLifecycleActions({
    documentId,
    executionId: lifecycleExecutionId,
    organizationId: selectedOrganizationId,
    lifecycleStatus: data?.lifecycle_status,
    lifecyclePermissions: data?.lifecycle_permissions,
    extraRefreshKeys: () => [workflowQueryKeys.listBase()],
  })

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-4 shrink-0">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{documentName}</p>
          {internalCode && <p className="truncate text-xs font-mono text-muted-foreground">{internalCode}</p>}
          {currentSection?.section_name && (
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs text-muted-foreground">{currentSection.section_name}</p>
              <HuemulReviewStatusBadge status={currentSection.review_status as ReviewStatus | null} sectionType="form" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {documentId && !needsNameStep && formSections.length > 0 && (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={History}
              tooltip={step === 0 ? t("wizard.answers.tooltipDisabled") : t("wizard.answers.tooltip")}
              disabled={step === 0}
              onClick={() => setIsAnswersSheetOpen(true)}
              className="h-8 w-8 p-0"
            />
          )}
          {documentId && !needsNameStep && (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={Edit3}
              tooltip={t("panel.edit")}
              onClick={() => setIsEditSheetOpen(true)}
              className="h-8 w-8 p-0"
            />
          )}
          <HuemulButton
            variant="ghost"
            size="sm"
            icon={X}
            tooltip={t("panel.close")}
            onClick={handleClose}
            className="h-8 w-8 p-0"
          />
        </div>
      </div>

      {data?.lifecycle_status && !needsNameStep && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2 shrink-0 flex-wrap">
          <HuemulLifecycleStageBadge status={data.lifecycle_status} />
          <HuemulLifecycleActions controller={lifecycle} variant="row" showRerunExternalPublish />
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {needsNameStep ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workflow-express-name" className="text-xs text-muted-foreground font-normal">
                {t("expressSheet.name")}
                <span className="text-destructive"> *</span>
              </Label>
              <Input
                id="workflow-express-name"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder={t("expressSheet.namePlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workflow-express-description" className="text-xs text-muted-foreground font-normal">
                {t("expressSheet.description")}
              </Label>
              <Textarea
                id="workflow-express-description"
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                placeholder={t("expressSheet.descriptionPlaceholder")}
                rows={4}
              />
            </div>
            <HuemulButton
              label={t("wizard.next")}
              loading={isCreating}
              disabled={nameValue.trim().length === 0}
              onClick={handleCreateWithName}
              className="self-end"
            />
          </div>
        ) : !documentId || isLoading || isCreating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t("panel.loadError")}
          </div>
        ) : formSections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("wizard.noFormSections")}</p>
        ) : (
          <AssetFormSection
            key={currentSection.id}
            ref={formSectionRef}
            sectionExecutionId={currentSection.id}
            formFields={currentSection.form_fields ?? []}
            organizationId={selectedOrganizationId ?? undefined}
            documentId={documentId}
            canInteract
            isEditing
            onExitEditing={goNext}
            reviewStatus={currentSection.review_status as ReviewStatus | null}
            onReviewStatusChange={(status) => handleReviewStatusChange(currentSection.id, status)}
            onUpdate={handleSectionUpdate}
            onSavingChange={setIsFormSaving}
          />
        )}
      </div>

      {!needsNameStep && documentId && !isLoading && !error && formSections.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-t p-4 shrink-0">
          <HuemulButton
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            label={t("wizard.back")}
            disabled={step === 0 || isFormSaving}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          />
          <HuemulButton
            size="sm"
            icon={isLastStep ? Check : ChevronRight}
            iconPosition="right"
            label={isLastStep ? t("wizard.finish") : t("wizard.next")}
            disabled={isFormSaving}
            onClick={() => formSectionRef.current?.exit()}
          />
        </div>
      )}

      {documentId && (
        <WorkflowAssetEditSheet
          open={isEditSheetOpen}
          onOpenChange={setIsEditSheetOpen}
          documentId={documentId}
          currentName={documentName ?? ""}
          currentInternalCode={internalCode}
          onUpdated={(newName, newInternalCode) => setEditedAsset({ name: newName, internalCode: newInternalCode })}
        />
      )}

      <WorkflowPreviousAnswersSheet
        open={isAnswersSheetOpen}
        onOpenChange={setIsAnswersSheetOpen}
        sections={previousSections}
        onGoToStep={(i) => setStep(i)}
      />

      <HuemulLifecycleDialogs
        controller={lifecycle}
        executionId={lifecycleExecutionId}
        organizationId={selectedOrganizationId}
        existingVersions={data?.executions?.map((e) => e.version).filter((v): v is string => !!v)}
      />
    </div>
  )
}
