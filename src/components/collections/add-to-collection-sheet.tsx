"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Bot, Check, Library, Plus, Users } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useCollection, useCollectionMutations, useCollections } from "@/hooks/useCollections"
import { CollectionFormSheet } from "./collection-form-sheet"
import type { Collection } from "@/types/collections"

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
  collectionId,
  value,
  onChange,
}: {
  collectionId: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation("collections")
  const { data: detail } = useCollection(collectionId)
  const groups = detail?.groups ?? []
  if (groups.length === 0) return null
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-40" aria-label={t("addToCollection.group")}>
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
 * final del grupo elegido. Una colección nueva creada desde acá recibe el activo
 * al guardarse.
 */
export function AddToCollectionSheet({ open, onOpenChange, documentId, documentName, executionId }: AddToCollectionSheetProps) {
  const { t } = useTranslation(["collections", "common"])
  const { can } = usePageAccess("collections")
  const [search, setSearch] = useState("")
  const [pinVersion, setPinVersion] = useState(false)
  const [groups, setGroups] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const { addItem } = useCollectionMutations()
  const { data, isLoading } = useCollections({
    page: 1,
    page_size: 200,
    can_admin: true,
    contains_document_id: documentId,
    search: search || undefined,
    enabled: open && !!documentId,
  })
  const collections = data?.data ?? []

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
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">{t("addToCollection.description")}</p>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("addToCollection.search")} />
          {executionId && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={pinVersion} onCheckedChange={(checked) => setPinVersion(checked === true)} className="mt-0.5" />
              <span>{t("addToCollection.pinVersion")}</span>
            </label>
          )}

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("addToCollection.none")}</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {collections.map((collection) => (
                <li key={collection.id} className="flex items-center gap-3 px-3 py-2">
                  {collection.for_agent ? (
                    <Bot className="size-4 shrink-0 text-muted-foreground" aria-label={t("card.agent")} />
                  ) : (
                    <Users className="size-4 shrink-0 text-muted-foreground" aria-label={t("card.human")} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">{collection.name}</span>
                  {collection.contains_document ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="size-3.5" />
                      {t("addToCollection.alreadyIn")}
                    </span>
                  ) : (
                    <>
                      <GroupPicker
                        collectionId={collection.id}
                        value={groups[collection.id] ?? NO_GROUP}
                        onChange={(value) => setGroups((prev) => ({ ...prev, [collection.id]: value }))}
                      />
                      <Button size="sm" variant="outline" onClick={() => add(collection)} disabled={addItem.isPending}>
                        <Plus className="size-4" />
                        {t("addToCollection.add")}
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {can("createCollection") && (
            <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              {t("addToCollection.createNew")}
            </Button>
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
