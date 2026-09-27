"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useDocumentTypes, documentTypeQueryKeys } from "@/hooks/useDocumentTypes"
import { diagramQueryKeys } from "@/hooks/useDiagrams"
import { useRecentDiagrams } from "@/hooks/useRecentDiagrams"
import { executionRelationshipQueryKeys } from "@/hooks/useExecutionRelationships"
import { ExpandedFoldersProvider } from "@/hooks/use-expanded-folders"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavKnowledgeHeader, NavKnowledgeContent } from "@/components/layout/nav-knowledge"
import { useNavKnowledge, useNavKnowledgePagination } from "@/contexts/nav-knowledge-context"
import { RelationshipsCanvas } from "@/components/document-type-relationships"
import {
  DiagramCanvas,
  NewDiagramCanvas,
  DiagramsDeleteDialog,
  DiagramsListPanel,
  DiagramsRail,
  DiagramsRailPanel,
  DiagramsRecentsPanel,
  DiagramsPageSkeleton,
  DiagramsPageEmptyState,
} from "@/components/diagrams"
import type { DiagramsRailPanelKey } from "@/components/diagrams"
import type { Diagram } from "@/types/diagrams"

/**
 * Editor de diagramas: el canvas de relaciones ocupa toda la pantalla y el resto
 * del cromo flota sobre él. Único elemento fijo: el riel de 52px, cuyos botones
 * abren paneles superpuestos de 300px (árbol de conocimiento —fuente de arrastre—,
 * diagramas guardados y recientes).
 *
 * Qué se edita lo decide `?diagram=`: un id carga el diagrama guardado, `new`
 * abre un canvas en blanco (opcionalmente sembrado con ?seedAsset=&seedExecution=,
 * ver AssetDiagramsSheet) y sin param se trabaja sobre el canvas libre. El panel
 * "Diagramas" del riel es la única fuente del listado (búsqueda, filtro por
 * ejecución, paginación y eliminar).
 */
function DiagramsContent() {
  const { t } = useTranslation("diagrams")
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('diagrams')
  const { page, pageSize, hasNext, hasPrevious, setPage } = useNavKnowledgePagination()
  const { fileTreeRef } = useNavKnowledge()
  const queryClient = useQueryClient()

  const [deletingDiagram, setDeletingDiagram] = useState<Diagram | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activePanel, setActivePanel] = useState<DiagramsRailPanelKey | null>(null)
  // Botón del riel del panel abierto: al cerrar con Esc/X el foco vuelve a él.
  const railButtonRef = useRef<HTMLButtonElement>(null)
  const { recents: recentDiagrams, addRecent, removeRecent } = useRecentDiagrams(selectedOrganizationId)

  const canList = can('listDiagrams')
  const canDelete = can('deleteDiagram')
  const canCreate = can('createDiagram')
  const canListExecutions = can('listExecutions')
  const canListExecRelationships = can('listExecutionRelationships')

  const [searchParams, setSearchParams] = useSearchParams()
  const diagramParam = searchParams.get('diagram')
  const isNewDiagram = diagramParam === 'new'
  const diagramId = isNewDiagram ? null : diagramParam
  // seedAsset/seedExecution solo importan en el primer render del deep-link de
  // "nuevo diagrama": se capturan una vez en vez de releerse de searchParams.
  const [diagramSeed] = useState(() => ({
    assetId: searchParams.get('seedAsset') ?? undefined,
    executionId: searchParams.get('seedExecution') ?? undefined,
  }))

  // La paleta de tipos solo la usa el canvas: sin permiso de listarlos no se pide.
  const { data: docTypesResponse } = useDocumentTypes({
    enabled: can('listAssetTypes'),
  })
  const documentTypes = docTypesResponse?.data ?? []

  /**
   * Refresh del canvas (ítem "Actualizar" del menú ⋯ de la barra): recarga el
   * árbol (fuente de arrastre) y las queries que alimentan el canvas. El árbol
   * y el listado tienen además su propio botón dentro de su panel.
   */
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fileTreeRef.current?.refresh(),
        queryClient.invalidateQueries({ queryKey: diagramQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: executionRelationshipQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.lists() }),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  const openDiagram = (id: string | 'new' | null, replace = false) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      // Las semillas son de un solo uso: pertenecen al canvas que se está
      // abriendo ahora, no al siguiente.
      next.delete('seedAsset')
      next.delete('seedExecution')
      if (id === null) next.delete('diagram')
      else next.set('diagram', id)
      return next
    }, { replace })
  }

  // Primer guardado de un diagrama sin id (canvas libre o ?diagram=new): el canvas ya
  // quedó en modo edición; la URL pasa a ?diagram=<id> (replace, no ensucia el historial)
  // para que F5 y el deep-link lo recarguen desde el servidor en vez de perderlo.
  const handleNewDiagramSaved = (diagram: Diagram) => {
    openDiagram(diagram.id, true)
    addRecent({ id: diagram.id, name: diagram.name })
  }

  const closePanel = useCallback(() => setActivePanel(null), [])
  const togglePanel = useCallback((key: DiagramsRailPanelKey) => {
    setActivePanel((prev) => (prev === key ? null : key))
  }, [])

  if (isLoadingPermissions) return <DiagramsPageSkeleton />

  if (!canAccessPage) return <DiagramsPageEmptyState type="access-denied" />

  if (!selectedOrganizationId || !organizationToken) return <DiagramsPageEmptyState type="no-organization" />

  // Props del cromo flotante que comparten los tres canvas de la página.
  const chromeProps = {
    chrome: 'editor' as const,
    onOpenAssetTree: () => setActivePanel('tree'),
    onOpenDiagramsList: canList ? () => setActivePanel('list') : undefined,
    onRefresh: handleRefresh,
    isRefreshing,
    onDiagramDeleted: removeRecent,
  }

  const renderCanvas = () => {
    // El canvas en modo execution lee relaciones de ejecución: sin ese permiso
    // no hay superficie que mostrar.
    if (!canListExecRelationships) return <HuemulAccessDenied variant="inline" />

    if (diagramId) {
      return canList ? (
        <DiagramCanvas
          key={diagramId}
          organizationId={selectedOrganizationId}
          diagramId={diagramId}
          fallbackName={recentDiagrams.find((r) => r.id === diagramId)?.name}
          onViewDiagrams={() => setActivePanel('list')}
          onCanvasCleared={() => openDiagram(null, true)}
          // Guardar (mismo id) reemplaza la entrada; "Duplicar" navega a la copia.
          onDiagramSaved={(diagram) => {
            openDiagram(diagram.id, diagram.id === diagramId)
            addRecent({ id: diagram.id, name: diagram.name })
          }}
          {...chromeProps}
        />
      ) : (
        <HuemulAccessDenied variant="inline" />
      )
    }

    if (isNewDiagram) {
      return canCreate ? (
        <NewDiagramCanvas
          organizationId={selectedOrganizationId}
          seedAssetId={diagramSeed.assetId}
          seedExecutionId={diagramSeed.executionId}
          onDiagramSaved={handleNewDiagramSaved}
          onCanvasCleared={() => openDiagram(null, true)}
          {...chromeProps}
        />
      ) : (
        <HuemulAccessDenied variant="inline" />
      )
    }

    return (
      <RelationshipsCanvas
        organizationId={selectedOrganizationId}
        documentTypes={documentTypes}
        mode="execution"
        onDiagramSaved={handleNewDiagramSaved}
        {...chromeProps}
      />
    )
  }

  const handleSelectDiagram = (diagram: { id: string; name: string }) => {
    openDiagram(diagram.id)
    addRecent({ id: diagram.id, name: diagram.name })
    setActivePanel(null)
  }

  return (
    <>
      <HuemulPageLayout
        showHeader={false}
        columns={[
          {
            content: (
              <div className="flex h-full min-h-0">
                <DiagramsRail
                  active={activePanel}
                  onToggle={togglePanel}
                  canList={canList}
                  activeButtonRef={railButtonRef}
                />
                {/* onDropCapture no llama preventDefault: el handleDrop del canvas sigue
                    recibiendo el evento; solo cierra el panel del árbol al soltar el activo. */}
                <div
                  className="relative min-w-0 flex-1"
                  onDropCapture={() => setActivePanel((prev) => (prev === 'tree' ? null : prev))}
                >
                  {renderCanvas()}

                  {activePanel === 'tree' && (
                    <DiagramsRailPanel
                      title={t('rail.tree')}
                      hideHeader
                      onClose={closePanel}
                      onCloseFocusRef={railButtonRef}
                    >
                      <div className="py-2">
                        <NavKnowledgeHeader />
                      </div>
                      <ScrollArea className="min-h-0 flex-1" type="hover">
                        <NavKnowledgeContent diagramMode />
                      </ScrollArea>
                      <HuemulPagination
                        page={page}
                        pageSize={pageSize}
                        hasNext={hasNext}
                        hasPrevious={hasPrevious}
                        onPageChange={setPage}
                      />
                    </DiagramsRailPanel>
                  )}

                  {activePanel === 'list' && canList && (
                    <DiagramsListPanel
                      organizationId={selectedOrganizationId}
                      activeDiagramId={diagramId}
                      onSelect={handleSelectDiagram}
                      onCreate={canCreate ? () => { openDiagram('new'); setActivePanel(null) } : undefined}
                      onRequestDelete={setDeletingDiagram}
                      canDelete={canDelete}
                      canBrowseAssets={can('listAssets') && can('listFolders')}
                      canListExecutions={canListExecutions}
                      onClose={closePanel}
                      onCloseFocusRef={railButtonRef}
                    />
                  )}

                  {activePanel === 'recents' && canList && (
                    <DiagramsRecentsPanel
                      recents={recentDiagrams}
                      activeDiagramId={diagramId}
                      onOpen={handleSelectDiagram}
                      onViewAll={() => setActivePanel('list')}
                      onClose={closePanel}
                      onCloseFocusRef={railButtonRef}
                    />
                  )}
                </div>
              </div>
            ),
            className: "overflow-hidden",
          },
        ]}
      />

      {/* Fuera del panel: el panel cierra con pointerdown fuera y desmontaría el diálogo. */}
      <DiagramsDeleteDialog
        open={!!deletingDiagram}
        onOpenChange={(open) => { if (!open) setDeletingDiagram(null) }}
        diagram={deletingDiagram}
        organizationId={selectedOrganizationId}
        canDelete={canDelete}
        onDeleted={(id) => {
          removeRecent(id)
          if (id === diagramId) openDiagram(null, true)
        }}
      />
    </>
  )
}

export default function DiagramsPage() {
  return (
    <ExpandedFoldersProvider>
      <DiagramsContent />
    </ExpandedFoldersProvider>
  )
}
