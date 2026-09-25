import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Check, ChevronRight, File } from "lucide-react"
import { cn } from "@/lib/utils"
import { type AssetFormSectionHandle } from "@/components/assets/content/asset-form-section"
import { WorkflowAssetEditSheet } from "@/components/workflow/workflow-asset-edit-sheet"
import { MediaListSheet } from "@/components/ui/media-list-sheet"
import { WorkflowPanelHeader } from "@/components/workflow/workflow-panel-header"
import { WorkflowPanelLifecycleRow } from "@/components/workflow/workflow-panel-lifecycle-row"
import { WorkflowReadOnlyBanner, type WorkflowReadOnlyBannerReason } from "@/components/workflow/workflow-read-only-banner"
import { WorkflowExpressNameForm } from "@/components/workflow/workflow-express-name-form"
import { WorkflowSummarySkeleton } from "@/components/workflow/workflow-summary-skeleton"
import { WorkflowPanelError } from "@/components/workflow/workflow-panel-error"
import { WorkflowEmptyStepNotice } from "@/components/workflow/workflow-empty-step-notice"
import { WorkflowSectionsSummary } from "@/components/workflow/workflow-sections-summary"
import { WorkflowSectionView } from "@/components/workflow/workflow-section-view"
import { WorkflowSectionFooter } from "@/components/workflow/workflow-section-footer"
import { WorkflowFinishedCard } from "@/components/workflow/workflow-finished-card"
import { HuemulLifecycleSheets } from "@/huemul/components/huemul-lifecycle-sheets"
import { getDocumentContent } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useOrgPath } from "@/hooks/useOrgRouter"
import { buildExecutionSharePath } from "@/lib/workflow-share-url"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { isExternalElaborationLocked, EXTERNAL_ELABORATION_POLL_MS } from "@/lib/lifecycle-access"
import { workflowQueryKeys } from "@/hooks/useWorkflows"
import { invalidateExecutionLifecycleSteps } from "@/hooks/useLifecycle"
import { useMarkSectionViewed } from "@/hooks/useMarkSectionViewed"
import type { AssetContentResponse } from "@/types/assets"
import type { WorkflowRowRef } from "@/types/workflow"
import type { WorkflowTemplateItem, CreateExpressResult } from "@/types/templates"
import type { FormValuesSectionPayload } from "@/types/sections/core"
import { applyFormValuesPatch } from "@/components/assets/content/utils/patch-document-content"
import { isSectionApplicable } from "@/components/workflow/workflow-section-stats"
import { useWorkflowPanelView } from "@/components/workflow/hooks/useWorkflowPanelView"
import { useWorkflowPanelGating } from "@/components/workflow/hooks/useWorkflowPanelGating"
import {
  useDocumentSectionAccess,
  useInvalidateDocumentSectionAccess,
  canViewSection,
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
  /** Muestra «Abrir en Activos» (navega a /asset/:id). Default true; la vista fullscreen compartida lo oculta. */
  showOpenAsset?: boolean
  /** Oculta el badge y las acciones de ciclo de vida. Default true. */
  showLifecycle?: boolean
  /**
   * Muestra el botón "Continuar más tarde" junto a las acciones de ciclo de
   * vida, en cualquier etapa del ciclo de vida en la que al usuario le quede
   * algo por hacer (responder, avanzar o publicar) — se oculta solo cuando
   * `finishOutcome` dice que ya no queda nada (ver más abajo).
   * Puramente visual: no dispara guardado ni transición — el autoguardado ya
   * persiste todo. Solo lo pasa la vista fullscreen compartida.
   */
  onContinueLater?: () => void
  /**
   * "Iniciar otro activo" en la tarjeta terminal (ver `finishOutcome` más
   * abajo — se muestra en el mismo sitio que el resumen de secciones/bloque
   * de "paso vacío" cuando el estado del documento no le deja al usuario
   * nada más por hacer). La navegación la resuelve la página (arma la URL del
   * link de template); ausente cuando la página no pudo resolver ningún
   * origen (ver `onDocumentOrigin`). Solo la pasa la vista fullscreen.
   */
  onStartAnother?: () => void
  /**
   * Notifica el origen real del documento (`document_type_id` + `template_id`,
   * de `/content`) en cuanto está disponible — no depende de cómo se llegó a
   * esta vista (template redirigido con `dt`/`tpl` en la URL, o un link de
   * ejecución directa que nunca los tuvo, ver `buildExecutionShareUrl`). La
   * página lo usa para resolver `onStartAnother` con datos confiables incluso
   * cuando entró por ese segundo camino. Solo la pasa la vista fullscreen.
   */
  onDocumentOrigin?: (documentTypeId: string, templateId: string) => void
}

/**
 * Panel derecho del detalle de workflow: dos vistas internas — resumen de solo lectura con
 * todas las secciones form del documento (por defecto al abrir), y una vista por sección para
 * responder/ver (ver workflow-sections-summary.tsx / workflow-section-view.tsx). Cubre dos
 * orígenes:
 * - `row`: fila ya existente en la tabla → se edita el documento/ejecución tal cual, abre en
 *   el resumen.
 * - `template`: tarjeta "Iniciar" → crea el documento express (pidiendo nombre acá mismo si el
 *   template lo requiere) y entra directo a la primera sección (el resumen de un documento
 *   recién creado es una lista de tarjetas todas vacías).
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
  showOpenAsset = true,
  showLifecycle = true,
  onContinueLater,
  onStartAnother,
  onDocumentOrigin,
}: WorkflowDetailPanelProps) {
  const isFullscreen = variant === "fullscreen"
  const { t } = useTranslation(["workflow", "sections", "assets"])
  const { t: tCommon } = useTranslation("common")
  const { selectedOrganizationId } = useOrganization()
  const { can } = usePageAccess("workflow")
  const { can: canMedia } = usePageAccess("media")
  const { isOrgAdmin, hasPermission } = useUserPermissions()
  const queryClient = useQueryClient()
  const buildPath = useOrgPath()

  // Eje RBAC del panel (grueso, `asset:*` — mismo criterio que useAssetContentPermissions).
  const canReadAsset = can("readAsset")
  const canUpdateAssetContent = can("updateAssetContent")
  // Recurso propio sin feature en RBAC_PAGES (mismo criterio que assets-content.tsx)
  // — gatea la query que decide si se ofrece el botón de re-lanzar publicación externa.
  const canReadExternalPublishConfig = isOrgAdmin || hasPermission("lifecycle_external_publish_action:l")

  const [isFormSaving, setIsFormSaving] = React.useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
  const [isMediaSheetOpen, setIsMediaSheetOpen] = React.useState(false)
  const [editedAsset, setEditedAsset] = React.useState<{ name: string; internalCode?: string } | null>(null)
  // Expansión por sección del resumen — vive acá (no en WorkflowSectionsSummary) para
  // sobrevivir el ir-y-volver a la vista 2, que desmonta el resumen. Vacío = todas
  // colapsadas (default al entrar al panel).
  const [expandedSectionIds, setExpandedSectionIds] = React.useState<Set<string>>(() => new Set())
  const formSectionRef = React.useRef<AssetFormSectionHandle>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

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
  // Bloquea el resto del panel hasta que se envíe el nombre (solo templates nuevos que lo exigen).
  const needsNameStep = !row && !!template && nameRequired && !createdDoc

  // Resetea el override optimista de nombre/código cada vez que cambia el origen (otra fila u
  // otro template). La vista (resumen/sección) se resetea aparte, dentro de useWorkflowPanelView.
  React.useEffect(() => {
    setEditedAsset(null)
    setExpandedSectionIds(new Set())
  }, [row?.execution_id, template?.id])

  const handleCreateWithName = React.useCallback(
    (name: string, description?: string) => {
      if (!can("createExpressAsset")) return
      onSubmitName?.(name, description)
    },
    [can, onSubmitName],
  )

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["document-content", documentId, executionId],
    queryFn: () =>
      getDocumentContent(documentId ?? "", selectedOrganizationId ?? "", executionId) as Promise<
        AssetContentResponse["data"]
      >,
    enabled: !!selectedOrganizationId && !!documentId && canReadAsset,
    staleTime: 60 * 1000,
    retry: 0,
    // Mientras haya un ElaborationRun bloqueando la execution, el callback del sistema
    // externo llega en background sin acción del usuario — se poll-ea para que el
    // wizard se desbloquee solo. Ver assets-content.tsx, misma regla.
    refetchInterval: (query) => {
      // Corta el poll si el último fetch falló — si no, un `data` stale que
      // todavía dice "bloqueado" lo mantiene sondeando para siempre contra
      // un endpoint que sigue devolviendo error.
      if (query.state.status === "error") return false
      return isExternalElaborationLocked((query.state.data as AssetContentResponse["data"] | undefined)?.lifecycle_status)
        ? EXTERNAL_ELABORATION_POLL_MS
        : false
    },
  })

  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["document-content", documentId] })
    invalidateSectionAccess(documentId ?? undefined)
    // Steps de ciclo de vida filtrados por `depends_on` de esta ejecución
    // (panel "N de M" del sheet de Completar) — ver patch-document-content.ts.
    invalidateExecutionLifecycleSteps(queryClient)
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
  const hasAnyFormSection = React.useMemo(
    () => (data?.content ?? []).some((s) => s.section_type === "form"),
    [data],
  )

  // Todos los campos del documento (no solo de formSections): el target de un depends_on de
  // sección puede vivir en una sección filtrada. Solo para redactar el aviso de sección inactiva.
  const allFormFields = React.useMemo(
    () => (data?.content ?? []).flatMap((s) => s.form_fields ?? []),
    [data],
  )

  const {
    view,
    activeSectionIndex,
    activeSection,
    isFirstSection,
    isLastSection,
    openSection,
    goToSummary,
    goNextSection,
    goPrevSection,
  } = useWorkflowPanelView({
    formSections,
    resetKey: row?.execution_id ?? template?.id,
    startInSection: !row,
  })

  // Entrar a una sección (tarjeta, píldora, Anterior/Siguiente, "Ir a la sección", express) =
  // "la vio": el backend lo necesita para completar secciones sin preguntas obligatorias.
  const markSectionViewed = useMarkSectionViewed(documentId ?? undefined)
  React.useEffect(() => {
    if (view === "section") markSectionViewed(activeSection)
  }, [view, activeSection, markSectionViewed])

  // Autoguardado (PATCH /form_values): parchea en el caché solo la sección devuelta,
  // sin refetch de /content — mismo patrón que assets-content.tsx. También refresca
  // section_name si vino no-null, para que el header quede al día.
  const handleSectionUpdate = React.useCallback(
    (payload?: FormValuesSectionPayload[]) => {
      if (!payload?.length || !documentId) return
      applyFormValuesPatch(queryClient, documentId, payload)
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
  const lifecycleExecutionId = executionId ?? data?.execution_id

  const gating = useWorkflowPanelGating({
    isFullscreen,
    showLifecycle,
    documentId,
    lifecycleExecutionId,
    organizationId: selectedOrganizationId,
    needsNameStep,
    isLoading,
    isSectionAccessLoading: sectionAccess.isLoading,
    error,
    data,
    sectionAccess,
    formSections,
    activeSection,
    isSectionView: view === "section",
    isLastSection,
    canUpdateAssetContent,
    canListCustomFields: can("listCustomFields"),
    canReadExternalPublishConfig,
    documentName,
    template,
    openSection,
    goToSummary,
  })

  // Notifica el origen REAL del documento en cuanto /content lo trae — a
  // diferencia de los query params `dt`/`tpl` que arma `anchorCreatedDocument`,
  // esto funciona también cuando se entró por un link de EJECUCIÓN directa
  // (buildExecutionShareUrl), que nunca los tuvo: el documento igual sabe de
  // qué template salió. Sin este aviso, "Iniciar otro activo" quedaba sin
  // datos y nunca se ofrecía por ese camino.
  React.useEffect(() => {
    const documentTypeId = data?.document_type?.id
    const templateId = data?.template_id
    if (!documentTypeId || !templateId) return
    onDocumentOrigin?.(documentTypeId, templateId)
  }, [data?.document_type?.id, data?.template_id, onDocumentOrigin])

  // "Ver mis respuestas" / "Ver las respuestas": UN SOLO flag para la tarjeta terminal y para
  // el aviso de solo lectura. Se resetea cuando CAMBIA el motivo por el que se ofreció.
  const [viewingAnswers, setViewingAnswers] = React.useState(false)
  React.useEffect(() => {
    setViewingAnswers(false)
  }, [gating.finishOutcome, gating.isWaitingForOthers])

  // El aviso REEMPLAZA al resumen, nunca a la vista de sección: quien ya estaba respondiendo
  // se queda ahí en solo lectura con su banner ámbar.
  const showEmptyStepNotice =
    formSections.length === 0 ||
    (gating.isWaitingForOthers && (view !== "section" || !activeSection) && !viewingAnswers)

  const emptyStepViewAnswersConfig =
    showEmptyStepNotice && formSections.length > 0
      ? {
          label: t("wizard.emptyStep.viewAnswers"),
          onClick: () => {
            setViewingAnswers(true)
            goToSummary()
          },
        }
      : null

  // Cuerpo del wizard "sin secciones" — distingue "existen pero quedaron filtradas para este
  // usuario/etapa" (aviso de siempre) de "el workflow directamente no tiene formularios" (nuevo).
  const showNoFormsNotice = formSections.length === 0 && !hasAnyFormSection

  // Botón "Siguiente ▸" de la vista 2: única puerta que valida obligatorias/formato y hace el
  // flush final (AssetFormSectionHandle.exit → PATCH /form_values). «◂ Anterior» y las píldoras
  // NO pasan por acá — retroceder no debe quedar bloqueado por un toast de obligatorias.
  const handleLeaveSectionForward = React.useCallback(() => {
    if (!isLastSection) {
      goNextSection()
      return
    }
    if (gating.lifecycle.canTransition && gating.lifecycle.status?.can_advance) {
      gating.finishAfterCompleteRef.current = true
      gating.lifecycle.setIsCheckDialogOpen(true)
    } else {
      goToSummary()
    }
  }, [isLastSection, goNextSection, gating.lifecycle, gating.finishAfterCompleteRef, goToSummary])

  // Abre el mismo activo en /asset, en la ejecución que se está trabajando, en una pestaña nueva:
  // el workflow queda intacto (fila seleccionada, scroll, sección abierta).
  const handleOpenAsset = React.useCallback(() => {
    if (!documentId) return
    window.open(
      buildPath(`/asset/${documentId}${executionId ? `?execution=${encodeURIComponent(executionId)}` : ""}`),
      "_blank",
      "noopener,noreferrer",
    )
  }, [buildPath, documentId, executionId])

  // Abre la vista a pantalla completa de esta ejecución (la del link compartido) en pestaña nueva.
  const handleOpenFullscreen = React.useCallback(() => {
    if (!documentId) return
    window.open(buildPath(buildExecutionSharePath(documentId, executionId)), "_blank", "noopener,noreferrer")
  }, [buildPath, documentId, executionId])

  const handleToggleSection = React.useCallback((sectionId: string, open: boolean) => {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      if (open) next.add(sectionId)
      else next.delete(sectionId)
      return next
    })
  }, [])
  const handleCollapseAll = React.useCallback(() => {
    setExpandedSectionIds(new Set())
  }, [])
  const handleExpandAll = React.useCallback((sectionIds: string[]) => {
    setExpandedSectionIds(new Set(sectionIds))
  }, [])

  const showTerminalCard = !!gating.finishOutcome && gating.isFinished && !viewingAnswers

  const showBanner =
    !needsNameStep &&
    !!documentId &&
    !isLoading &&
    !error &&
    formSections.length > 0 &&
    (gating.readOnlyReason || (gating.isWaitingForOthers && viewingAnswers)) &&
    (!gating.isFinished || viewingAnswers)
  const bannerMessage = showBanner
    ? gating.readOnlyReason
      ? gating.readOnlyMessage
      : t("wizard.emptyStep.waitingDescription")
    : null
  // Sin readOnlyReason el aviso es el de "esperando a otro rol" (ver showBanner).
  const bannerReason: WorkflowReadOnlyBannerReason = gating.readOnlyReason ?? "waiting"

  const mediaUploadTarget = lifecycleExecutionId
    ? { level: "execution" as const, parentId: lifecycleExecutionId }
    : documentId
      ? { level: "document" as const, parentId: documentId }
      : null

  const showFooter =
    !needsNameStep &&
    !!documentId &&
    !isLoading &&
    !error &&
    formSections.length > 0 &&
    view === "section" &&
    !!activeSection &&
    !showEmptyStepNotice &&
    !showTerminalCard

  // Espejo del orden de la cascada de abajo (:421-493) — solo para decidir el padding del
  // contenedor scrollable: resumen/skeleton/error traen su propio padding (14px 16px 18px),
  // las demás ramas (vista de sección, tarjeta terminal, aviso de paso vacío, formulario
  // express) conservan el p-4 de siempre.
  const isSummaryBranch =
    !needsNameStep &&
    (!documentId || isLoading || sectionAccess.isLoading || isCreating
      ? true
      : error
        ? true
        : showTerminalCard && !!gating.finishOutcome
          ? false
          : showEmptyStepNotice
            ? false
            : view === "summary" || !activeSection)

  // Vista de una sección: fondo blanco y padding propio (18px 22px 22px, ver WorkflowSectionView) —
  // se trabaja sobre campos, no sobre tarjetas. Espejo de la misma cascada que isSummaryBranch.
  const isSectionBranch =
    !needsNameStep &&
    !isSummaryBranch &&
    !(showTerminalCard && !!gating.finishOutcome) &&
    !showEmptyStepNotice

  // Fullscreen: la tarjeta terminal y el aviso de paso vacío traen su propio padding
  // (WorkflowStatusCard) — el contenedor va en p-0, igual que resumen/sección. En el panel lateral
  // el aviso de paso vacío conserva su superficie con el p-4 de siempre.
  const isStatusBranch = isFullscreen && !needsNameStep && !isSummaryBranch && !isSectionBranch

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [view, activeSectionIndex])

  return (
    <div className="flex h-full flex-col bg-surface-sunken">
      <WorkflowPanelHeader
        documentName={documentName}
        internalCode={internalCode}
        templateName={data?.template_name}
        isFullscreen={isFullscreen}
        createdBy={data?.created_by_user}
        updatedBy={data?.updated_by_user}
        lastModifiedAt={row?.last_modified_at}
        documentId={documentId}
        needsNameStep={needsNameStep}
        isFetching={isFetching}
        onRefresh={handleRefresh}
        canViewMedia={canMedia("listMedia")}
        onOpenMedia={() => setIsMediaSheetOpen(true)}
        showOpenAsset={showOpenAsset && canReadAsset}
        onOpenAsset={handleOpenAsset}
        showOpenFullscreen={!isFullscreen && canReadAsset}
        onOpenFullscreen={handleOpenFullscreen}
        showAssetEdit={showAssetEdit}
        canEdit={canUpdateAssetContent}
        onOpenEdit={() => setIsEditSheetOpen(true)}
        showClose={showClose}
        onClose={handleClose}
      />

      {gating.showLifecycleRow && (
        <WorkflowPanelLifecycleRow
          isFullscreen={isFullscreen}
          lifecycle={gating.lifecycle}
          hideComplete={gating.hideComplete}
          isFinished={gating.isFinished}
          onContinueLater={onContinueLater}
          showStageBadge={gating.showStageBadge}
          lifecycleStatus={data?.lifecycle_status}
        />
      )}

      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-auto",
          isSectionBranch ? "bg-background" : "bg-[#f8fafc]",
          isSummaryBranch || isSectionBranch || isStatusBranch ? "p-0" : "p-4",
          isFullscreen && "sm:px-8",
        )}
      >
        <div className={cn(isFullscreen && "mx-auto w-full max-w-3xl")}>
          {/* Mismo gutter horizontal que el contenido de la rama (resumen 16px, sección 22px); en las
              ramas p-4 el contenedor ya da el padding y solo hace falta la separación de abajo. */}
          {/* En la vista de sección el aviso lo ubica WorkflowSectionView, entre el navegador de
              secciones y el nombre de la sección (ver bannerMessage más abajo). */}
          {bannerMessage && !isSectionBranch && (
            <div className={isSummaryBranch || isStatusBranch ? "px-4 pt-[14px]" : "mb-4"}>
              <WorkflowReadOnlyBanner message={bannerMessage} reason={bannerReason} />
            </div>
          )}
          {needsNameStep ? (
            <WorkflowExpressNameForm
              key={template?.id}
              namePlaceholder={template?.name_placeholder ?? undefined}
              isCreating={isCreating}
              onSubmit={handleCreateWithName}
            />
          ) : !documentId || isLoading || sectionAccess.isLoading || isCreating ? (
            <WorkflowSummarySkeleton />
          ) : error ? (
            <WorkflowPanelError onRetry={handleRefresh} />
          ) : showTerminalCard && gating.finishOutcome ? (
            <WorkflowFinishedCard
              outcome={gating.finishOutcome}
              workflowName={gating.workflowName}
              // Se oculta si no hay ninguna sección visible ahora mismo (nada a lo que volver)
              // o el documento está archivado (ver sus respuestas ya no es una acción disponible).
              onViewAnswers={
                gating.finishOutcome !== "archived" && formSections.length > 0
                  ? () => {
                      setViewingAnswers(true)
                      goToSummary()
                    }
                  : undefined
              }
              onStartAnother={onStartAnother}
            />
          ) : showEmptyStepNotice ? (
            showNoFormsNotice ? (
              <WorkflowEmptyStepNotice
                isFullscreen={isFullscreen}
                tone="gray"
                icon={File}
                title={t("summary.empty.title")}
                description={t("summary.empty.description")}
              />
            ) : (
              <WorkflowEmptyStepNotice
                isFullscreen={isFullscreen}
                tone={gating.emptyStepTone}
                icon={gating.emptyStepIcon}
                title={t(gating.emptyStepTitleKey)}
                description={t(gating.emptyStepDescriptionKey)}
                primaryAction={gating.emptyStepButtonConfig}
                viewAnswersAction={emptyStepViewAnswersConfig}
              />
            )
          ) : view === "summary" || !activeSection ? (
            <WorkflowSectionsSummary
              sections={formSections}
              totalSections={data?.content?.length ?? 0}
              sectionCanAnswer={gating.canAnswerSpecificSection}
              onOpenSection={openSection}
              expandedSectionIds={expandedSectionIds}
              onToggleSection={handleToggleSection}
              onCollapseAll={handleCollapseAll}
              onExpandAll={handleExpandAll}
            />
          ) : (
            <WorkflowSectionView
              ref={formSectionRef}
              section={activeSection}
              sections={formSections}
              allFields={allFormFields}
              activeIndex={activeSectionIndex}
              onSelectSection={openSection}
              sectionCanAnswer={gating.canAnswerSpecificSection}
              onBackToSummary={goToSummary}
              navDisabled={isFormSaving}
              organizationId={selectedOrganizationId ?? undefined}
              documentId={documentId}
              mediaUploadTarget={mediaUploadTarget}
              canInteract={gating.canAnswerSection}
              onExitEditing={handleLeaveSectionForward}
              onUpdate={handleSectionUpdate}
              onSavingChange={setIsFormSaving}
              bannerMessage={bannerMessage}
              bannerReason={bannerReason}
            />
          )}
        </div>
      </div>

      {showFooter && (
        <WorkflowSectionFooter
          showPrev={!isFirstSection}
          navDisabled={isFormSaving}
          onPrev={goPrevSection}
          currentIndex={activeSectionIndex}
          totalSections={formSections.length}
          primaryLabel={
            isLastSection
              ? gating.willAdvanceOnFinish
                ? gating.lifecycle.completeLabel
                : t("summary.backLabel")
              : tCommon("next")
          }
          primaryIcon={isLastSection ? Check : ChevronRight}
          primaryDisabled={isFormSaving || gating.isBlockedLastSection}
          primaryTooltip={gating.isBlockedLastSection ? gating.lifecycle.advanceBlockersTooltip : undefined}
          // Sin permiso de escritura (documento, etapa o esta sección puntual) la vista sigue
          // navegable pero no pasa por exit(): ese handle guarda y valida, dos escrituras que
          // no consultan canInteract. En modo lectura se avanza de sección y nada más.
          onPrimaryClick={() => (gating.canAnswerSection ? formSectionRef.current?.exit() : handleLeaveSectionForward())}
        />
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

      {documentId && (
        <MediaListSheet
          open={isMediaSheetOpen}
          onOpenChange={setIsMediaSheetOpen}
          organizationId={selectedOrganizationId ?? ''}
          level={executionId ? 'execution' : 'document'}
          parentId={executionId || documentId}
          parentLabel={documentName ?? undefined}
          documentId={documentId}
          documentLabel={documentName ?? undefined}
          allExecutions={data?.executions ?? []}
          canCreate={canMedia('createMedia')}
          canUpdate={canMedia('updateMedia')}
          canDelete={canMedia('deleteMedia')}
        />
      )}

      <HuemulLifecycleSheets
        controller={gating.lifecycle}
        executionId={lifecycleExecutionId}
        organizationId={selectedOrganizationId}
        existingVersions={data?.executions?.map((e) => e.version).filter((v): v is string => !!v)}
      />
    </div>
  )
}
