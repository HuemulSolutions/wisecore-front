import { useCallback, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Bot,
  BookOpen,
  Compass,
  Eye,
  Globe,
  Library,
  Lock,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react"
import { AssetContent } from "@/components/assets"
import {
  AddButtons,
  AddChildCollectionDialog,
  CollectionAccessSheet,
  CollectionFormSheet,
  CollectionIndex,
  CopyModeLinkButton,
  ViewModeMenuItems,
  CollectionsErrorState,
  resolveViewMode,
  viewModeParam,
} from "@/components/collections"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HuemulAssetTreePickerDialog } from "@/huemul/components/huemul-asset-tree-picker"
import { useOrganization } from "@/contexts/organization-context"
import { buildAssetFullscreenPath } from "@/lib/asset-fullscreen-url"
import { currentPath } from "@/lib/return-url"
import { applyOrder } from "@/components/collections/collection-order"
import { Badge } from "@/components/ui/badge"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { collectionsQueryKeys, useCollection, useCollectionAccess, useCollectionMutations } from "@/hooks/useCollections"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { usePageAccess } from "@/hooks/usePageAccess"
import type { CollectionGroup, CollectionItem, CollectionItemOrderEntry } from "@/types/collections"
import type { LibraryItem } from "@/types/assets"
import { ApiError } from "@/types/api-error"

// Un ítem del menú que abre un diálogo o sheet espera a que el menú termine de cerrarse.
const afterMenuCloses = (action: () => void) => () => {
  setTimeout(action, 0)
}

type PendingDelete =
  | { kind: "collection" }
  | { kind: "group"; group: CollectionGroup }
  | { kind: "item"; item: CollectionItem }

/** `?item=rules`: las reglas generales como entrada del índice (`show_instructions_in_menu`). */
const RULES_ENTRY = "rules"

/**
 * Detalle de una colección: índice a la izquierda (portada, reglas, activos sin grupo y
 * cada grupo), y al centro el activo elegido con el mismo `AssetContent` de
 * /asset (que trae su propio panel lateral de media, relaciones, etc.). El ítem
 * elegido va en `?item=` para que un refresh o un link caigan en el mismo lugar; si
 * es de una sub-colección, `?in=` dice de cuál (su detalle se pide con los permisos
 * de quien mira, igual que al desplegarla en el índice). La portada es el activo
 * marcado `is_home` o, si no hay, el resumen de la colección. `?view=reader` (solo
 * para quien administra) oculta todo lo de edición, para ver la colección como la ve
 * el resto.
 */
export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation(["collections", "common"])
  const navigate = useOrgNavigate()
  const queryClient = useQueryClient()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess("collections")
  const {
    data: detail,
    isLoading,
    error,
    isFetching: isFetchingDetail,
    refetch: refetchDetail,
  } = useCollection(collectionId, canAccessPage && can("viewCollection"))
  const mutations = useCollectionMutations()
  // Edición (solo quien administra), Lectura (la colección sin edición) o Solo visualización
  // (además, los activos sin ninguna acción de edición). Ver `resolveViewMode`.
  const viewMode = resolveViewMode(searchParams.get("view"), !!detail?.can_admin)
  const readerMode = viewMode !== "edit"
  // Los accesos (resumen de la portada y "Quién puede verla") solo los gestiona quien
  // administra la colección y tiene el permiso de editarla.
  const canShare =
    !readerMode && !!detail?.can_admin && can(detail.for_agent ? "updateAgentCollection" : "shareCollection")
  const {
    data: accessList,
    isError: isAccessError,
    isFetching: isFetchingAccess,
    refetch: refetchAccess,
  } = useCollectionAccess(collectionId, canShare)

  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)
  // Grupo destino del selector de activos abierto (`undefined` = cerrado, `null` = sin grupo).
  const [addingToGroup, setAddingToGroup] = useState<string | null | undefined>(undefined)
  // Lo mismo para el selector de sub-colecciones.
  const [addingCollectionsToGroup, setAddingCollectionsToGroup] = useState<string | null | undefined>(undefined)
  const { selectedOrganizationId } = useOrganization()
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  // Versión elegida a mano para un ítem; si no hay, la del ítem (la fija o la oficial). Se
  // deriva del ítem, así `?item=` (link o recarga) respeta la versión fijada.
  const [executionOverride, setExecutionOverride] = useState<{ itemId: string; executionId: string | null } | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

  const itemParam = searchParams.get("item")
  const rulesSelected = itemParam === RULES_ENTRY && !!detail?.show_instructions_in_menu && !!detail.instructions
  const selectedItemId = rulesSelected ? null : itemParam
  // Colección del ítem elegido cuando es de una sub-colección (ya está en caché si se desplegó).
  const inParam = searchParams.get("in")
  const sourceCollectionId = inParam && inParam !== collectionId ? inParam : undefined
  const { data: sourceDetail } = useCollection(sourceCollectionId, !!sourceCollectionId && canAccessPage && can("viewCollection"))
  const selectedItem = useMemo(() => {
    const items = sourceCollectionId ? sourceDetail?.items : detail?.items
    return items?.find((item) => item.id === selectedItemId && item.kind === "document" && item.document_id) ?? null
  }, [detail?.items, sourceDetail?.items, sourceCollectionId, selectedItemId])
  // Lo que se muestra al centro: el ítem elegido o, en la portada, el activo de portada.
  const homeItem = useMemo(
    () => detail?.items.find((item) => item.is_home && item.kind === "document") ?? null,
    [detail?.items],
  )
  const shownItem = selectedItem ?? (rulesSelected || selectedItemId ? null : homeItem)
  const selectedExecutionId =
    executionOverride && executionOverride.itemId === shownItem?.id
      ? executionOverride.executionId
      : (shownItem?.version?.execution_id ?? null)
  const setSelectedExecutionId = useCallback(
    (executionId: string | null) => {
      if (shownItem) setExecutionOverride({ itemId: shownItem.id, executionId })
    },
    [shownItem],
  )
  const selectedFile: LibraryItem | null = useMemo(
    () => (shownItem?.document_id ? { id: shownItem.document_id, name: shownItem.title ?? "", type: "document" } : null),
    [shownItem],
  )

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key)
        else next.set(key, value)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const selectItem = useCallback(
    (item: CollectionItem | null, inCollectionId?: string) => {
      updateParams({
        item: item?.id ?? null,
        in: item && inCollectionId && inCollectionId !== collectionId ? inCollectionId : null,
      })
      setExecutionOverride(null)
      setSelectedSectionId(null)
    },
    [updateParams, collectionId],
  )

  if (isLoadingPermissions || isLoading) return <PageSkeleton />
  if (!canAccessPage || !can("viewCollection")) return <HuemulAccessDenied />
  // Solo un 404 es "no existe o no tienes acceso"; cualquier otro error se puede reintentar.
  if (error && !(ApiError.isApiError(error) && error.statusCode === 404)) {
    return (
      <div className="p-6">
        <CollectionsErrorState error={error} onRetry={() => refetchDetail()} />
      </div>
    )
  }
  if (error || !detail || !collectionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Library className="size-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">{t("detail.notFound")}</p>
      </div>
    )
  }

  const canManage =
    !readerMode && detail.can_admin && (detail.for_agent ? can("updateAgentCollection") : can("updateCollection"))
  const canDelete =
    !readerMode && detail.can_admin && (detail.for_agent ? can("deleteAgentCollection") : can("deleteCollection"))
  const rulesInMenu = detail.show_instructions_in_menu && !!detail.instructions
  const KindIcon = detail.agent_kind === "behavior" ? Compass : BookOpen
  const accesses = accessList?.accesses
  // Recarga la colección y todas sus sub-colecciones abiertas (cada una es su propio detalle).
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.details(selectedOrganizationId) })
    if (canShare) refetchAccess()
  }

  // Agregar sub-colecciones exige además listar colecciones (el selector usa GET /collections/).
  const addCollections = canManage && can("addChildCollection") ? setAddingCollectionsToGroup : undefined

  const reorder = (entries: CollectionItemOrderEntry[]) =>
    mutations.reorderItems.mutate({ collectionId, items: entries, optimistic: applyOrder(detail, entries) })

  const confirmDelete = async () => {
    if (!pendingDelete) return
    if (pendingDelete.kind === "collection") {
      await mutations.deleteCollection.mutateAsync(collectionId)
      navigate("/collections")
    } else if (pendingDelete.kind === "group") {
      await mutations.deleteGroup.mutateAsync({ collectionId, groupId: pendingDelete.group.id })
    } else {
      await mutations.removeItem.mutateAsync({ collectionId, itemId: pendingDelete.item.id })
      if (pendingDelete.item.id === selectedItemId) selectItem(null)
    }
  }

  const deleteTexts =
    pendingDelete?.kind === "collection"
      ? { title: t("detail.deleteTitle"), description: t("detail.deleteDescription", { name: detail.name }) }
      : pendingDelete?.kind === "group"
        ? { title: t("detail.deleteGroup"), description: t("detail.deleteGroupDescription", { name: pendingDelete.group.name }) }
        : {
            title: t("detail.removeItem"),
            description: t(
              pendingDelete?.item.kind === "collection" ? "detail.removeCollectionDescription" : "detail.removeItemDescription",
              { name: pendingDelete?.item.collection?.name ?? pendingDelete?.item.title ?? "" },
            ),
          }

  const cover = (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {detail.for_agent ? (
            <>
              <Badge variant="secondary" className="gap-1">
                <Bot className="size-3" />
                {t("card.agent")}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <KindIcon className="size-3" />
                {detail.agent_kind === "behavior" ? t("card.behavior") : t("card.knowledge")}
              </Badge>
            </>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Users className="size-3" />
              {t("card.human")}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            {detail.is_public ? <Globe className="size-3" /> : <Lock className="size-3" />}
            {detail.is_public ? t("card.public") : t("card.private")}
          </Badge>
        </div>
        {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}
        {canShare && (
          <button
            type="button"
            onClick={() => setSharing(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:cursor-pointer hover:text-foreground"
          >
            {detail.is_public ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
            {/* Sin los accesos cargados no se muestran conteos: un 0 sería falso. */}
            {detail.is_public
              ? t("access.summaryPublic")
              : accesses && !isAccessError
                ? t("access.summaryPrivate", {
                    roles: accesses.filter((access) => access.role_id).length,
                    people: accesses.filter((access) => access.user_id).length,
                  })
                : t("card.private")}
          </button>
        )}
      </div>

      {detail.for_agent && (
        <dl className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-medium">{t("detail.agentIdentifier")}</dt>
          <dd>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{detail.agent_slug}</code>
          </dd>
          <dt className="font-medium">{t("detail.usage")}</dt>
          <dd className="text-muted-foreground">{detail.agent_usage}</dd>
        </dl>
      )}

      {!rulesInMenu && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">{t("detail.instructionsTitle")}</h2>
          {detail.instructions ? (
            <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">{detail.instructions}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">{t("detail.noInstructions")}</p>
          )}
        </section>
      )}

      {detail.items.length > 0 ? (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t("detail.selectAsset")}</p>
          {canManage && <p className="text-xs text-muted-foreground">{t("detail.coverHint")}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground">{t("detail.emptyIndex")}</p>
          {canManage && (
            <AddButtons onAddItems={() => setAddingToGroup(null)} onAddCollections={addCollections && (() => addCollections(null))} />
          )}
        </div>
      )}
    </div>
  )

  const rulesView = (
    <div className="mx-auto max-w-3xl space-y-3 p-6">
      <h2 className="text-lg font-semibold">{t("detail.instructionsTitle")}</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{detail.instructions}</p>
    </div>
  )

  return (
    <>
      <HuemulPageLayout
        header={
          <div className="border-b">
            <div className="flex h-12 items-center gap-2 px-3">
              <HuemulButton
                variant="ghost"
                size="icon"
                className="size-8"
                icon={ArrowLeft}
                onClick={() => navigate("/collections")}
                aria-label={t("detail.back")}
                tooltip={t("detail.back")}
              />
              <Library className="size-4 shrink-0 text-muted-foreground" />
              <h1 className="min-w-0 truncate text-base font-semibold" title={detail.name}>
                {detail.name}
              </h1>
              <div className="hidden items-center gap-1 sm:flex">
                {detail.for_agent ? (
                  <>
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[11px]">
                      <Bot className="size-3" />
                      {t("card.agent")}
                    </Badge>
                    <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[11px]">
                      <KindIcon className="size-3" />
                      {detail.agent_kind === "behavior" ? t("card.behavior") : t("card.knowledge")}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[11px]">
                    <Users className="size-3" />
                    {t("card.human")}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[11px]">
                  {detail.is_public ? <Globe className="size-3" /> : <Lock className="size-3" />}
                  {detail.is_public ? t("card.public") : t("card.private")}
                </Badge>
              </div>
              <CopyModeLinkButton canAdmin={detail.can_admin} />
              <HuemulButton
                variant="ghost"
                size="icon"
                className="ml-auto size-8"
                icon={RefreshCw}
                aria-label={t("common:refresh")}
                tooltip={t("common:refresh")}
                loading={isFetchingDetail || isFetchingAccess}
                onClick={refresh}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 hover:cursor-pointer"
                    aria-label={t("detail.moreActions")}
                    title={t("detail.moreActions")}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ViewModeMenuItems
                    mode={viewMode}
                    canAdmin={detail.can_admin}
                    onChange={(mode) => updateParams({ view: viewModeParam(mode) })}
                  />
                  {(canManage || canShare || canDelete) && <DropdownMenuSeparator />}
                  {canManage && (
                    <DropdownMenuItem className="hover:cursor-pointer" onSelect={afterMenuCloses(() => setEditing(true))}>
                      <Pencil className="size-4" />
                      {t("detail.edit")}
                    </DropdownMenuItem>
                  )}
                  {canShare && (
                    <DropdownMenuItem className="hover:cursor-pointer" onSelect={afterMenuCloses(() => setSharing(true))}>
                      <ShieldCheck className="size-4" />
                      {t("detail.share")}
                    </DropdownMenuItem>
                  )}
                  {(canManage || canShare) && canDelete && <DropdownMenuSeparator />}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive hover:cursor-pointer"
                      onSelect={afterMenuCloses(() => setPendingDelete({ kind: "collection" }))}
                    >
                      <Trash2 className="size-4" />
                      {t("detail.delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {(viewMode === "view_only" || (viewMode === "reader" && detail.can_admin)) && (
              <p className="flex items-center gap-2 border-t bg-primary/5 px-3 py-1.5 text-xs text-muted-foreground">
                <Eye className="size-3.5 shrink-0" />
                {viewMode === "view_only" ? t("detail.viewOnlyBanner") : t("detail.readerBanner")}
              </p>
            )}
          </div>
        }
        columns={[
          {
            id: "collection-index",
            content: (
              <CollectionIndex
                detail={detail}
                selectedItemId={selectedItem?.id ?? null}
                onSelectCover={() => selectItem(null)}
                showRules={rulesInMenu}
                rulesSelected={rulesSelected}
                onSelectRules={() => {
                  updateParams({ item: RULES_ENTRY, in: null })
                  setExecutionOverride(null)
                  setSelectedSectionId(null)
                }}
                onSetHome={(item, isHome) =>
                  mutations.updateItem.mutate({ collectionId, itemId: item.id, data: { is_home: isHome } })
                }
                onSelectItem={selectItem}
                viewedExecutionId={selectedExecutionId}
                canManage={canManage}
                onReorder={reorder}
                onPinVersion={(item, executionId) =>
                  mutations.updateItem.mutate(
                    { collectionId, itemId: item.id, data: { execution_id: executionId } },
                    // La versión del ítem pasa a ser la que se ve: se descarta la elegida a mano.
                    { onSuccess: () => setExecutionOverride(null) },
                  )
                }
                onMoveToGroup={(item, groupId) =>
                  mutations.updateItem.mutate({ collectionId, itemId: item.id, data: { group_id: groupId } })
                }
                onRemoveItem={(item) => setPendingDelete({ kind: "item", item })}
                onCreateGroup={(name) => mutations.createGroup.mutate({ collectionId, name })}
                onRenameGroup={(group, name) => mutations.renameGroup.mutate({ collectionId, groupId: group.id, name })}
                onReorderGroups={(groupIds) => mutations.reorderGroups.mutate({ collectionId, groupIds })}
                onDeleteGroup={(group) => setPendingDelete({ kind: "group", group })}
                onAddItems={(groupId) => setAddingToGroup(groupId)}
                onAddCollections={addCollections}
                onOpenCollection={(childId) => navigate(`/collections/${childId}`)}
              />
            ),
            defaultSize: 22,
            minSize: 15,
            maxSize: 40,
            className: "border-r bg-muted/10",
          },
          {
            id: "collection-content",
            content: rulesSelected ? (
              <div className="h-full overflow-y-auto">{rulesView}</div>
            ) : selectedFile ? (
              <AssetContent
                key={selectedFile.id}
                selectedFile={selectedFile}
                breadcrumb={[]}
                selectedExecutionId={selectedExecutionId}
                setSelectedExecutionId={setSelectedExecutionId}
                selectedSectionId={selectedSectionId}
                setSelectedSectionId={setSelectedSectionId}
                setSelectedFile={() => {}}
                onRefresh={() => {
                  queryClient.invalidateQueries({ queryKey: ["document-content"] })
                  refresh()
                }}
                isSidebarOpen={false}
                onToggleSidebar={() => {}}
                defaultDetailPanelCollapsed
                viewOnly={viewMode === "view_only"}
                onOpenFullscreen={() =>
                  navigate(buildAssetFullscreenPath(selectedFile.id, {
                      executionId: selectedExecutionId,
                      returnTo: currentPath(),
                      viewOnly: viewMode === "view_only",
                    }))
                }
              />
            ) : (
              <div className="h-full overflow-y-auto">{cover}</div>
            ),
            minSize: 40,
          },
        ]}
      />

      <CollectionFormSheet
        open={editing}
        onOpenChange={setEditing}
        collection={detail}
        canManageAgentCollections={can("updateAgentCollection")}
      />
      <CollectionAccessSheet open={sharing} onOpenChange={setSharing} collection={detail} />
      {canManage && selectedOrganizationId && (
        <HuemulAssetTreePickerDialog
          open={addingToGroup !== undefined}
          onOpenChange={(open) => !open && setAddingToGroup(undefined)}
          organizationId={selectedOrganizationId}
          mode="document"
          keepOpenOnSelect
          disabledIds={detail.items.flatMap((item) => (item.document_id ? [item.document_id] : []))}
          disabledHint={t("addItems.alreadyIn")}
          title={t("addItems.pickerTitle")}
          description={t("addItems.pickerDescription")}
          onSelect={(documentId) =>
            mutations.addItem.mutate({
              collectionId,
              data: { document_id: documentId, group_id: addingToGroup ?? null },
            })
          }
        />
      )}
      {canManage && (
        <AddChildCollectionDialog
          groupId={addingCollectionsToGroup}
          onClose={() => setAddingCollectionsToGroup(undefined)}
          collection={detail}
        />
      )}
      <HuemulAlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={deleteTexts.title}
        description={deleteTexts.description}
        onAction={confirmDelete}
        actionLabel={pendingDelete?.kind === "item" ? t("access.remove") : t("common:delete")}
      />
    </>
  )
}
