"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Loader2, CheckCircle2, RotateCcw } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useWorkflowTemplates, useCreateTemplateExpress } from "@/hooks/useWorkflowTemplates"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { WorkflowDetailPanel } from "@/components/workflow"
import type { CreateExpressResult, WorkflowTemplateItem } from "@/types/templates"
import type { WorkflowRowRef } from "@/types/workflow"

type ShareMode = "template" | "execution"

/**
 * Vista compartida a pantalla completa (ver ia context/fullscreen-share-route-guide.md).
 * Se llega acá SOLO por un link generado desde /workflow ("Compartir"), nunca por
 * navegación normal. AppLayout la monta en su modo "bare" (sin header/nav) pero
 * con los mismos providers — ver app-layout.tsx.
 *
 * Dos modos según la ruta (ver workflow-share-url.ts):
 * - "template" (:documentTypeId/:templateId): cada persona que abre el link crea
 *   SU propio documento express y responde su copia.
 * - "execution" (:documentId/:executionId): todas las personas responden el MISMO
 *   documento ya existente.
 */
export default function WorkflowFillPage() {
  const { t } = useTranslation("workflow")
  const params = useParams<{
    documentTypeId?: string
    templateId?: string
    documentId?: string
    executionId?: string
  }>()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess("workflow")

  const mode: ShareMode = params.templateId ? "template" : "execution"

  const [createdDoc, setCreatedDoc] = useState<CreateExpressResult | null>(null)
  const [finished, setFinished] = useState(false)
  const autoStartedRef = useRef(false)

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

  // Arranque automático: mismo criterio que el onStart de las tarjetas en
  // pages/workflow.tsx — si el template no exige nombre, se crea de una.
  useEffect(() => {
    if (mode !== "template" || !canCreateExpress) return
    if (autoStartedRef.current || createdDoc) return
    if (!template || template.require_name_on_express) return
    autoStartedRef.current = true
    createExpress
      .mutateAsync({ documentTypeId: template.document_type_id, templateId: template.id, body: { name: "" } })
      .then(setCreatedDoc)
      .catch(() => {
        autoStartedRef.current = false
      })
  }, [mode, canCreateExpress, template, createdDoc, createExpress])

  const handleSubmitName = useCallback(
    (name: string, description?: string) => {
      if (!template || !canCreateExpress) return
      createExpress
        .mutateAsync({ documentTypeId: template.document_type_id, templateId: template.id, body: { name, description } })
        .then(setCreatedDoc)
        .catch(() => {})
    },
    [template, canCreateExpress, createExpress],
  )

  const handleAnswerAnother = useCallback(() => {
    autoStartedRef.current = false
    setCreatedDoc(null)
    setFinished(false)
  }, [])

  const row: WorkflowRowRef | null =
    mode === "execution" && params.documentId && params.executionId
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

  if (finished) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-semibold text-foreground">{t("fill.finishedTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("fill.finishedDescription")}</p>
          {mode === "template" && (
            <HuemulButton
              variant="outline"
              size="sm"
              icon={RotateCcw}
              label={t("fill.answerAnother")}
              onClick={handleAnswerAnother}
              className="mt-2"
            />
          )}
        </div>
      </div>
    )
  }

  if (mode === "template" && stillResolvingTemplate) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <WorkflowDetailPanel
      variant="fullscreen"
      showClose={false}
      showAssetEdit={false}
      showLifecycle={false}
      row={row}
      template={mode === "template" ? (template ?? undefined) : undefined}
      createdDoc={createdDoc}
      isCreating={createExpress.isPending}
      onSubmitName={handleSubmitName}
      onClose={() => {}}
      onFinish={() => setFinished(true)}
    />
  )
}
