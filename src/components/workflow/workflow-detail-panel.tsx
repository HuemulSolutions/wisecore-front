import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, AlertCircle, Loader2, ChevronLeft, ChevronRight, Check, Edit3, ListChecks, RefreshCw, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AssetFormSection, type AssetFormSectionHandle } from "@/components/assets/content/asset-form-section"
import { WorkflowAssetEditSheet } from "@/components/workflow/workflow-asset-edit-sheet"
import { WorkflowSectionsSummary } from "@/components/workflow/workflow-sections-summary"
import { HuemulReviewStatusBadge } from "@/huemul/components/huemul-review-status-badge"
import { HuemulLifecycleStageBadge } from "@/huemul/components/huemul-lifecycle-stage-badge"
import { HuemulLifecycleActions } from "@/huemul/components/huemul-lifecycle-actions"
import { HuemulLifecycleDialogs } from "@/huemul/components/huemul-lifecycle-dialogs"
import { getDocumentContent } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { lifecycleAllows } from "@/hooks/useDocumentAccess"
import { workflowQueryKeys } from "@/hooks/useWorkflows"
import { useLifecycleActions } from "@/hooks/useLifecycleActions"
import type { AssetContentResponse, ContentSection } from "@/types/assets"
import type { WorkflowRowRef } from "@/types/workflow"
import type { WorkflowTemplateItem, CreateExpressResult } from "@/types/templates"
import type { FormValuesSectionPayload } from "@/types/sections/core"
import type { ReviewStatus } from "@/types/section-execution"
import { applyFormValuesPatch } from "@/components/assets/content/utils/patch-document-content"
import { isFormSectionApplicable } from "@/components/workflow/workflow-section-stats"

interface WorkflowDetailPanelProps {
  /** Fila existente seleccionada en la tabla (o solo los IDs, en la vista compartida). */
  row?: WorkflowRowRef | null
  /** Template elegido desde las tarjetas para iniciar un express nuevo. */
  template?: WorkflowTemplateItem | null
  /** Documento ya creado por el padre para este template (express sin/ con nombre). */
  createdDoc?: CreateExpressResult | null
  /** El padre está creando el documento express (mutación en curso). */
  isCreating?: boolean
  /** El usuario envió el paso de nombre/descripción — el padre dispara la creación. */
  onSubmitName?: (name: string, description?: string) => void
  onClose: () => void
  /**
   * "panel": columna derecha de /workflow (default). "fullscreen": vista
   * compartida a pantalla completa (workflow-fill.tsx) — ancha el contenido
   * y agranda el header.
   */
  variant?: "panel" | "fullscreen"
  /** Oculta el botón de cerrar del header. Default true (no aplica en fullscreen: no hay panel que cerrar). */
  showClose?: boolean
  /** Oculta el lápiz de editar nombre/código. Default true (se oculta para quien solo responde). */
  showAssetEdit?: boolean
  /** Oculta el badge y las acciones de ciclo de vida. Default true. */
  showLifecycle?: boolean
  /** Se llama en vez de handleClose al terminar el último paso. Default: handleClose. */
  onFinish?: () => void
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
  variant = "panel",
  showClose = true,
  showAssetEdit = true,
  showLifecycle = true,
  onFinish,
}: WorkflowDetailPanelProps) {
  const isFullscreen = variant === "fullscreen"
  const { t } = useTranslation(["workflow", "sections"])
  const { t: tCommon } = useTranslation("common")
  const { selectedOrganizationId } = useOrganization()
  const { can } = usePageAccess("workflow")
  const queryClient = useQueryClient()

  // Eje RBAC del panel (grueso, `asset:*` — mismo criterio que useAssetContentPermissions).
  const canReadAsset = can("readAsset")
  const canUpdateAssetContent = can("updateAssetContent")

  // null = pantalla de resumen de secciones; number = paso del wizard (índice en formSections).
  // Solo una fila ya existente (`row`) tiene algo que resumir — un express recién iniciado
  // arranca directo en el paso 0.
  const [step, setStep] = React.useState<number | null>(row ? null : 0)
  const [nameValue, setNameValue] = React.useState("")
  const [descriptionValue, setDescriptionValue] = React.useState("")
  const [isFormSaving, setIsFormSaving] = React.useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
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
    setStep(row ? null : 0)
    setNameValue("")
    setDescriptionValue("")
    setEditedAsset(null)
  }, [row?.execution_id, template?.id])

  const handleCreateWithName = () => {
    if (!can("createExpressAsset")) return
    onSubmitName?.(nameValue.trim(), descriptionValue.trim() || undefined)
  }

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["document-content", documentId, executionId],
    queryFn: () =>
      getDocumentContent(documentId ?? "", selectedOrganizationId ?? "", executionId) as Promise<
        AssetContentResponse["data"]
      >,
    enabled: !!selectedOrganizationId && !!documentId && canReadAsset,
    staleTime: 60 * 1000,
    retry: 0,
  })

  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["document-content", documentId] })
  }, [queryClient, documentId])

  // Solo secciones form "aplicables" (ver ia context/dependencias-condicionales-formularios-guide.md):
  // el backend ya no devuelve en /content las que quedan sin ninguna pregunta visible, y este
  // filtro es el espejo cliente que cubre el intervalo hasta el próximo refetch.
  const formSections = React.useMemo(
    () => (data?.content ?? []).filter((s) => s.section_type === "form" && isFormSectionApplicable(s)),
    [data],
  )
  // step === null → pantalla de resumen (ver WorkflowSectionsSummary), sin sección "actual".
  const currentSection = step !== null ? formSections[step] : undefined
  const isLastStep = step !== null && step >= formSections.length - 1

  // Si la sección del paso actual deja de aplicar (una respuesta ocultó todas sus preguntas) u
  // otra sección recién aplicable se inserta antes, formSections cambia de largo/orden y el
  // índice numérico de `step` puede quedar apuntando a la sección equivocada o fuera de rango.
  // Se ancla comparando contra la lista anterior: si la sección que estaba en `step` sigue
  // presente (en otra posición), el paso se recalcula sobre su nueva posición; si desapareció,
  // cae en la que ocupa su lugar (o al resumen si no queda ninguna sección aplicable).
  const prevFormSectionsRef = React.useRef(formSections)
  React.useEffect(() => {
    const prevSections = prevFormSectionsRef.current
    prevFormSectionsRef.current = formSections
    if (prevSections === formSections || step === null) return
    const anchorId = prevSections[step]?.id
    const anchoredIndex = anchorId ? formSections.findIndex((s) => s.id === anchorId) : -1
    const nextStep =
      anchoredIndex !== -1
        ? anchoredIndex
        : formSections.length === 0
          ? null
          : Math.min(step, formSections.length - 1)
    if (nextStep !== step) setStep(nextStep)
  }, [formSections, step])

  // Autoguardado (PATCH /form_values): parchea en el caché solo la sección devuelta,
  // sin refetch de /content — mismo patrón que assets-content.tsx. También refresca
  // section_name si vino no-null, para que el header del wizard quede al día.
  const handleSectionUpdate = React.useCallback(
    (payload?: FormValuesSectionPayload[]) => {
      if (!payload?.length || !documentId) return
      applyFormValuesPatch(queryClient, documentId, payload)
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
  // Solo se invoca mientras se está respondiendo un paso (step !== null).
  const goNext = React.useCallback(() => {
    if (isLastStep) {
      if (onFinish) {
        onFinish()
      } else {
        handleClose()
      }
    } else {
      setStep((s) => (s ?? -1) + 1)
    }
  }, [isLastStep, onFinish, handleClose])

  // Fallback a `data` (respuesta de /content): la vista compartida solo trae
  // los IDs de la URL, sin el WorkflowItem completo con nombre/código.
  const documentName =
    editedAsset?.name ?? row?.document_name ?? createdDoc?.name ?? template?.name ?? data?.document_name
  const internalCode = editedAsset?.internalCode ?? row?.internal_code ?? data?.internal_code ?? undefined

  // Cruce lifecycle × RBAC (AND, ver ia context/rbac-audit-guide.md): el lifecycle
  // contesta "¿sos el editor DE ESTE documento?" y RBAC "¿tu rol te permite escribir
  // EN ABSOLUTO?". `lifecycleAllows(undefined, ...) === true` degrada a "solo RBAC
  // decide", que es el comportamiento deseado cuando el asset type no tiene lifecycle.
  const canAnswerForm = canUpdateAssetContent && lifecycleAllows(data?.lifecycle_permissions, "edit")

  // Ciclo de vida del documento (completar/devolver, publicar, archivar, restaurar,
  // asignar versión, re-lanzar publish externo) — mismo controlador que assets-content.tsx.
  const lifecycleExecutionId = executionId ?? data?.execution_id
  const lifecycle = useLifecycleActions({
    documentId,
    executionId: lifecycleExecutionId,
    organizationId: selectedOrganizationId,
    documentTypeId: data?.document_type?.id,
    lifecycleStatus: data?.lifecycle_status,
    lifecyclePermissions: data?.lifecycle_permissions,
    rbac: { canTransition: canUpdateAssetContent },
    extraRefreshKeys: () => [workflowQueryKeys.listBase()],
    // Sin onOpenCustomFields: el panel de workflow no tiene tab de campos
    // personalizados. El diálogo oculta el botón y queda solo con "Cerrar" +
    // la lista de campos (que sigue siendo la información útil).
    canListCustomFields: can("listCustomFields"),
  })

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b p-4 shrink-0",
          isFullscreen && "px-4 py-4 sm:px-8",
        )}
      >
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
              icon={RefreshCw}
              tooltip={tCommon("refresh")}
              loading={isFetching}
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            />
          )}
          {documentId && !needsNameStep && showAssetEdit && canUpdateAssetContent && (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={Edit3}
              tooltip={t("panel.edit")}
              onClick={() => setIsEditSheetOpen(true)}
              className="h-8 w-8 p-0"
            />
          )}
          {showClose && (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={X}
              tooltip={t("panel.close")}
              onClick={handleClose}
              className="h-8 w-8 p-0"
            />
          )}
        </div>
      </div>

      {showLifecycle && data?.lifecycle_status && !needsNameStep && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2 shrink-0 flex-wrap">
          <HuemulLifecycleStageBadge status={data.lifecycle_status} />
          <HuemulLifecycleActions controller={lifecycle} variant="row" showRerunExternalPublish />
        </div>
      )}

      <div className={cn("flex-1 overflow-auto p-4", isFullscreen && "sm:px-8")}>
        <div className={cn(isFullscreen && "mx-auto w-full max-w-3xl")}>
        {isFullscreen && !needsNameStep && documentId && !isLoading && !error && !canAnswerForm && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Eye className="h-4 w-4 shrink-0" />
            {t("fill.readOnlyNotice")}
          </div>
        )}
        {needsNameStep ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">
                {t("expressSheet.welcomeTitle", { template: template?.name })}
              </p>
              <p className="text-xs text-muted-foreground">{t("expressSheet.welcomeDescription")}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workflow-express-name" className="text-xs text-muted-foreground font-normal">
                {t("expressSheet.name")}
                <span className="text-destructive"> *</span>
              </Label>
              <Input
                id="workflow-express-name"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder={template?.name_placeholder ?? t("expressSheet.namePlaceholder")}
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
        ) : step === null || !currentSection ? (
          <WorkflowSectionsSummary sections={formSections} onGoToSection={setStep} />
        ) : (
          <AssetFormSection
            key={currentSection.id}
            ref={formSectionRef}
            sectionExecutionId={currentSection.id}
            formFields={currentSection.form_fields ?? []}
            organizationId={selectedOrganizationId ?? undefined}
            documentId={documentId}
            canInteract={canAnswerForm}
            isEditing={canAnswerForm}
            onExitEditing={goNext}
            reviewStatus={currentSection.review_status as ReviewStatus | null}
            onReviewStatusChange={(status) => handleReviewStatusChange(currentSection.id, status)}
            onUpdate={handleSectionUpdate}
            onSavingChange={setIsFormSaving}
          />
        )}
        </div>
      </div>

      {!needsNameStep && documentId && !isLoading && !error && formSections.length > 0 && step !== null && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-t p-4 shrink-0",
            isFullscreen && "px-4 py-4 sm:px-8",
          )}
        >
          <div className="flex items-center gap-2">
            <HuemulButton
              variant="outline"
              size="sm"
              icon={ListChecks}
              label={t("wizard.summary.tooltip")}
              disabled={isFormSaving}
              onClick={() => setStep(null)}
            />
            {step > 0 && (
              <HuemulButton
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                label={t("wizard.back")}
                disabled={isFormSaving}
                onClick={() => setStep((s) => Math.max(0, (s ?? 1) - 1))}
              />
            )}
          </div>
          <HuemulButton
            size="sm"
            icon={isLastStep ? Check : ChevronRight}
            iconPosition="right"
            label={isLastStep ? t("wizard.finish") : t("wizard.next")}
            disabled={isFormSaving}
            // Sin permiso de escritura el wizard sigue navegable pero no pasa por
            // `exit()`: ese handle guarda los cambios Y marca la sección como
            // 'finished' (PATCH /review_status), dos escrituras que no consultan
            // `canInteract`. En modo lectura se avanza de paso y nada más.
            onClick={() => (canAnswerForm ? formSectionRef.current?.exit() : goNext())}
          />
        </div>
      )}

      {documentId && (
        <WorkflowAssetEditSheet
          open={isEditSheetOpen}
          onOpenChange={setIsEditSheetOpen}
          canSave={canUpdateAssetContent}
          documentId={documentId}
          currentName={documentName ?? ""}
          currentInternalCode={internalCode}
          onUpdated={(newName, newInternalCode) => setEditedAsset({ name: newName, internalCode: newInternalCode })}
        />
      )}

      <HuemulLifecycleDialogs
        controller={lifecycle}
        executionId={lifecycleExecutionId}
        organizationId={selectedOrganizationId}
        existingVersions={data?.executions?.map((e) => e.version).filter((v): v is string => !!v)}
      />
    </div>
  )
}
