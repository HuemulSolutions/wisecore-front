import { useRef } from "react"
import { createPortal } from "react-dom"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useOrganization } from "@/contexts/organization-context"
import { useWorkflowTemplates } from "@/hooks/useWorkflowTemplates"
import { useWorkflowLauncherState } from "./hooks/useWorkflowLauncherState"
import { WorkflowLauncherBar } from "./workflow-launcher-bar"
import { WorkflowLauncherPanel } from "./workflow-launcher-panel"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowLauncherProps {
  /**
   * `asset:c` + `template:l|r` — iniciar un template crea un documento real
   * (POST /document_types/{id}/templates/{id}/express). Obligatoria (sin
   * default) para que un call-site futuro no herede un default permisivo.
   */
  canCreate: boolean
  onStart: (item: WorkflowTemplateItem) => void
  /** Abre el diálogo con el link para que otro usuario cree su propio express desde este template. */
  onShare: (item: WorkflowTemplateItem) => void
  /** Id del template cuyo express está en vuelo: el chip/botón correspondiente pasa a spinner. */
  startingTemplateId: string | null
}

// Tarjetas-chip que caben en la banda: el riel recorta con una máscara de fade.
const RAIL_VISIBLE_COUNT = 6

/**
 * Lanzador de workflows disponibles, en dos capas: `WorkflowLauncherBar`
 * (barra de chips siempre visible) y `WorkflowLauncherPanel` (catálogo
 * completo con buscador), anclado a la barra vía Radix `Popover`.
 *
 * Ambas capas se pintan desde una única query: búsqueda (al presionar Enter) y
 * paginación son server-side. Si el panel avanza de página, el riel muestra las
 * primeras tarjetas de esa página — caso marginal con 100 items por página.
 */
export function WorkflowLauncher({ canCreate, onStart, onShare, startingTemplateId }: WorkflowLauncherProps) {
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const state = useWorkflowLauncherState()
  const searchRef = useRef<HTMLInputElement>(null)

  const templatesQuery = useWorkflowTemplates(selectedOrganizationId ?? "", {
    search: state.appliedQuery,
    page: state.page,
    enabled: canCreate && !!selectedOrganizationId && !!organizationToken,
  })

  // El bloque completo existe solo para crear un express: sin permiso no hay
  // nada que mostrar, ni siquiera la etiqueta "INICIAR".
  if (!canCreate) return null

  const items = templatesQuery.data?.items ?? []

  const handleStart = (item: WorkflowTemplateItem) => {
    state.setPanelOpen(false)
    onStart(item)
  }

  return (
    <Popover open={state.panelOpen} onOpenChange={state.setPanelOpen} modal={false}>
      {state.panelOpen &&
        createPortal(
          <div className="fixed inset-0 z-(--z-launcher-scrim) bg-[#0F172A]/6" aria-hidden="true" />,
          document.body,
        )}

      <PopoverAnchor asChild>
        <WorkflowLauncherBar
          items={items.slice(0, RAIL_VISIBLE_COUNT)}
          total={templatesQuery.data?.total}
          isEmpty={!templatesQuery.isLoading && !templatesQuery.error && items.length === 0}
          isLoading={templatesQuery.isLoading}
          error={templatesQuery.error}
          onRetry={() => templatesQuery.refetch()}
          query={state.query}
          onQueryChange={state.setQuery}
          onSubmitQuery={state.submitQuery}
          appliedQuery={state.appliedQuery}
          hasQuery={state.hasQuery}
          panelOpen={state.panelOpen}
          hidden={state.hidden}
          onToggleHidden={() => state.setHidden(!state.hidden)}
          onStart={handleStart}
          onShare={onShare}
          startingTemplateId={startingTemplateId}
        />
      </PopoverAnchor>

      <PopoverContent
        align="center"
        sideOffset={0}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          searchRef.current?.focus()
        }}
        style={{ width: "calc(var(--radix-popover-trigger-width) - 36px)" }}
        className="rounded-t-none rounded-b-[14px] border-t-0 border-[#DBE3FE] p-0 shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
      >
        <WorkflowLauncherPanel
          items={items}
          page={state.page}
          pageSize={templatesQuery.data?.pageSize}
          onPageChange={state.setPage}
          hasNext={templatesQuery.data?.hasNext ?? false}
          total={templatesQuery.data?.total}
          query={state.query}
          onQueryChange={state.setQuery}
          onSubmitQuery={state.submitQuery}
          onClearSearch={state.clearSearch}
          appliedQuery={state.appliedQuery}
          hasQuery={state.hasQuery}
          isLoading={templatesQuery.isLoading}
          error={templatesQuery.error}
          onRetry={() => templatesQuery.refetch()}
          onRefresh={() => templatesQuery.refetch()}
          isRefreshing={templatesQuery.isFetching}
          startingTemplateId={startingTemplateId}
          onStart={handleStart}
          onShare={onShare}
          onClose={() => state.setPanelOpen(false)}
          searchRef={searchRef}
        />
      </PopoverContent>
    </Popover>
  )
}
