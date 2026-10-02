"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Bot, Check, Library, Plus, RefreshCw, Users } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useDebounce } from "@/hooks/use-debounce"
import { useCollectionMutations, useCollections } from "@/hooks/useCollections"
import { CollectionFormSheet } from "./collection-form-sheet"
import { CollectionsErrorState } from "./collections-error-state"
import type { Collection, CollectionGroup } from "@/types/collections"

const NO_GROUP = "__none__"

export interface AddToCollectionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentName?: string
  /** Versión que se está viendo: se puede fijar en la colección. */
  executionId?: string | null
}

function GroupPicker({
  groups,
  value,
  onChange,
}: {
  groups: CollectionGroup[]
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation("collections")
  if (groups.length === 0) return null
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-40 hover:cursor-pointer" aria-label={t("addToCollection.group")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_GROUP}>{t("addToCollection.noGroup")}</SelectItem>
        {groups.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            {group.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * "Agregar a colección" desde el menú ⋯ de un activo: lista las colecciones que el
 * usuario administra (`can_admin`), marca las que ya lo contienen y lo agrega al
 * final del grupo elegido. Los grupos vienen en el listado (una sola llamada). Las
 * colecciones para agentes solo aparecen con el permiso para editarlas. Una
 * colección nueva creada desde acá recibe el activo al guardarse.
 */
export function AddToCollectionSheet({ open, onOpenChange, documentId, documentName, executionId }: AddToCollectionSheetProps) {
  const { t } = useTranslation(["collections", "common"])
  const { can } = usePageAccess("collections")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [pinVersion, setPinVersion] = useState(false)
  const [groups, setGroups] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  // Cada apertura empieza de cero: "fijar versión" o un grupo elegido para otro activo no
  // deben arrastrarse al siguiente.
  useEffect(() => {
    if (open) {
      setSearch("")
      setPinVersion(false)
      setGroups({})
      setCreating(false)
    }
  }, [open, documentId])
  const { addItem } = useCollectionMutations()
  const { data, error, isLoading, isError, isFetching, refetch } = useCollections({
    page: 1,
    page_size: 200,
    can_admin: true,
    contains_document_id: documentId,
    search: debouncedSearch || undefined,
    enabled: open && !!documentId,
  })
  const canEditAgentCollections = can("updateAgentCollection")
  const collections = (data?.data ?? []).filter((collection) => !collection.for_agent || canEditAgentCollections)

  const add = (collection: Pick<Collection, "id">) => {
    const group = groups[collection.id]
    addItem.mutate({
      collectionId: collection.id,
      data: {
        document_id: documentId,
        group_id: group && group !== NO_GROUP ? group : null,
        execution_id: pinVersion && executionId ? executionId : null,
      },
    })
  }

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("addToCollection.title")}
        description={documentName}
        icon={Library}
        size="md"
        showFooter={false}
        headerExtra={
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            icon={RefreshCw}
            aria-label={t("common:refresh")}
            tooltip={t("common:refresh")}
            loading={isFetching}
            onClick={() => refetch()}
          />
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">{t("addToCollection.description")}</p>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("addToCollection.search")}
            aria-label={t("addToCollection.search")}
          />
          {executionId && (
            <label className="flex items-start gap-2 text-sm hover:cursor-pointer">
              <Checkbox checked={pinVersion} onCheckedChange={(checked) => setPinVersion(checked === true)} className="mt-0.5" />
              <span>{t("addToCollection.pinVersion")}</span>
            </label>
          )}

          {isError ? (
            <CollectionsErrorState compact error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("addToCollection.none")}</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {collections.map((collection) => {
                const audience = collection.for_agent ? t("card.agent") : t("card.human")
                const AudienceIcon = collection.for_agent ? Bot : Users
                return (
                  <li key={collection.id} className="flex items-center gap-3 px-3 py-2">
                    <span title={audience} className="inline-flex shrink-0">
                      <AudienceIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span className="sr-only">{audience}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm" title={collection.name}>{collection.name}</span>
                    {collection.contains_document ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Check className="size-3.5" />
                        {t("addToCollection.alreadyIn")}
                      </span>
                    ) : (
                      <>
                        <GroupPicker
                          groups={collection.groups ?? []}
                          value={groups[collection.id] ?? NO_GROUP}
                          onChange={(value) => setGroups((prev) => ({ ...prev, [collection.id]: value }))}
                        />
                        <HuemulButton
                          size="sm"
                          variant="outline"
                          icon={Plus}
                          label={t("addToCollection.add")}
                          onClick={() => add(collection)}
                          disabled={addItem.isPending}
                        />
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {can("createCollection") && (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={Plus}
              label={t("addToCollection.createNew")}
              onClick={() => setCreating(true)}
            />
          )}
        </div>
      </HuemulSheet>

      <CollectionFormSheet
        open={creating}
        onOpenChange={setCreating}
        collection={null}
        canManageAgentCollections={can("createAgentCollection")}
        onSaved={(collection) => add(collection)}
      />
    </>
  )
}
