import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  File,
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Loader2,
  FolderTree,
} from "lucide-react"

import { getLibraryContent } from "@/services/folders"
import { getExecutionsByDocumentId } from "@/services/executions"
import { getExecutionDisplayLabel } from "@/components/assets/content/utils/version-utils"
import { HuemulDialog } from "./huemul-dialog"
import { HuemulFileTree } from "./huemul-file-tree"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { HuemulTreeNode } from "@/types/huemul"
import type { LibraryContent, LibraryContentFolder, LibraryContentAsset } from "@/types/folders"

/**
 * - "document": solo se puede elegir el documento (asset), sin drill-down.
 * - "execution": el documento solo es expandible, hay que elegir una ejecucion puntual (uso estricto, ej. save-as-diagram-sheet).
 * - "document-with-version": permite elegir el documento directo (sin version fija) o expandir y elegir una ejecucion puntual.
 */
export type AssetPickerMode = "document" | "execution" | "document-with-version"

type NodeKind = "folder" | "document" | "execution"

interface ExecutionItem {
  id: string
  name: string
  document_name?: string
  version?: string | null
}

export interface AssetPickerSelectMeta {
  color?: string | null
  documentId?: string
  documentName?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isExecutionMode(mode: AssetPickerMode): boolean {
  return mode === "execution" || mode === "document-with-version"
}

function isDocumentMode(mode: AssetPickerMode): boolean {
  return mode === "document" || mode === "document-with-version"
}

function executionLabel(exec: ExecutionItem): string {
  const label = getExecutionDisplayLabel(exec)
  return exec.document_name ? `${exec.document_name} · ${label}` : label
}

function leafIconFor(node: HuemulTreeNode) {
  const kind = (node.metadata?.kind as NodeKind) ?? "document"
  if (kind === "execution") return <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  const color = node.metadata?.color as string | undefined
  return <File className="h-3.5 w-3.5 shrink-0" style={{ color: color || "currentColor" }} />
}

// ─── Search tree (rebuilt hierarchy of matches) ───────────────────────────────

interface SearchTreeNode {
  folder: LibraryContentFolder
  children: SearchTreeNode[]
  assets: LibraryContentAsset[]
}

function buildSearchTree(content: LibraryContent): {
  rootFolders: SearchTreeNode[]
  rootAssets: LibraryContentAsset[]
} {
  const byId = new Map<string, SearchTreeNode>()
  for (const folder of content.folders) {
    byId.set(folder.id, { folder, children: [], assets: [] })
  }
  const rootFolders: SearchTreeNode[] = []
  for (const node of byId.values()) {
    const parentId = node.folder.parent_folder_id
    const parent = parentId ? byId.get(parentId) : undefined
    if (parent) parent.children.push(node)
    else rootFolders.push(node)
  }
  const rootAssets: LibraryContentAsset[] = []
  for (const asset of content.assets) {
    const parent = asset.folder_id ? byId.get(asset.folder_id) : undefined
    if (parent) parent.assets.push(asset)
    else rootAssets.push(asset)
  }
  return { rootFolders, rootAssets }
}

function AssetRow({
  asset,
  mode,
  level,
  organizationId,
  activeId,
  onSelect,
}: {
  asset: LibraryContentAsset
  mode: AssetPickerMode
  level: number
  organizationId: string
  activeId?: string
  onSelect: (id: string, label: string, meta?: AssetPickerSelectMeta) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [executions, setExecutions] = useState<ExecutionItem[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isExecutionMode(mode)) return
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (executions === null) {
      setLoading(true)
      try {
        const data = await getExecutionsByDocumentId(asset.id, organizationId)
        setExecutions((data ?? []) as ExecutionItem[])
      } catch {
        setExecutions([])
      } finally {
        setLoading(false)
      }
    }
  }

  const isDocActive = isDocumentMode(mode) && activeId === asset.id
  const docMeta: AssetPickerSelectMeta = { color: asset.document_type?.color }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => (isDocumentMode(mode) ? onSelect(asset.id, asset.name, docMeta) : undefined)}
        onKeyDown={(e) => e.key === "Enter" && isDocumentMode(mode) && onSelect(asset.id, asset.name, docMeta)}
        className={cn(
          "group flex items-center gap-1.5 py-0.5 px-2 rounded-md hover:bg-accent hover:cursor-pointer",
          isDocActive && "bg-accent font-medium",
        )}
        style={{ paddingLeft: `${level * 12 + 6}px` }}
      >
        {isExecutionMode(mode) && (
          <button
            type="button"
            aria-label="toggle"
            onClick={(e) => { e.stopPropagation(); toggle() }}
            className="shrink-0 hover:cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
            ) : expanded ? (
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
          </button>
        )}
        <File className="h-3.5 w-3.5 shrink-0" style={{ color: asset.document_type?.color || "currentColor" }} />
        <p className="text-sm truncate">{asset.name}</p>
      </div>

      {isExecutionMode(mode) && expanded && executions && executions.map((exec) => {
        const execMeta: AssetPickerSelectMeta = { color: asset.document_type?.color, documentId: asset.id, documentName: asset.name }
        return (
          <div
            key={exec.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(exec.id, executionLabel({ ...exec, document_name: asset.name }), execMeta)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(exec.id, executionLabel({ ...exec, document_name: asset.name }), execMeta)}
            className={cn(
              "group flex items-center gap-1.5 py-0.5 px-2 rounded-md hover:bg-accent hover:cursor-pointer",
              activeId === exec.id && "bg-accent font-medium",
            )}
            style={{ paddingLeft: `${(level + 1) * 12 + 6}px` }}
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-sm truncate">{getExecutionDisplayLabel(exec)}</p>
          </div>
        )
      })}
    </div>
  )
}

function SearchFolder({
  node,
  mode,
  level,
  organizationId,
  activeId,
  onSelect,
}: {
  node: SearchTreeNode
  mode: AssetPickerMode
  level: number
  organizationId: string
  activeId?: string
  onSelect: (id: string, label: string, meta?: AssetPickerSelectMeta) => void
}) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 px-2"
        style={{ paddingLeft: `${level * 12 + 6}px` }}
      >
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        <p className="text-sm truncate text-muted-foreground">{node.folder.name}</p>
      </div>
      {node.children.map((child) => (
        <SearchFolder
          key={child.folder.id}
          node={child}
          mode={mode}
          level={level + 1}
          organizationId={organizationId}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
      {node.assets.map((asset) => (
        <AssetRow
          key={asset.id}
          asset={asset}
          mode={mode}
          level={level + 1}
          organizationId={organizationId}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export interface HuemulAssetTreePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  mode: AssetPickerMode
  value?: string
  onSelect: (id: string, label: string, meta?: AssetPickerSelectMeta) => void
}

export function HuemulAssetTreePickerDialog({
  open,
  onOpenChange,
  organizationId,
  mode,
  value,
  onSelect,
}: HuemulAssetTreePickerDialogProps) {
  const { t } = useTranslation("media")
  const [searchTerm, setSearchTerm] = useState("")
  const [committedSearch, setCommittedSearch] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchData, setSearchData] = useState<LibraryContent | null>(null)
  // Tracks how to load each node's children in browse mode (folder vs document).
  const kindMap = useRef(new Map<string, NodeKind>())

  const handleSelect = useCallback(
    (id: string, label: string, meta?: AssetPickerSelectMeta) => {
      onSelect(id, label, meta)
      onOpenChange(false)
    },
    [onSelect, onOpenChange],
  )

  // ── Browse mode ──
  const loadChildren = useCallback(
    async (folderId: string | null, node?: HuemulTreeNode): Promise<HuemulTreeNode[]> => {
      if (!organizationId) return []
      const kind = folderId ? kindMap.current.get(folderId) : "folder"

      // Expanding a document → load its executions (execution / document-with-version modes).
      if (folderId && kind === "document") {
        const documentName = node?.name
        const color = node?.metadata?.color as string | null | undefined
        const data = (await getExecutionsByDocumentId(folderId, organizationId)) as ExecutionItem[]
        return (data ?? []).map((exec) => ({
          id: exec.id,
          name: getExecutionDisplayLabel(exec) || exec.name,
          type: "execution",
          metadata: { kind: "execution", documentId: folderId, documentName, version: exec.version, color },
        }))
      }

      const content = await getLibraryContent(organizationId, folderId ?? undefined)

      const folderNodes: HuemulTreeNode[] = (content.folders ?? []).map((f) => {
        kindMap.current.set(f.id, "folder")
        return { id: f.id, name: f.name, type: "folder", hasChildren: true, metadata: { kind: "folder" } }
      })

      const assetNodes: HuemulTreeNode[] = (content.assets ?? []).map((a) => {
        kindMap.current.set(a.id, "document")
        if (isExecutionMode(mode)) {
          // Documents are expandable (their executions are the leaves).
          return {
            id: a.id,
            name: a.name,
            type: "folder",
            hasChildren: true,
            metadata: { kind: "document", color: a.document_type?.color },
          }
        }
        // document mode: assets are selectable leaves.
        return {
          id: a.id,
          name: a.name,
          type: "document",
          metadata: { kind: "document", color: a.document_type?.color },
        }
      })

      return [...folderNodes, ...assetNodes]
    },
    [organizationId, mode],
  )

  const handleFileClick = useCallback(
    (node: HuemulTreeNode) => {
      const kind = (node.metadata?.kind as NodeKind) ?? "document"
      if (mode === "document" && kind === "document") {
        handleSelect(node.id, node.name, { color: node.metadata?.color as string | undefined })
      } else if (isExecutionMode(mode) && kind === "execution") {
        const documentId = node.metadata?.documentId as string | undefined
        const documentName = node.metadata?.documentName as string | undefined
        const color = node.metadata?.color as string | null | undefined
        // node.name is already the version-priority label (set in loadChildren).
        const label = documentName ? `${documentName} · ${node.name}` : node.name
        handleSelect(node.id, label, { documentId, documentName, color })
      }
    },
    [mode, handleSelect],
  )

  // Only relevant in document-with-version mode: a document row's main area is
  // rendered as an expandable "folder" node (its executions are the leaves), so
  // HuemulFileTree never routes it through onFileClick. This lets clicking the
  // row body (not the expand chevron) select the document itself, unversioned.
  const handleFolderClick = useCallback(
    (node: HuemulTreeNode) => {
      const kind = (node.metadata?.kind as NodeKind) ?? "folder"
      if (mode === "document-with-version" && kind === "document") {
        handleSelect(node.id, node.name, { color: node.metadata?.color as string | undefined })
      }
    },
    [mode, handleSelect],
  )

  // ── Search mode ──
  const runSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim()
      setCommittedSearch(trimmed)
      if (!trimmed) {
        setSearchData(null)
        return
      }
      setSearchLoading(true)
      try {
        const content = await getLibraryContent(organizationId, undefined, 1, 1000, trimmed)
        setSearchData(content)
      } catch {
        setSearchData(null)
      } finally {
        setSearchLoading(false)
      }
    },
    [organizationId],
  )

  function clearSearch() {
    setSearchTerm("")
    setCommittedSearch("")
    setSearchData(null)
  }

  const searchTree = committedSearch && searchData ? buildSearchTree(searchData) : null
  const searchEmpty =
    !!committedSearch &&
    !searchLoading &&
    searchTree != null &&
    searchTree.rootFolders.length === 0 &&
    searchTree.rootAssets.length === 0

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("picker.title", { defaultValue: "Select" })}
      icon={FolderTree}
      showFooter={false}
      maxWidth="sm:max-w-xl"
    >
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); runSearch(searchTerm) }
              if (e.key === "Escape" && committedSearch) { e.preventDefault(); clearSearch() }
            }}
            placeholder={t("picker.searchPlaceholder")}
            className="pl-8 pr-8 h-9"
          />
          {committedSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:cursor-pointer"
              aria-label={t("picker.clearSearch", { defaultValue: "Clear" })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tree area */}
        <div className="h-[420px] overflow-y-auto rounded-lg border bg-card p-1">
          {committedSearch ? (
            searchLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchEmpty ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("picker.noResults")}</p>
            ) : (
              <div className="space-y-0.5">
                {searchTree?.rootFolders.map((node) => (
                  <SearchFolder
                    key={node.folder.id}
                    node={node}
                    mode={mode}
                    level={0}
                    organizationId={organizationId}
                    activeId={value}
                    onSelect={handleSelect}
                  />
                ))}
                {searchTree?.rootAssets.map((asset) => (
                  <AssetRow
                    key={asset.id}
                    asset={asset}
                    mode={mode}
                    level={0}
                    organizationId={organizationId}
                    activeId={value}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )
          ) : (
            <HuemulFileTree
              key={mode}
              onLoadChildren={loadChildren}
              onFileClick={handleFileClick}
              onFolderClick={handleFolderClick}
              activeNodeId={value}
              folderType="folder"
              showCreateButtons={false}
              showDefaultActions={{ create: false, delete: false, share: false }}
              showBorder={false}
              minHeight="auto"
              renderLeafIcon={leafIconFor}
              renderFolderIcon={(node, expanded) => {
                const kind = (node.metadata?.kind as NodeKind) ?? "folder"
                if (kind === "document") {
                  const color = node.metadata?.color as string | undefined
                  return <File className="h-3.5 w-3.5 shrink-0" style={{ color: color || "currentColor" }} />
                }
                return expanded
                  ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  : <Folder className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              }}
            />
          )}
        </div>
      </div>
    </HuemulDialog>
  )
}

// ─── Trigger field ──────────────────────────────────────────────────────────

export interface HuemulAssetTreePickerFieldProps {
  mode: AssetPickerMode
  organizationId: string
  valueId?: string
  valueLabel?: string
  placeholder?: string
  label?: string
  onPick: (id: string, label: string) => void
  onClear?: () => void
}

export function HuemulAssetTreePickerField({
  mode,
  organizationId,
  valueId,
  valueLabel,
  placeholder,
  label,
  onPick,
  onClear,
}: HuemulAssetTreePickerFieldProps) {
  const { t } = useTranslation("media")
  const [open, setOpen] = useState(false)
  const display = valueId ? (valueLabel || valueId) : (placeholder ?? t("picker.parentEmpty", { defaultValue: "Select…" }))

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && <p className="text-sm font-medium leading-snug">{label}</p>}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-9 flex-1 items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm hover:bg-accent hover:cursor-pointer min-w-0",
            !valueId && "text-muted-foreground",
          )}
        >
          <span className="truncate">{display}</span>
          <FolderTree className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
        {valueId && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 hover:cursor-pointer"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <HuemulAssetTreePickerDialog
        open={open}
        onOpenChange={setOpen}
        organizationId={organizationId}
        mode={mode}
        value={valueId}
        onSelect={onPick}
      />
    </div>
  )
}
