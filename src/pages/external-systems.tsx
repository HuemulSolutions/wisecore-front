import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Edit2, Globe, Plus, RefreshCw, Search, Trash2, X, Zap } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useExternalSystems } from "@/hooks/useExternalSystems"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useDebounce } from "@/hooks/use-debounce"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulFileTree, type HuemulFileTreeRef } from "@/huemul/components/huemul-file-tree"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { HuemulTreeNode, HuemulTreeMenuAction } from "@/types/huemul-tree"
import type { ExternalSystem } from "@/types/external-systems"
import type { ExternalFunctionality } from "@/types/external-functionalities"
import { getExternalFunctionalities } from "@/services/external-functionalities"
import {
  ExternalSystemsLoadingState,
  ExternalSystemsErrorState,
  ExternalSystemDetail,
  ExternalSystemCreateDialog,
  ExternalSystemEditDialog,
  ExternalSystemDeleteDialog,
} from "@/components/external-systems"
import {
  ExternalFunctionalityDetail,
  ExternalFunctionalityCreateDialog,
  ExternalFunctionalityEditDialog,
  ExternalFunctionalityDeleteDialog,
} from "@/components/external-functionalities"

interface PageState {
  searchTerm: string
  isSearchOpen: boolean
  selectedSystem: ExternalSystem | null
  selectedFunctionality: ExternalFunctionality | null
  showCreateDialog: boolean
  editingSystem: ExternalSystem | null
  deletingSystem: ExternalSystem | null
  showCreateFunctionalityDialog: boolean
  createFunctionalitySystemId: string | null
  editingFunctionality: ExternalFunctionality | null
  editingFunctionalitySystemId: string | null
  deletingFunctionality: ExternalFunctionality | null
  deletingFunctionalitySystemId: string | null
}

export default function ExternalSystemsPage() {
  const { t } = useTranslation(["external-systems", "external-functionalities"])
  const { selectedOrganizationId } = useOrganization()
  const orgId = selectedOrganizationId ?? ""

  const [state, setState] = useState<PageState>({
    searchTerm: "",
    isSearchOpen: false,
    selectedSystem: null,
    selectedFunctionality: null,
    showCreateDialog: false,
    editingSystem: null,
    deletingSystem: null,
    showCreateFunctionalityDialog: false,
    createFunctionalitySystemId: null,
    editingFunctionality: null,
    editingFunctionalitySystemId: null,
    deletingFunctionality: null,
    deletingFunctionalitySystemId: null,
  })

  const debouncedSearch = useDebounce(state.searchTerm, 300)

  const { data, isLoading, isFetching, error, refetch } = useExternalSystems(orgId, {
    page: 1,
    pageSize: 200,
    search: debouncedSearch || undefined,
  })

  const { showPageLoader } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!data,
  })

  const treeRef = useRef<HuemulFileTreeRef>(null)
  const systemsRef = useRef<Map<string, ExternalSystem>>(new Map())
  const functionalitiesRef = useRef<Map<string, { functionality: ExternalFunctionality; systemId: string }>>(new Map())

  const systems = data?.data ?? []
  systemsRef.current = new Map(systems.map((s) => [s.id, s]))

  useEffect(() => {
    treeRef.current?.refresh()
  }, [data])

  const handleLoadChildren = useCallback(
    async (parentId: string | null): Promise<HuemulTreeNode[]> => {
      // Root level → return external systems as folder nodes
      if (parentId === null) {
        return Array.from(systemsRef.current.values()).map((s) => ({
          id: s.id,
          name: s.name,
          type: "external-system",
          hasChildren: true,
        }))
      }
      // System level → fetch and return functionalities as leaf nodes
      try {
        const response = await getExternalFunctionalities(orgId, parentId, { page: 1, page_size: 200 })
        for (const f of response.data) {
          functionalitiesRef.current.set(f.id, { functionality: f, systemId: parentId })
        }
        return response.data.map((f) => ({
          id: f.id,
          name: f.name,
          type: "external-functionality",
        }))
      } catch {
        return []
      }
    },
    [orgId],
  )

  const handleFileClick = useCallback((node: HuemulTreeNode) => {
    if (node.type === "external-functionality") {
      const entry = functionalitiesRef.current.get(node.id)
      if (entry) {
        setState((s) => ({
          ...s,
          selectedFunctionality: entry.functionality,
          selectedSystem: null,
        }))
      }
    }
  }, [])

  const handleFolderClick = useCallback((node: HuemulTreeNode) => {
    if (node.type === "external-system") {
      const system = systemsRef.current.get(node.id)
      if (system) {
        setState((s) => ({
          ...s,
          selectedSystem: system,
          selectedFunctionality: null,
        }))
      }
    }
  }, [])

  const handleToggleSearch = useCallback(() => {
    setState((s) => ({
      ...s,
      isSearchOpen: !s.isSearchOpen,
      searchTerm: s.isSearchOpen ? "" : s.searchTerm,
    }))
  }, [])

  const menuActions = useMemo<HuemulTreeMenuAction[]>(
    () => [
      // ── System actions ──────────────────────────────────────────────────────
      {
        label: t("external-functionalities:addFunctionality"),
        icon: <Plus className="h-4 w-4" />,
        show: (node) => node.type === "external-system",
        onClick: async (nodeId) => {
          setState((s) => ({
            ...s,
            showCreateFunctionalityDialog: true,
            createFunctionalitySystemId: nodeId,
          }))
        },
      },
      {
        label: t("external-functionalities:actions.edit"),
        icon: <Edit2 className="h-4 w-4" />,
        show: (node) => node.type === "external-system",
        onClick: async (nodeId) => {
          const system = systemsRef.current.get(nodeId)
          if (system) setState((s) => ({ ...s, editingSystem: system }))
        },
      },
      {
        label: t("external-systems:actions.delete"),
        variant: "destructive",
        icon: <Trash2 className="h-4 w-4" />,
        show: (node) => node.type === "external-system",
        onClick: async (nodeId) => {
          const system = systemsRef.current.get(nodeId)
          if (system) setState((s) => ({ ...s, deletingSystem: system }))
        },
      },
      // ── Functionality actions ───────────────────────────────────────────────
      {
        label: t("external-functionalities:actions.edit"),
        icon: <Edit2 className="h-4 w-4" />,
        show: (node) => node.type === "external-functionality",
        onClick: async (nodeId) => {
          const entry = functionalitiesRef.current.get(nodeId)
          if (entry) {
            setState((s) => ({
              ...s,
              editingFunctionality: entry.functionality,
              editingFunctionalitySystemId: entry.systemId,
            }))
          }
        },
      },
      {
        label: t("external-functionalities:actions.delete"),
        variant: "destructive",
        icon: <Trash2 className="h-4 w-4" />,
        show: (node) => node.type === "external-functionality",
        onClick: async (nodeId) => {
          const entry = functionalitiesRef.current.get(nodeId)
          if (entry) {
            setState((s) => ({
              ...s,
              deletingFunctionality: entry.functionality,
              deletingFunctionalitySystemId: entry.systemId,
            }))
          }
        },
      },
    ],
    [t],
  )

  // Detail panel: render functionality detail or system detail
  const renderDetail = () => {
    if (state.selectedFunctionality) {
      return (
        <ExternalFunctionalityDetail
          functionality={state.selectedFunctionality}
          organizationId={orgId}
          systemId={functionalitiesRef.current.get(state.selectedFunctionality.id)?.systemId ?? ""}
          onEdit={() => {
            const entry = functionalitiesRef.current.get(state.selectedFunctionality!.id)
            setState((s) => ({
              ...s,
              editingFunctionality: s.selectedFunctionality,
              editingFunctionalitySystemId: entry?.systemId ?? null,
            }))
          }}
          onDelete={() => {
            const entry = functionalitiesRef.current.get(state.selectedFunctionality!.id)
            setState((s) => ({
              ...s,
              deletingFunctionality: s.selectedFunctionality,
              deletingFunctionalitySystemId: entry?.systemId ?? null,
            }))
          }}
        />
      )
    }
    return (
      <ExternalSystemDetail
        system={state.selectedSystem}        organizationId={orgId}        onAddFunctionality={
          state.selectedSystem
            ? () =>
                setState((s) => ({
                  ...s,
                  showCreateFunctionalityDialog: true,
                  createFunctionalitySystemId: s.selectedSystem?.id ?? null,
                }))
            : undefined
        }
        onEdit={
          state.selectedSystem
            ? () => setState((s) => ({ ...s, editingSystem: s.selectedSystem }))
            : undefined
        }
        onDelete={
          state.selectedSystem
            ? () => setState((s) => ({ ...s, deletingSystem: s.selectedSystem }))
            : undefined
        }
      />
    )
  }

  if (showPageLoader) return <ExternalSystemsLoadingState />

  return (
    <>
      <HuemulPageLayout
        columns={[
          {
            content: error ? (
              <ExternalSystemsErrorState error={error} onRetry={() => refetch()} />
            ) : (
              <div className="flex flex-col gap-0 px-4 py-3">
                {/* Header — matches nav-knowledge style */}
                <div className="flex items-center justify-between py-1 px-2">
                  <span className="text-xs font-medium text-muted-foreground">{t("header.title")}</span>
                  <div className="flex items-center gap-1">
                    <HuemulButton
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      icon={state.isSearchOpen ? X : Search}
                      iconClassName="h-4 w-4"
                      tooltip={state.isSearchOpen ? t("header.closeSearch") : t("header.search")}
                      onClick={handleToggleSearch}
                    />
                    <HuemulButton
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      icon={RefreshCw}
                      iconClassName="h-4 w-4"
                      tooltip={t("header.refresh")}
                      loading={isFetching}
                      onClick={() => { refetch() }}
                    />
                    <HuemulButton
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      icon={Plus}
                      iconClassName="h-4 w-4"
                      tooltip={t("header.newSystem")}
                      onClick={() => setState((s) => ({ ...s, showCreateDialog: true }))}
                    />
                  </div>
                </div>

                {/* Search input — shown only when toggle is active */}
                {state.isSearchOpen && (
                  <div className="px-2 pt-1 pb-1">
                    <HuemulField
                      label=""
                      type="text"
                      placeholder={t("header.searchPlaceholder")}
                      value={state.searchTerm}
                      onChange={(v) => setState((s) => ({ ...s, searchTerm: String(v) }))}
                      inputClassName="h-7 text-xs"
                      autoFocus
                    />
                  </div>
                )}

                {/* File tree — systems as folders, functionalities as leaves */}
                <div>
                  <HuemulFileTree
                    ref={treeRef}
                    onLoadChildren={handleLoadChildren}
                    onFileClick={handleFileClick}
                    onFolderClick={handleFolderClick}
                    activeNodeId={state.selectedFunctionality?.id ?? state.selectedSystem?.id}
                    menuActions={menuActions}
                    showDefaultActions={{ create: false, delete: false, share: false }}
                    showCreateButtons={false}
                    folderType="external-system"
                    renderLeafIcon={(node) =>
                      node.type === "external-functionality" ? (
                        <Zap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )
                    }
                    renderFolderIcon={() => (
                      <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    showBorder={false}
                    minHeight="200px"
                  />
                </div>
              </div>
            ),
            defaultSize: 20,
          },
          {
            content: renderDetail(),
            defaultSize: 80,
            minSize: 50,
          },
        ]}
      />

      <ExternalSystemCreateDialog
        open={state.showCreateDialog}
        onOpenChange={(open) => setState((s) => ({ ...s, showCreateDialog: open }))}
        organizationId={orgId}
      />

      <ExternalSystemEditDialog
        open={!!state.editingSystem}
        onOpenChange={(open) => !open && setState((s) => ({ ...s, editingSystem: null }))}
        organizationId={orgId}
        system={state.editingSystem}
      />

      <ExternalSystemDeleteDialog
        open={!!state.deletingSystem}
        onOpenChange={(open) => !open && setState((s) => ({ ...s, deletingSystem: null }))}
        organizationId={orgId}
        system={state.deletingSystem}
        onDeleted={() => {
          setState((s) => ({
            ...s,
            deletingSystem: null,
            selectedSystem:
              s.selectedSystem?.id === s.deletingSystem?.id ? null : s.selectedSystem,
            selectedFunctionality:
              functionalitiesRef.current.get(s.selectedFunctionality?.id ?? "")?.systemId ===
              s.deletingSystem?.id
                ? null
                : s.selectedFunctionality,
          }))
        }}
      />

      {/* Functionality dialogs */}
      <ExternalFunctionalityCreateDialog
        open={state.showCreateFunctionalityDialog}
        onOpenChange={(open) =>
          setState((s) => ({
            ...s,
            showCreateFunctionalityDialog: open,
            createFunctionalitySystemId: open ? s.createFunctionalitySystemId : null,
          }))
        }
        organizationId={orgId}
        systemId={state.createFunctionalitySystemId ?? ""}
        onSuccess={() => treeRef.current?.refresh()}
      />

      <ExternalFunctionalityEditDialog
        open={!!state.editingFunctionality}
        onOpenChange={(open) =>
          !open &&
          setState((s) => ({ ...s, editingFunctionality: null, editingFunctionalitySystemId: null }))
        }
        organizationId={orgId}
        systemId={state.editingFunctionalitySystemId ?? ""}
        functionality={state.editingFunctionality}
      />

      <ExternalFunctionalityDeleteDialog
        open={!!state.deletingFunctionality}
        onOpenChange={(open) =>
          !open &&
          setState((s) => ({
            ...s,
            deletingFunctionality: null,
            deletingFunctionalitySystemId: null,
          }))
        }
        organizationId={orgId}
        systemId={state.deletingFunctionalitySystemId ?? ""}
        functionality={state.deletingFunctionality}
        onDeleted={() => {
          setState((s) => ({
            ...s,
            deletingFunctionality: null,
            deletingFunctionalitySystemId: null,
            selectedFunctionality:
              s.selectedFunctionality?.id === s.deletingFunctionality?.id
                ? null
                : s.selectedFunctionality,
          }))
        }}
      />
    </>
  )
}

