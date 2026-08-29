import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, AlertCircle, Loader2, ChevronLeft, ChevronRight, Check, CheckCircle2, Edit3, ListChecks, RefreshCw } from "lucide-react"
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
import { HuemulLifecycleSheets } from "@/huemul/components/huemul-lifecycle-sheets"
import { getDocumentContent } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { lifecycleAllows, lifecycleStageAllowsEditing } from "@/hooks/useDocumentAccess"
import { READ_ONLY_NOTICE_STATES } from "@/lib/lifecycle-access"
import { workflowQueryKeys } from "@/hooks/useWorkflows"
import { useLifecycleActions } from "@/hooks/useLifecycleActions"
import type { AssetContentResponse, ContentSection } from "@/types/assets"
import type { WorkflowRowRef } from "@/types/workflow"
import type { WorkflowTemplateItem, CreateExpressResult } from "@/types/templates"
import type { FormValuesSectionPayload } from "@/types/sections/core"
import type { ReviewStatus } from "@/types/section-execution"
import { applyFormValuesPatch } from "@/components/assets/content/utils/patch-document-content"
import { isSectionAnswerable, isSectionApplicable } from "@/components/workflow/workflow-section-stats"
import {
  useDocumentSectionAccess,
  useInvalidateDocumentSectionAccess,
  canViewSection,
  resolveSectionCanEdit,
} from "@/hooks/useDocumentSectionAccess"

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
  const { t } = useTranslation(["workflow", "sections", "assets"])
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

  // Permiso de sección por ciclo de vida (view/can_edit) — /content no lo trae, se
  // resuelve aparte. Ver "ia context/permisos-seccion-lifecycle-guide.md".
  const sectionAccess = useDocumentSectionAccess(documentId ?? undefined, canReadAsset && !!documentId)
  const invalidateSectionAccess = useInvalidateDocumentSectionAccess()

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
    invalidateSectionAccess(documentId ?? undefined)
  }, [queryClient, documentId, invalidateSectionAccess])

  // Solo secciones form "aplicables" (ver ia context/dependencias-condicionales-formularios-guide.md)
  // y con `view` sobre el permiso de sección del ciclo de vida (sectionAccess, resuelto aparte
  // porque /content no lo trae — ver "ia context/permisos-seccion-lifecycle-guide.md"): el
  // backend ya no devuelve en /content las que quedan sin ninguna pregunta visible, y estos
  // filtros son el espejo cliente que cubre el intervalo hasta el próximo refetch.
  const formSections = React.useMemo(
    () =>
      (data?.content ?? []).filter(
        (s) => s.section_type === "form" && isSectionApplicable(s) && canViewSection(s, sectionAccess),
      ),
    [data, sectionAccess],
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

  // Fallback a `data` (respuesta de /content): la vista compartida solo trae
  // los IDs de la URL, sin el WorkflowItem completo con nombre/código.
  const documentName =
    editedAsset?.name ?? row?.document_name ?? createdDoc?.name ?? template?.name ?? data?.document_name
  const internalCode = editedAsset?.internalCode ?? row?.internal_code ?? data?.internal_code ?? undefined

  // Cruce lifecycle × etapa × RBAC (AND, ver ia context/rbac-audit-guide.md): el
  // lifecycle contesta "¿sos el editor DE ESTE documento?" (rol), la etapa contesta
  // "¿este documento admite respuestas AHORA?" y RBAC "¿tu rol te permite escribir
  // EN ABSOLUTO?". `lifecycle_permissions.edit` es un permiso de ROL, no de etapa:
  // sin el factor de etapa, un aprobador que también es actor de un grupo de
  // elaboración veía los campos habilitados en aprobación y el PATCH no persistía.
  // Los `undefined` degradan a "solo RBAC decide", igual que en /asset.
  const canAnswerForm =
    canUpdateAssetContent &&
    lifecycleAllows(data?.lifecycle_permissions, "edit") &&
    lifecycleStageAllowsEditing(data?.lifecycle_status)

  // Resuelto contra sectionAccess (GET /documents/{id}/sections), no contra
  // currentSection.can_edit (siempre undefined, /content no lo manda — ver
  // resolveSectionCanEdit en src/hooks/useDocumentSectionAccess.ts). `null` = el flag
  // no aplica a esta sección/documento — no degrada a solo lectura por eso solo,
  // `can_answer` en cada form_field sigue siendo la autoridad. isSectionAnswerable
  // cubre el depends_on propio de la sección: con show_when_inactive:true la
  // sección sigue en el wizard (isSectionApplicable la deja pasar) pero inactiva,
  // así que acá también degrada a solo lectura.
  const canAnswerSpecificSection = React.useCallback(
    (section: ContentSection) =>
      canAnswerForm && resolveSectionCanEdit(section, sectionAccess) !== false && isSectionAnswerable(section),
    [canAnswerForm, sectionAccess],
  )

  const canAnswerSection = currentSection ? canAnswerSpecificSection(currentSection) : canAnswerForm

  // Motivo del aviso de solo lectura: distingue "no tenés permiso/rol", "esta etapa ya
  // no admite respuestas", "esta sección está inactiva según las respuestas dadas" y
  // "esta sección es de solo lectura en esta etapa" — evita que el aviso de permiso
  // confunda a alguien que sí puede responder el resto del formulario.
  const readOnlyReason: "permission" | "stage" | "sectionInactive" | "section" | null = canAnswerSection
    ? null
    : !canUpdateAssetContent || !lifecycleAllows(data?.lifecycle_permissions, "edit")
      ? "permission"
      : !lifecycleStageAllowsEditing(data?.lifecycle_status)
        ? "stage"
        : currentSection && !isSectionAnswerable(currentSection)
          ? "sectionInactive"
          : "section"

  // El bloqueo por ciclo de vida viene de lifecycleStageAllowsEditing: stage distinto de
  // `edit` o estado terminal. En el caso terminal el `stage` miente (publish vs published),
  // así que el aviso nombra el `state`; los que no encajan en la frase caen al genérico.
  const stageNotice = React.useMemo(() => {
    const state = data?.lifecycle_status?.state
    if (!state || !READ_ONLY_NOTICE_STATES.has(state)) return t("fill.readOnlyLifecycleNotice")
    return t("fill.readOnlyStateNotice", {
      // En minúscula: el label va embebido en la frase, no como título.
      state: t(`lifecycle.stateLabels.${state}`, { ns: "assets", defaultValue: state }).toLocaleLowerCase(),
    })
  }, [data?.lifecycle_status?.state, t])

  // Se levanta justo antes de abrir el diálogo de "Completar" desde el botón de
  // Finalizar del wizard, para distinguir esa apertura de la del botón "Completar"
  // de HuemulLifecycleActions (mismo `isCheckDialogOpen` compartido) — solo la
  // primera debe volver al resumen del wizard (o disparar `onFinish`) cuando la
  // transición termine.
  const finishAfterCompleteRef = React.useRef(false)

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
    onAfterComplete: () => {
      if (!finishAfterCompleteRef.current) return
      finishAfterCompleteRef.current = false
      if (onFinish) onFinish()
      else setStep(null)
    },
  })

  // AssetFormSection ya validó (required/formato) y guardó antes de llamar esto.
  // Solo se invoca mientras se está respondiendo un paso (step !== null). En el
  // último paso, si el usuario puede avanzar el ciclo de vida, "Finalizar" no
  // resuelve directo: abre el diálogo de confirmación de "Completar" y el paso
  // siguiente (volver al resumen u `onFinish`) queda encadenado a
  // `onAfterComplete` (arriba) para no saltarse esa confirmación.
  const goNext = React.useCallback(() => {
    if (!isLastStep) {
      setStep((s) => (s ?? -1) + 1)
      return
    }
    if (lifecycle.canTransition && lifecycle.status?.can_advance) {
      finishAfterCompleteRef.current = true
      lifecycle.setIsCheckDialogOpen(true)
    } else if (onFinish) {
      onFinish()
    } else {
      handleClose()
    }
  }, [isLastStep, onFinish, handleClose, lifecycle])

  // Solo para el label del botón: si el clic en "Finalizar" va a disparar la
  // confirmación de "Completar" en vez de cerrar directo (misma condición de `goNext`).
  const willAdvanceOnFinish = isLastStep && lifecycle.canTransition && !!lifecycle.status?.can_advance

  // Sin secciones form para este paso/usuario (etapas de revisión/aprobación típicamente):
  // mismo criterio que willAdvanceOnFinish pero sin depender de isLastStep, ya que acá no
  // hay wizard de pasos que recorrer.
  const canAdvanceEmptyStep = lifecycle.canTransition && !!lifecycle.status?.can_advance

  // La fila de ciclo de vida solo existe en el panel de /workflow. Cuando está,
  // el badge de etapa sube bajo el título y la sección actual baja a esa fila;
  // en el link compartido (showLifecycle=false) la sección se queda arriba.
  const showLifecycleRow = showLifecycle && !!data?.lifecycle_status && !needsNameStep

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
          {showLifecycleRow && data?.lifecycle_status ? (
            <div className="mt-1 flex">
              <HuemulLifecycleStageBadge status={data.lifecycle_status} />
            </div>
          ) : (
            currentSection?.section_name && (
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs text-muted-foreground">{currentSection.section_name}</p>
                <HuemulReviewStatusBadge status={currentSection.review_status as ReviewStatus | null} sectionType="form" />
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {documentId && !needsNameStep && (
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
              tooltip={tCommon("close")}
              onClick={handleClose}
              className="h-8 w-8 p-0"
            />
          )}
        </div>
      </div>

      {showLifecycleRow && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2 shrink-0 flex-wrap">
          {currentSection?.section_name ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-xs text-muted-foreground">{currentSection.section_name}</p>
              <HuemulReviewStatusBadge status={currentSection.review_status as ReviewStatus | null} sectionType="form" />
            </div>
          ) : (
            <div />
          )}
          <HuemulLifecycleActions
            controller={lifecycle}
            variant="row"
            showRerunExternalPublish
            hideComplete={willAdvanceOnFinish || (step !== null && !canAnswerSection)}
          />
        </div>
      )}

      <div className={cn("flex-1 overflow-auto p-4", isFullscreen && "sm:px-8")}>
        <div className={cn(isFullscreen && "mx-auto w-full max-w-3xl")}>
        {!needsNameStep && documentId && !isLoading && !error && formSections.length > 0 && readOnlyReason && (
          <div className="mb-4 flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {readOnlyReason === "stage"
              ? stageNotice
              : readOnlyReason === "sectionInactive"
                ? t("fill.readOnlyInactiveSectionNotice")
                : readOnlyReason === "section"
                  ? t("fill.readOnlySectionNotice")
                  : t("fill.readOnlyNotice")}
          </div>
        )}
        {needsNameStep ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">
                {t("expressSheet.welcomeTitle")}
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
              label={tCommon("next")}
              loading={isCreating}
              disabled={nameValue.trim().length === 0}
              onClick={handleCreateWithName}
              className="self-end"
            />
          </div>
        ) : !documentId || isLoading || sectionAccess.isLoading || isCreating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t("panel.loadError")}
          </div>
        ) : formSections.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{t("wizard.emptyStep.title")}</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {canAdvanceEmptyStep ? t("wizard.emptyStep.advanceDescription") : t("wizard.emptyStep.waitingDescription")}
            </p>
            {canAdvanceEmptyStep && (
              <HuemulButton
                size="sm"
                icon={Check}
                iconPosition="left"
                label={lifecycle.completeLabel}
                tooltip={lifecycle.completeTooltip}
                loading={lifecycle.checkMutation.isPending}
                onClick={() => {
                  finishAfterCompleteRef.current = true
                  lifecycle.setIsCheckDialogOpen(true)
                }}
                className="mt-2"
              />
            )}
          </div>
        ) : step === null || !currentSection ? (
          <WorkflowSectionsSummary sections={formSections} onGoToSection={setStep} canGoToSection={canAnswerSpecificSection} />
        ) : (
          <AssetFormSection
            key={currentSection.id}
            ref={formSectionRef}
            sectionExecutionId={currentSection.id}
            formFields={currentSection.form_fields ?? []}
            organizationId={selectedOrganizationId ?? undefined}
            documentId={documentId}
            canInteract={canAnswerSection}
            isEditing={canAnswerSection}
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
            label={
              isLastStep
                ? willAdvanceOnFinish
                  ? lifecycle.completeLabel
                  : t("wizard.finish")
                : tCommon("next")
            }
            disabled={isFormSaving}
            // Sin permiso de escritura (documento, etapa o esta sección puntual) el
            // wizard sigue navegable pero no pasa por `exit()`: ese handle guarda los
            // cambios Y marca la sección como 'finished' (PATCH /review_status), dos
            // escrituras que no consultan `canInteract`. En modo lectura se avanza de
            // paso y nada más.
            onClick={() => (canAnswerSection ? formSectionRef.current?.exit() : goNext())}
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

      <HuemulLifecycleSheets
        controller={lifecycle}
        executionId={lifecycleExecutionId}
        organizationId={selectedOrganizationId}
        existingVersions={data?.executions?.map((e) => e.version).filter((v): v is string => !!v)}
      />
    </div>
  )
}
