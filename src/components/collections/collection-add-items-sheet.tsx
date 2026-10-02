"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { FilePlus2, Search } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCollectionMutations } from "@/hooks/useCollections"
import { searchAssetsForCollection } from "@/services/collections"
import type { CollectionDetail } from "@/types/collections"

const NO_GROUP = "__none__"

export interface CollectionAddItemsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detail: Pick<CollectionDetail, "id" | "name" | "groups" | "items">
}

/**
 * "Agregar activos" desde dentro de la colección: busca entre los activos que el
 * usuario puede ver, marca los que ya están y agrega los elegidos (en el orden en
 * que se marcaron) al final del grupo destino.
 */
export function CollectionAddItemsSheet({ open, onOpenChange, detail }: CollectionAddItemsSheetProps) {
  const { t } = useTranslation(["collections", "common"])
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [groupId, setGroupId] = useState(NO_GROUP)
  const { addItem } = useCollectionMutations()

  useEffect(() => {
    if (open) {
      setInput("")
      setSearch("")
      setSelected([])
      setGroupId(NO_GROUP)
    }
  }, [open])

  // Búsqueda con un pequeño debounce: el listado de activos no es barato.
  useEffect(() => {
    const id = setTimeout(() => setSearch(input), 300)
    return () => clearTimeout(id)
  }, [input])

  const { data: assets, isLoading } = useQuery({
    queryKey: ["collection-asset-search", search],
    queryFn: () => searchAssetsForCollection(search),
    enabled: open,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })

  const inCollection = new Set(detail.items.map((item) => item.document_id))

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))

  const handleAdd = async () => {
    const group = groupId === NO_GROUP ? null : groupId
    let failed = 0
    // En orden: el backend agrega cada uno al final del grupo.
    for (const documentId of selected) {
      try {
        await addItem.mutateAsync({ collectionId: detail.id, data: { document_id: documentId, group_id: group } })
      } catch {
        failed += 1 // el toast global ya mostró el error; se sigue con el resto
      }
    }
    if (failed === selected.length && failed > 0) throw new Error("none added")
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("addItems.title")}
      description={detail.name}
      icon={FilePlus2}
      size="lg"
      cancelLabel={t("common:cancel")}
      saveAction={{
        label: selected.length > 0 ? t("addItems.addCount", { count: selected.length }) : t("addItems.add"),
        onClick: handleAdd,
        disabled: selected.length === 0,
      }}
    >
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">{t("addItems.description")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("addItems.search")}
              className="pl-8"
              aria-label={t("addItems.search")}
            />
          </div>
          {detail.groups.length > 0 && (
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="sm:w-48" aria-label={t("addItems.group")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_GROUP}>{t("addToCollection.noGroup")}</SelectItem>
                {detail.groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : !assets || assets.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("addItems.noResults")}</p>
        ) : (
          <ul className="max-h-[55vh] divide-y overflow-y-auto rounded-md border">
            {assets.map((asset) => {
              const already = inCollection.has(asset.id)
              const checked = already || selected.includes(asset.id)
              return (
                <li key={asset.id}>
                  <label
                    className={`flex items-center gap-3 px-3 py-2 ${already ? "opacity-60" : "hover:cursor-pointer hover:bg-muted/50"}`}
                  >
                    <Checkbox checked={checked} disabled={already} onCheckedChange={() => toggle(asset.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{asset.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[asset.internal_code, asset.document_type?.name].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {already && <span className="text-xs text-muted-foreground">{t("addItems.alreadyIn")}</span>}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
        {selected.length > 0 && (
          <p className="text-xs text-muted-foreground">{t("addItems.selected", { count: selected.length })}</p>
        )}
      </div>
    </HuemulSheet>
  )
}
