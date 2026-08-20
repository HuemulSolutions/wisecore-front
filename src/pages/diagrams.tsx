"use client"

import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useDocumentTypes, documentTypeQueryKeys } from "@/hooks/useDocumentTypes"
import { diagramQueryKeys } from "@/hooks/useDiagrams"
import { executionRelationshipQueryKeys } from "@/hooks/useExecutionRelationships"
import { useGlobalPanel } from "@/contexts/global-panel-context"
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
  DiagramsListSheet,
  DiagramsPageHeader,
  DiagramsPageSkeleton,
  DiagramsPageEmptyState,
} from "@/components/diagrams"
import type { Diagram } from "@/types/diagrams"

/**
 * Editor de diagramas: árbol de conocimiento a la izquierda (fuente de arrastre)
 * y canvas de relaciones a la derecha. Antes esta página era solo la tabla y la
 * edición vivía en /asset detrás del "modo relaciones"; el listado ahora se abre
 * en un sheet (DiagramsListSheet).
 *
 * Qué se edita lo decide `?diagram=`: un id carga el diagrama guardado, `new`
 * abre un canvas en blanco (opcionalmente sembrado con ?seedAsset=&seedExecution=,
 * ver AssetDiagramsSheet) y sin param se trabaja sobre el canvas libre.
 */
function DiagramsContent() {
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('diagrams')
  const { isOpen: isWisyOpen } = useGlobalPanel()
  const { page, pageSize, hasNext, hasPrevious, setPage } = useNavKnowledgePagination()
  const { fileTreeRef } = useNavKnowledge()
  const queryClient = useQueryClient()

  const [isListOpen, setIsListOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const canList = can('listDiagrams')
  const canView = can('viewDiagram')
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
   * Refresh único de la página: recarga el árbol (fuente de arrastre) y las
   * queries que alimentan el canvas. El árbol ya no trae su propio botón aquí
   * para no ofrecer dos refrescos a 40px de distancia.
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

  if (isLoadingPermissions) return <DiagramsPageSkeleton />

  if (!canAccessPage) return <DiagramsPageEmptyState type="access-denied" />

  if (!selectedOrganizationId || !organizationToken) return <DiagramsPageEmptyState type="no-organization" />

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
          // Ya guardado: el canvas quedó en modo edición para este diagrama;
          // sincronizamos la URL (replace, no ensucia el historial) para que el
          // deep-link y F5 lo recarguen desde el servidor en vez de perderlo.
          onDiagramSaved={(diagram) => openDiagram(diagram.id, true)}
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
      />
    )
  }

  return (
    <>
      <div className="relative h-full">
        <HuemulPageLayout
          header={
            <DiagramsPageHeader
              onBrowseDiagrams={() => setIsListOpen(true)}
              onCreateDiagram={() => openDiagram('new')}
              onRefresh={handleRefresh}
              isLoading={isRefreshing}
              canList={canList}
              canCreate={canCreate}
            />
          }
          headerClassName="px-4 py-3 md:px-6 md:py-4"
          columns={[
            {
              content: (
                <div className="flex flex-col h-full bg-white border-r">
                  <div className="py-2">
                    {/* El refresh de esta página vive en el PageHeader */}
                    <NavKnowledgeHeader showRefresh={false} />
                  </div>
                  <ScrollArea className="flex-1 min-h-0" type="hover">
                    <NavKnowledgeContent diagramMode />
                  </ScrollArea>
                </div>
              ),
              defaultSize: isWisyOpen ? 15 : 20,
              minSize: isWisyOpen ? 10 : 12,
              collapsible: true,
              collapsedSize: 0,
              className: "overflow-hidden [scrollbar-gutter:auto]",
              footer: {
                content: (
                  <HuemulPagination
                    page={page}
                    pageSize={pageSize}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    onPageChange={setPage}
                  />
                ),
              },
            },
            {
              content: (
                <div className="flex flex-col h-full bg-white">
                  <div className="flex-1 min-h-0">
                    {renderCanvas()}
                  </div>
                </div>
              ),
              defaultSize: 80,
              minSize: 50,
              className: "overflow-hidden",
            },
          ]}
        />
      </div>

      <DiagramsListSheet
        open={isListOpen}
        onOpenChange={setIsListOpen}
        organizationId={selectedOrganizationId}
        onSelect={(diagram: Diagram) => {
          openDiagram(diagram.id)
          setIsListOpen(false)
        }}
        onCreate={canCreate ? () => {
          openDiagram('new')
          setIsListOpen(false)
        } : undefined}
        canList={canList}
        canView={canView}
        canDelete={canDelete}
        canListExecutions={canListExecutions}
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
