import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronRight, Folder, ExternalLink, Loader2, Play } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useEffectiveOrgId } from "@/hooks/useOrgRouter"
import { getTemplateChildDocuments } from "@/services/templates"
import type { ChildDocumentFolder, ChildDocument, ChildDocumentExecution } from "@/services/templates"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface AssetSelectionPanelProps {
  templateId: string
  onExecute?: (executionIds: string[]) => void
  isExecuting?: boolean
  executeDisabled?: boolean
}

export function AssetSelectionPanel({ templateId, onExecute, isExecuting, executeDisabled }: AssetSelectionPanelProps) {
  const { t } = useTranslation("advanced")
  const { selectedOrganizationId } = useOrganization()
  const orgId = useEffectiveOrgId()

  const [folders, setFolders] = useState<ChildDocumentFolder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [selectedExecutions, setSelectedExecutions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!templateId || !selectedOrganizationId) {
      setFolders([])
      setSelectedExecutions(new Set())
      return
    }
    setIsLoading(true)
    setSelectedExecutions(new Set())
    getTemplateChildDocuments(templateId, selectedOrganizationId)
      .then((res) => {
        setFolders(res.data)
        setExpandedFolders(new Set(res.data.map((f) => f.folder_id ?? "__no_folder__")))
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [templateId, selectedOrganizationId])

  // Compute all execution IDs across all folders/docs/versions
  const allExecutionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const folder of folders) {
      for (const doc of folder.documents) {
        for (const exec of doc.executions) {
          ids.add(exec.id)
        }
      }
    }
    return ids
  }, [folders])

  const totalExecutions = useMemo(() => allExecutionIds.size, [allExecutionIds])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const toggleDocExpand = (docId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(docId)) next.delete(docId)
      else next.add(docId)
      return next
    })
  }

  const toggleExecution = (executionId: string) => {
    setSelectedExecutions((prev) => {
      const next = new Set(prev)
      if (next.has(executionId)) next.delete(executionId)
      else next.add(executionId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedExecutions.size === allExecutionIds.size) {
      setSelectedExecutions(new Set())
    } else {
      setSelectedExecutions(new Set(allExecutionIds))
    }
  }

  const isAllDocExecutionsSelected = (doc: ChildDocument) => {
    return doc.executions.length > 0 && doc.executions.every((e) => selectedExecutions.has(e.id))
  }

  const isSomeDocExecutionsSelected = (doc: ChildDocument) => {
    return doc.executions.some((e) => selectedExecutions.has(e.id))
  }

  const toggleDocAllExecutions = (doc: ChildDocument) => {
    if (doc.executions.length === 0) return
    setSelectedExecutions((prev) => {
      const next = new Set(prev)
      const allSelected = doc.executions.every((e) => next.has(e.id))
      for (const exec of doc.executions) {
        if (allSelected) next.delete(exec.id)
        else next.add(exec.id)
      }
      return next
    })
  }

  const isFolderAllSelected = (folder: ChildDocumentFolder) => {
    return folder.documents.length > 0 && folder.documents.every((d) => isAllDocExecutionsSelected(d))
  }

  const isFolderSomeSelected = (folder: ChildDocumentFolder) => {
    return folder.documents.some((d) => isSomeDocExecutionsSelected(d))
  }

  const handleNavigateToDoc = (docId: string, executionId?: string) => {
    const path = executionId
      ? `/${orgId}/asset/${docId}?execution=${encodeURIComponent(executionId)}`
      : `/${orgId}/asset/${docId}`
    window.open(window.location.origin + path, '_blank', 'noopener,noreferrer')
  }

  const toggleFolderSelection = (folder: ChildDocumentFolder) => {
    setSelectedExecutions((prev) => {
      const next = new Set(prev)
      const allSelected = folder.documents.every((d) =>
        d.executions.every((e) => next.has(e.id))
      )
      for (const doc of folder.documents) {
        for (const exec of doc.executions) {
          if (allSelected) next.delete(exec.id)
          else next.add(exec.id)
        }
      }
      return next
    })
  }

  if (!templateId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        {t("assetSelection.selectTemplateFirst")}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("assetSelection.loading")}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold">{t("assetSelection.title")}</h2>
        <span className="text-xs text-primary font-medium">
          {selectedExecutions.size} {t("assetSelection.selected")}
        </span>
      </div>

      {/* Select all */}
      <div className="flex items-center justify-between py-2 border-b">
        <label className="flex items-center gap-2 text-sm hover:cursor-pointer">
          <Checkbox
            checked={totalExecutions > 0 && selectedExecutions.size === totalExecutions}
            onCheckedChange={toggleSelectAll}
          />
          {t("assetSelection.selectAll")}
        </label>
        <span className="text-xs text-muted-foreground">
          {totalExecutions} {t("assetSelection.available")}
        </span>
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide mt-2">
        {folders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("assetSelection.noAssets")}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {folders.map((folder) => (
            <FolderGroup
              key={folder.folder_id ?? "__no_folder__"}
              folder={folder}
              expanded={expandedFolders.has(folder.folder_id ?? "__no_folder__")}
              expandedDocs={expandedDocs}
              selectedExecutions={selectedExecutions}
              onToggleFolder={() => toggleFolder(folder.folder_id ?? "__no_folder__")}
              onToggleFolderSelection={() => toggleFolderSelection(folder)}
              isFolderAllSelected={isFolderAllSelected(folder)}
              isFolderSomeSelected={isFolderSomeSelected(folder)}
              onToggleDocExpand={toggleDocExpand}
              onToggleExecution={toggleExecution}
              onToggleDocAllExecutions={toggleDocAllExecutions}
              isAllDocExecutionsSelected={isAllDocExecutionsSelected}
              isSomeDocExecutionsSelected={isSomeDocExecutionsSelected}
              onNavigateToDoc={handleNavigateToDoc}
            />
          ))}
        </div>
      </div>

      {/* Execute button */}
      {onExecute && (
        <div className="pt-4 border-t mt-2">
          <Button
            className="w-full hover:cursor-pointer"
            disabled={selectedExecutions.size === 0 || isExecuting || executeDisabled}
            onClick={() => onExecute(Array.from(selectedExecutions))}
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isExecuting
              ? t("assetSelection.executing")
              : `${t("assetSelection.execute")} (${selectedExecutions.size})`}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Folder Group ────────────────────────────────────────────────────────────

interface FolderGroupProps {
  folder: ChildDocumentFolder
  expanded: boolean
  expandedDocs: Set<string>
  selectedExecutions: Set<string>
  onToggleFolder: () => void
  onToggleFolderSelection: () => void
  isFolderAllSelected: boolean
  isFolderSomeSelected: boolean
  onToggleDocExpand: (docId: string) => void
  onToggleExecution: (executionId: string) => void
  onToggleDocAllExecutions: (doc: ChildDocument) => void
  isAllDocExecutionsSelected: (doc: ChildDocument) => boolean
  isSomeDocExecutionsSelected: (doc: ChildDocument) => boolean
  onNavigateToDoc: (docId: string, executionId?: string) => void
}

function FolderGroup({
  folder,
  expanded,
  expandedDocs,
  selectedExecutions,
  onToggleFolder,
  onToggleFolderSelection,
  isFolderAllSelected,
  isFolderSomeSelected,
  onToggleDocExpand,
  onToggleExecution,
  onToggleDocAllExecutions,
  isAllDocExecutionsSelected,
  isSomeDocExecutionsSelected,
  onNavigateToDoc,
}: FolderGroupProps) {
  const { t } = useTranslation("advanced")
  return (
    <div className="rounded-lg border">
      {/* Folder header */}
      <button
        type="button"
        onClick={onToggleFolder}
        className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/50 hover:cursor-pointer transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isFolderAllSelected ? true : isFolderSomeSelected ? "indeterminate" : false}
            onCheckedChange={() => onToggleFolderSelection()}
            onClick={(e) => e.stopPropagation()}
          />
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Folder className="h-4 w-4 text-amber-500" />
          <span className={`text-sm font-medium ${!folder.folder_name ? 'italic text-muted-foreground' : ''}`}>
            {folder.folder_name || t("assetSelection.uncategorized")}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{folder.documents.length}</span>
      </button>

      {/* Documents */}
      {expanded && (
        <div className="border-t">
          {folder.documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              expandedDocs={expandedDocs}
              selectedExecutions={selectedExecutions}
              onToggleDocExpand={onToggleDocExpand}
              onToggleExecution={onToggleExecution}
              onToggleDocAllExecutions={onToggleDocAllExecutions}
              isAllSelected={isAllDocExecutionsSelected(doc)}
              isSomeSelected={isSomeDocExecutionsSelected(doc)}
              onNavigateToDoc={onNavigateToDoc}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Document Row ────────────────────────────────────────────────────────────

interface DocumentRowProps {
  doc: ChildDocument
  expandedDocs: Set<string>
  selectedExecutions: Set<string>
  onToggleDocExpand: (docId: string) => void
  onToggleExecution: (executionId: string) => void
  onToggleDocAllExecutions: (doc: ChildDocument) => void
  isAllSelected: boolean
  isSomeSelected: boolean
  onNavigateToDoc: (docId: string, executionId?: string) => void
}

function DocumentRow({
  doc,
  expandedDocs,
  selectedExecutions,
  onToggleDocExpand,
  onToggleExecution,
  onToggleDocAllExecutions,
  isAllSelected,
  isSomeSelected,
  onNavigateToDoc,
}: DocumentRowProps) {
  const { t } = useTranslation("advanced")
  const expanded = expandedDocs.has(doc.id)
  const hasExecutions = doc.executions.length > 0

  return (
    <div>
      {/* Main document row */}
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
        <Checkbox
          checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
          onCheckedChange={() => onToggleDocAllExecutions(doc)}
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm truncate block">
            {doc.internal_code && (
              <span className="text-muted-foreground">{doc.internal_code} </span>
            )}
            {doc.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasExecutions && (
            <button
              type="button"
              onClick={() => onToggleDocExpand(doc.id)}
              className="text-[10px] text-purple-600 hover:underline hover:cursor-pointer"
            >
              {expanded ? t("assetSelection.hideVersions") : `${doc.executions.length} ${t("assetSelection.versions")}`}
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigateToDoc(doc.id)}
            className="hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            title={t("assetSelection.openAsset")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded versions */}
      {expanded && (
        <div className="max-h-40 overflow-y-auto">
          {doc.executions.map((exec, i) => (
            <ExecutionRow
              key={exec.id}
              execution={exec}
              selected={selectedExecutions.has(exec.id)}
              onToggle={() => onToggleExecution(exec.id)}
              isLatest={i === 0}
              onNavigate={() => onNavigateToDoc(doc.id, exec.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Execution Row ───────────────────────────────────────────────────────────

interface ExecutionRowProps {
  execution: ChildDocumentExecution
  selected: boolean
  onToggle: () => void
  isLatest?: boolean
  onNavigate: () => void
}

function ExecutionRow({ execution, selected, onToggle, isLatest, onNavigate }: ExecutionRowProps) {
  const { t } = useTranslation("advanced")
  return (
    <div className="flex items-center gap-2 pl-8 pr-3 py-1.5 hover:bg-muted/30 transition-colors">
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <span className="text-sm text-muted-foreground truncate flex-1">{execution.name}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        {isLatest && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
            Latest
          </span>
        )}
        {execution.version && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
            {execution.version}
          </span>
        )}
        <button
          type="button"
          onClick={onNavigate}
          className="hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          title={t("assetSelection.openVersion")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
