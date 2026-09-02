"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Loader2, RotateCcw, AlertCircle } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useWorkflowTemplates, useCreateTemplateExpress } from "@/hooks/useWorkflowTemplates"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { WorkflowDetailPanel, WorkflowSavedLaterCard } from "@/components/workflow"
import { cn } from "@/lib/utils"
import { WORKFLOW_SHARE_EXECUTION_PATH, WORKFLOW_SHARE_TEMPLATE_PATH } from "@/lib/workflow-share-url"
import type { WorkflowTemplateItem } from "@/types/templates"
import type { WorkflowRowRef } from "@/types/workflow"

type ShareMode = "template" | "execution"

/**
 * Vista compartida a pantalla completa (ver ia context/fullscreen-share-route-guide.md).
 * Se llega acá SOLO por un link generado desde /workflow ("Compartir"), nunca por
 * navegación normal. AppLayout la monta en su modo "bare" (sin header/nav) pero
 * con los mismos providers — ver app-layout.tsx.
 *
 * Reutiliza WorkflowDetailPanel completo (wizard, resumen de secciones, badge y
 * acciones de ciclo de vida según permiso): al terminar el último paso el panel
 * vuelve solo al resumen de secciones con el documento en su nuevo estado, igual
 * que la columna derecha de /workflow. Cuando el estado del documento no le deja
 * al usuario nada más por hacer, el propio panel muestra ahí mismo (dentro de su
 * área de contenido, no como pantalla aparte) la tarjeta terminal
 * `WorkflowFinishedCard` — ver ia context/fullscreen-share-route-guide.md §4. Esta
 * página resuelve la navegación de "Iniciar otro activo" (`onStartAnother`) y
 * recibe del panel el origen real del documento (`onDocumentOrigin`) para que
 * también funcione en un link de ejecución directa, que nunca trae `dt`/`tpl`
 * en la URL.
 *
 * Dos modos según la ruta (ver workflow-share-url.ts):
 * - "template" (:documentTypeId/:templateId): cada persona que abre el link crea
 *   SU propio documento express y responde su copia. Apenas se crea, la página
 *   REDIRIGE (replace) a la ruta "execution" de abajo — la identidad del
 *   documento pasa a vivir en la URL, así un refresh nunca vuelve a crear otro.
 * - "execution" (:documentId, con o sin :executionId): responde un documento ya
 *   existente. Sin executionId (destino de la redirección de arriba) se resuelve
 *   la ejecución por defecto — mismo camino que un express recién creado.
 */
export default function WorkflowFillPage() {
  const { t } = useTranslation(["workflow", "common"])
  const params = useParams<{
    documentTypeId?: string
    templateId?: string
    documentId?: string
    executionId?: string
  }>()
  const [searchParams] = useSearchParams()
  const navigate = useOrgNavigate()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess("workflow")

  const mode: ShareMode = params.templateId ? "template" : "execution"

  // Distinto de un `error` de la query de contenido (eso ya lo maneja el propio
  // panel): esto es "el POST .../express falló" — sin esto, el usuario se queda
  // en el spinner de carga del panel sin ningún mensaje.
  const [autoCreateError, setAutoCreateError] = useState(false)
  // El efecto de auto-arranque de abajo no depende de nada que cambie al
  // reintentar (mismo template): sin este contador en sus deps, "Reintentar"
  // limpiaría el error pero nunca volvería a llamar al mutate.
  const [retryToken, setRetryToken] = useState(0)
  // Estado del botón "Continuar más tarde" (ver workflow-detail-panel.tsx
  // onContinueLater): puramente visual, no dispara ningún guardado. El panel
  // se oculta con `hidden` en vez de desmontarse para que "Seguir completando"
  // vuelva exactamente al mismo paso del wizard.
  const [savedForLater, setSavedForLater] = useState(false)
  // Origen REAL del documento (document_type_id + template_id), notificado por
  // el panel en cuanto /content los trae (ver onDocumentOrigin en
  // workflow-detail-panel.tsx) — a diferencia de los params/query params de
  // abajo, funciona también en un link de EJECUCIÓN directa
  // (buildExecutionShareUrl), que nunca tiene `dt`/`tpl`. Identidad estable del
  // callback: evita reevaluar el efecto del panel en cada render de esta página.
  const [resolvedOrigin, setResolvedOrigin] = useState<{ documentTypeId: string; templateId: string } | null>(null)
  const handleDocumentOrigin = useCallback((documentTypeId: string, templateId: string) => {
    setResolvedOrigin((prev) =>
      prev?.documentTypeId === documentTypeId && prev?.templateId === templateId
        ? prev
        : { documentTypeId, templateId },
    )
  }, [])
  const autoStartedRef = useRef(false)

  // Se resetea al cambiar de documento/template en esta misma página (p.ej. al
  // volver del link de template original tras "Iniciar otro activo", ver
  // handleStartAnother más abajo) — sin esto autoStartedRef seguiría en `true`
  // de la iteración anterior y el auto-arranque del nuevo express nunca dispararía.
  useEffect(() => {
    autoStartedRef.current = false
    setSavedForLater(false)
    setResolvedOrigin(null)
    setAutoCreateError(false)
  }, [params.templateId, params.documentId])

  // Igual que canCreateExpress en pages/workflow.tsx: crear un express exige
  // asset:c. template:l|r solo habilita resolver el nombre/require_name_on_express
  // real desde GET /templates/ — sin ese permiso se usa un template "de respaldo"
  // armado con los IDs de la URL (ver `fallbackTemplate` abajo).
  const canCreateExpress = can("createExpressAsset")
  const canListTemplates = can("listTemplates")

  const createExpress = useCreateTemplateExpress(selectedOrganizationId ?? "")

  const templatesEnabled =
    mode === "template" && canListTemplates && !!selectedOrganizationId && !!organizationToken
  const { data: templatesResponse, isLoading: isLoadingTemplates } = useWorkflowTemplates(
    selectedOrganizationId ?? "",
    { enabled: templatesEnabled },
  )

  const resolvedTemplate = useMemo(
    () => templatesResponse?.items.find((item) => item.id === params.templateId),
    [templatesResponse, params.templateId],
  )

  // Sin template:l|r (o el template no aparece en la lista curada por otra razón)
  // se arma un template mínimo con los IDs de la URL, forzando SIEMPRE el paso de
  // nombre — es el camino seguro cuando no se pudo confirmar require_name_on_express.
  const fallbackTemplate: WorkflowTemplateItem | null =
    mode === "template" && params.documentTypeId && params.templateId
      ? {
          id: params.templateId,
          document_type_id: params.documentTypeId,
          name: t("fill.templateFallbackName"),
          require_name_on_express: true,
        }
      : null

  const stillResolvingTemplate = templatesEnabled && isLoadingTemplates && !resolvedTemplate
  const template =
    mode === "template" ? (stillResolvingTemplate ? null : (resolvedTemplate ?? fallbackTemplate)) : null

  // Ancla el documento recién creado en la URL: reemplaza la ruta de template por
  // la de ejecución (sin executionId, ver App.tsx) para que un refresh posterior
  // ya no pase por ninguna lógica de creación. Los IDs del template de origen
  // viajan como query params (sobreviven al refresh) para que "Iniciar otro
  // activo" (ver handleStartAnother) sepa a qué template volver.
  const anchorCreatedDocument = useCallback(
    (documentId: string, documentTypeId: string, templateId: string) => {
      navigate(`/${WORKFLOW_SHARE_EXECUTION_PATH}/${documentId}?dt=${documentTypeId}&tpl=${templateId}`, {
        replace: true,
      })
    },
    [navigate],
  )

  // Origen del template, en orden de confianza: 1) el real (resolvedOrigin, una
  // vez que /content respondió — cubre TAMBIÉN el link de ejecución directa),
  // 2) los params de la ruta (recién llegado por el link de template), 3) los
  // query params que dejó anchorCreatedDocument (ya redirigido, /content
  // todavía no respondió). Sin ninguno de los tres no hay a dónde volver y
  // "Iniciar otro activo" no se muestra — solo puede pasar mientras /content
  // sigue cargando.
  const originDocumentTypeId =
    resolvedOrigin?.documentTypeId ?? params.documentTypeId ?? searchParams.get("dt") ?? undefined
  const originTemplateId = resolvedOrigin?.templateId ?? params.templateId ?? searchParams.get("tpl") ?? undefined
  const canStartAnother = !!originDocumentTypeId && !!originTemplateId

  const handleStartAnother = useCallback(() => {
    if (!originDocumentTypeId || !originTemplateId) return
    navigate(`/${WORKFLOW_SHARE_TEMPLATE_PATH}/${originDocumentTypeId}/${originTemplateId}`)
  }, [navigate, originDocumentTypeId, originTemplateId])

  // Arranque automático: mismo criterio que el onStart de las tarjetas en
  // pages/workflow.tsx — si el template no exige nombre, se crea de una.
  useEffect(() => {
    if (mode !== "template" || !canCreateExpress) return
    if (autoStartedRef.current) return
    if (!template || template.require_name_on_express) return
    autoStartedRef.current = true
    createExpress
      .mutateAsync({ documentTypeId: template.document_type_id, templateId: template.id, body: { name: "" } })
      .then((result) => anchorCreatedDocument(result.id, template.document_type_id, template.id))
      .catch(() => {
        autoStartedRef.current = false
        setAutoCreateError(true)
      })
  }, [mode, canCreateExpress, template, createExpress, retryToken, anchorCreatedDocument])

  const handleSubmitName = useCallback(
    (name: string, description?: string) => {
      if (!template || !canCreateExpress) return
      setAutoCreateError(false)
      createExpress
        .mutateAsync({ documentTypeId: template.document_type_id, templateId: template.id, body: { name, description } })
        .then((result) => anchorCreatedDocument(result.id, template.document_type_id, template.id))
        .catch(() => setAutoCreateError(true))
    },
    [template, canCreateExpress, createExpress, anchorCreatedDocument],
  )

  const handleRetryAutoCreate = useCallback(() => {
    autoStartedRef.current = false
    setAutoCreateError(false)
    setRetryToken((n) => n + 1)
  }, [])

  const row: WorkflowRowRef | null =
    mode === "execution" && params.documentId
      ? { document_id: params.documentId, execution_id: params.executionId }
      : null

  if (isLoadingPermissions) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canAccessPage) {
    return <HuemulAccessDenied variant="inline" />
  }

  if (mode === "execution" && !row) {
    return <HuemulAccessDenied variant="inline" description={t("fill.notFound")} />
  }

  if (mode === "template" && !params.documentTypeId) {
    return <HuemulAccessDenied variant="inline" description={t("fill.notFound")} />
  }

  // Crear el express exige asset:c (ver useCreateTemplateExpress). Sin este
  // gate explícito el auto-arranque de abajo se queda mudo: nunca llama al
  // mutate, la URL nunca se redirige y el panel cae en su spinner de carga
  // sin salida (mismo criterio que canCreate en pages/workflow.tsx, que ahí
  // oculta directamente las tarjetas de "Iniciar").
  if (mode === "template" && !canCreateExpress) {
    return <HuemulAccessDenied variant="inline" description={t("fill.noCreatePermission")} />
  }

  if (mode === "template" && stillResolvingTemplate) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Falló el auto-create (backend real: 403/404/500) para un template que NO pide
  // nombre — el panel nunca tiene un formulario donde mostrar el reintento (ese
  // camino solo existe cuando require_name_on_express es true), así que la propia
  // página ofrece "Reintentar". El toast de error global (query-client.ts) ya avisó
  // el motivo; esto evita que la pantalla se quede en el spinner sin salida.
  if (mode === "template" && autoCreateError && template && !template.require_name_on_express) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm font-semibold text-foreground">{t("fill.createError")}</p>
          <HuemulButton
            variant="outline"
            size="sm"
            icon={RotateCcw}
            label={t("common:retry")}
            onClick={handleRetryAutoCreate}
            className="mt-2"
          />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* `hidden`, no desmontado: "Seguir completando" debe volver exactamente
          al mismo paso del wizard, sin perder el formulario en memoria. La
          tarjeta terminal (cuando no queda nada más por hacer) la muestra el
          propio panel en su área de contenido — no necesita este toggle. */}
      <div className={cn("h-full", savedForLater && "hidden")}>
        <WorkflowDetailPanel
          variant="fullscreen"
          showClose={false}
          showAssetEdit={false}
          row={row}
          template={mode === "template" ? (template ?? undefined) : undefined}
          isCreating={createExpress.isPending}
          onSubmitName={handleSubmitName}
          onClose={() => {}}
          onContinueLater={() => setSavedForLater(true)}
          onStartAnother={canStartAnother ? handleStartAnother : undefined}
          onDocumentOrigin={handleDocumentOrigin}
        />
      </div>
      {savedForLater && (
        <WorkflowSavedLaterCard
          onKeepGoing={() => setSavedForLater(false)}
          onStartAnother={canStartAnother ? handleStartAnother : undefined}
        />
      )}
    </>
  )
}
