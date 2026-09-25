import { useState } from "react"
import { useOrganization } from "@/contexts/organization-context"
import { useWorkflowTemplates } from "@/hooks/useWorkflowTemplates"
import { useWorkflowLauncherState } from "./hooks/useWorkflowLauncherState"
import { WorkflowLauncherBar } from "./workflow-launcher-bar"
import { WorkflowLauncherDialog } from "./workflow-launcher-dialog"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowLauncherProps {
  /**
   * `asset:c` + `template:l|r` — iniciar un template crea un documento real
   * (POST /document_types/{id}/templates/{id}/express). Obligatoria (sin
   * default) para que un call-site futuro no herede un default permisivo.
   */
  canCreate: boolean
  /** Inicia el express (o pide el nombre). El padre decide y cierra «Ver todos» si corresponde. */
  onStart: (item: WorkflowTemplateItem) => void
  /** Copia el link para que otro usuario cree su propio express desde este template. */
  onShare: (item: WorkflowTemplateItem) => void
  /** Id del template cuyo express está en vuelo: el chip/botón correspondiente pasa a «Creando…». */
  startingTemplateId: string | null
  /** Aumenta al pedirlo el padre para cerrar «Ver todos» (p. ej. al crear con éxito). */
  closeDialogSignal?: number
}

/**
 * Lanzador de workflows disponibles, en dos capas: `WorkflowLauncherBar` (fila
 * de chips con «Iniciar» y compartir, siempre visible) y `WorkflowLauncherDialog`
 * (catálogo completo con búsqueda y «Cargar más»).
 *
 * El riel pinta la primera página sin búsqueda; el diálogo pide su propio
 * catálogo acumulativo (`useWorkflowTemplateCatalog`). Cuántos chips entran lo
 * decide la barra según su ancho medido, no este componente.
 */
export function WorkflowLauncher({ canCreate, onStart, onShare, startingTemplateId, closeDialogSignal }: WorkflowLauncherProps) {
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const state = useWorkflowLauncherState()
  const { dialogOpen, setDialogOpen } = state

  const templatesQuery = useWorkflowTemplates(selectedOrganizationId ?? "", {
    search: state.appliedQuery,
    enabled: canCreate && !!selectedOrganizationId && !!organizationToken,
  })

  // Cerrar «Ver todos» a pedido del padre.
  const [lastSignal, setLastSignal] = useState(closeDialogSignal)
  if (closeDialogSignal !== lastSignal) {
    setLastSignal(closeDialogSignal)
    if (dialogOpen) setDialogOpen(false)
  }

  // El bloque completo existe solo para crear un express: sin permiso no hay
  // nada que mostrar, ni siquiera la etiqueta "INICIAR".
  if (!canCreate) return null

  return (
    <>
      <WorkflowLauncherBar
        items={templatesQuery.data?.items ?? []}
        total={templatesQuery.data?.total}
        isLoading={templatesQuery.isLoading}
        error={templatesQuery.error}
        onRetry={() => templatesQuery.refetch()}
        query={state.query}
        onQueryChange={state.setQuery}
        onSubmitQuery={state.submitQuery}
        onClearSearch={state.clearSearch}
        appliedQuery={state.appliedQuery}
        hasQuery={state.hasQuery}
        hidden={state.hidden}
        onToggleHidden={() => state.setHidden(!state.hidden)}
        onSeeAll={() => setDialogOpen(true)}
        onStart={onStart}
        onShare={onShare}
        startingTemplateId={startingTemplateId}
      />
      <WorkflowLauncherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        startingTemplateId={startingTemplateId}
        onStart={onStart}
        onShare={onShare}
      />
    </>
  )
}
