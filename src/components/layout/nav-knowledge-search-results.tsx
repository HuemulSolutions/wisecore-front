"use client"

import * as React from "react"
import { File, Folder, RefreshCw, SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state"
import { HuemulTreeLoadMoreRow } from "@/huemul/components/huemul-tree-load-more-row"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"
import { TREE_CHILDREN_PAGE_SIZE } from "@/huemul/constants"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { getLibraryContent } from "@/services/folders"
import type { FileNode } from "@/types/assets"
import type { LibraryContent } from "@/types/folders"

interface SearchResultItem {
  id: string
  name: string
  /** Ruta de la carpeta contenedora (assets) o de la propia carpeta (carpetas). */
  path?: string
  node: FileNode
}

export interface NavKnowledgeSearchResultsProps {
  organizationId: string
  search: string
  /** Gate de listar (assets o carpetas): sin él no se pega al backend. */
  enabled: boolean
  diagramMode?: boolean
  activeAssetId: string | null
  onOpenAsset: (node: FileNode) => void
  onClear: () => void
}

function toSearchItems(content: LibraryContent): SearchResultItem[] {
  return [
    ...(content.folders ?? [])
      .filter((folder) => folder.is_match)
      .map((folder): SearchResultItem => ({
        id: folder.id,
        name: folder.name,
        path: folder.path,
        node: { id: folder.id, name: folder.name, type: "folder" },
      })),
    ...(content.assets ?? []).map((asset): SearchResultItem => ({
      id: asset.id,
      name: asset.name,
      path: asset.folder_path ?? asset.folder_name,
      node: {
        id: asset.id,
        name: asset.name,
        type: "document",
        document_type: asset.document_type,
        access_levels: asset.access_levels,
      },
    })),
  ]
}

/**
 * Resultados de búsqueda del sidebar: lista PLANA de coincidencias con su ruta, no el
 * árbol (buscar no navega la jerarquía). Pagina de a `TREE_CHILDREN_PAGE_SIZE` con la
 * misma fila "Mostrar más" del árbol, que además se autocarga al llegar al final.
 */
export function NavKnowledgeSearchResults({
  organizationId,
  search,
  enabled,
  diagramMode = false,
  activeAssetId,
  onOpenAsset,
  onClear,
}: NavKnowledgeSearchResultsProps) {
  const { t } = useTranslation("layout")
  const { t: tTree } = useTranslation("huemul-file-tree")
  const [items, setItems] = React.useState<SearchResultItem[]>([])
  const [hasMore, setHasMore] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  // Siguiente página a pedir (y cursor opaco del backend si lo hay). `epoch` descarta
  // respuestas de una búsqueda anterior que llegan tarde.
  const nextRef = React.useRef<{ page: number; cursor?: string } | null>(null)
  const epochRef = React.useRef(0)
  const loadingMoreRef = React.useRef(false)

  const applyNext = React.useCallback((content: LibraryContent, page: number) => {
    const cursor = content.next_cursor
    const more = cursor !== undefined ? cursor !== null : content.has_next
    nextRef.current = more ? { page: page + 1, cursor: cursor ?? undefined } : null
    setHasMore(more)
  }, [])

  React.useEffect(() => {
    const epoch = ++epochRef.current
    loadingMoreRef.current = false
    setIsLoadingMore(false)
    if (!search || !enabled) {
      setItems([])
      setHasMore(false)
      nextRef.current = null
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    getLibraryContent(organizationId, undefined, 1, TREE_CHILDREN_PAGE_SIZE, search)
      .then((content) => {
        if (epoch !== epochRef.current) return
        setItems(toSearchItems(content))
        applyNext(content, 1)
      })
      .catch((error) => {
        if (epoch !== epochRef.current) return
        logger.error("Error searching library:", error)
        setItems([])
        setHasMore(false)
        nextRef.current = null
      })
      .finally(() => {
        if (epoch === epochRef.current) setIsSearching(false)
      })
  }, [organizationId, search, enabled, applyNext])

  const loadMore = React.useCallback(async () => {
    const next = nextRef.current
    if (!next || loadingMoreRef.current) return
    const epoch = epochRef.current
    loadingMoreRef.current = true
    setIsLoadingMore(true)
    try {
      const content = await getLibraryContent(
        organizationId,
        undefined,
        next.page,
        TREE_CHILDREN_PAGE_SIZE,
        search,
        undefined,
        undefined,
        next.cursor ? { cursor: next.cursor } : undefined,
      )
      if (epoch !== epochRef.current) return
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id))
        return [...prev, ...toSearchItems(content).filter((item) => !seen.has(item.id))]
      })
      applyNext(content, next.page)
    } catch (error) {
      // Se conserva lo cargado y la fila queda disponible para reintentar.
      logger.error("Error loading more search results:", error)
    } finally {
      if (epoch === epochRef.current) {
        loadingMoreRef.current = false
        setIsLoadingMore(false)
      }
    }
  }, [organizationId, search, applyNext])

  if (isSearching) {
    return (
      <div className="px-4 py-3 flex justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (items.length === 0) {
    return diagramMode ? (
      <HuemulPanelEmptyState
        className="mx-3 my-3"
        icon={SearchX}
        title={t("knowledge.searchNoResultsTitle", { term: search })}
        description={t("knowledge.searchNoResultsDescription")}
        action={{ label: t("knowledge.searchClear"), onClick: onClear }}
      />
    ) : (
      <div className="px-4 py-3 text-center text-xs text-muted-foreground">
        {t("knowledge.searchNoResults")}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isFolder = item.node.type === "folder"
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "group flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-accent hover:cursor-pointer",
              !isFolder && activeAssetId === item.id && "bg-accent font-medium",
            )}
            onClick={() => !isFolder && onOpenAsset(item.node)}
          >
            <span className="mt-0.5 shrink-0">
              {isFolder ? (
                <Folder className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <File className="h-3.5 w-3.5" style={{ color: item.node.document_type?.color ?? undefined }} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <HuemulTruncatedText text={item.name} className="block text-sm" />
              {item.path && (
                <HuemulTruncatedText text={item.path} className="block text-[11px] text-muted-foreground" />
              )}
            </span>
          </button>
        )
      })}
      {hasMore && (
        <HuemulTreeLoadMoreRow
          level={0}
          label={tTree("showMore", { count: TREE_CHILDREN_PAGE_SIZE })}
          isLoading={isLoadingMore}
          autoLoad
          onLoadMore={() => void loadMore()}
        />
      )}
    </div>
  )
}
