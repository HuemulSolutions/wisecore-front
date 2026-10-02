"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Folder, FolderPlus, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { useCollectionMutations, useCollections } from "@/hooks/useCollections"
import { useDebounce } from "@/hooks/use-debounce"
import type { CollectionDetail } from "@/types/collections"
import { CollectionsErrorState } from "./collections-error-state"

export interface AddChildCollectionDialogProps {
  /** `undefined` = cerrado; `null` = agregar sin grupo; un id = agregar en ese grupo. */
  groupId: string | null | undefined
  onClose: () => void
  collection: CollectionDetail
}

/**
 * Elegir colecciones para meter dentro de otra. El backend ofrece solo las candidatas (misma
 * audiencia, ni ella ni las que la contienen) y valida al agregar ciclos y los 10 niveles; las
 * que ya están dentro se marcan. Basta con poder leerlas: no hace falta administrarlas.
 */
export function AddChildCollectionDialog({ groupId, onClose, collection }: AddChildCollectionDialogProps) {
  const { t } = useTranslation(["collections", "common"])
  const open = groupId !== undefined
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  useEffect(() => {
    if (open) setSearch("")
  }, [open])
  const { addItem } = useCollectionMutations()
  const { data, error, isLoading, isError, refetch } = useCollections({
    page: 1,
    page_size: 200,
    exclude_nesting_conflicts_for: collection.id,
    search: debouncedSearch || undefined,
    enabled: open,
  })
  const included = new Set(collection.items.map((item) => item.child_collection_id).filter(Boolean))
  const candidates = data?.data ?? []

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t("addCollections.title")}
      description={t("addCollections.description")}
      icon={FolderPlus}
      showFooter={false}
    >
      <div className="space-y-3 py-1">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("addCollections.search")}
          aria-label={t("addCollections.search")}
        />
        {isError ? (
          <CollectionsErrorState compact error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("addCollections.none")}</p>
        ) : (
          <ul className="max-h-[50vh] divide-y overflow-y-auto rounded-md border">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="flex items-center gap-3 px-3 py-2">
                <Folder className="size-4 shrink-0 text-blue-500" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm" title={candidate.name}>
                    {candidate.name}
                  </span>
                  {candidate.description && (
                    <span className="block truncate text-xs text-muted-foreground" title={candidate.description}>
                      {candidate.description}
                    </span>
                  )}
                </span>
                {included.has(candidate.id) ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="size-3.5" />
                    {t("addCollections.alreadyIn")}
                  </span>
                ) : (
                  <HuemulButton
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    label={t("addCollections.add")}
                    disabled={addItem.isPending}
                    onClick={() =>
                      addItem.mutate({
                        collectionId: collection.id,
                        data: { child_collection_id: candidate.id, group_id: groupId ?? null },
                      })
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </HuemulDialog>
  )
}
