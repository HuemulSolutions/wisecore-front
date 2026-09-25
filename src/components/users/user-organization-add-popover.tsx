"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Building2, Loader2, Plus, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useOrganizations } from "@/hooks/useOrganizations"
import type { Organization } from "@/types/organizations"

export interface UserOrganizationAddPopoverProps {
  /** Organizaciones de las que el usuario ya es miembro — se excluyen de los resultados. */
  excludeOrganizationIds: Set<string>
  onOrganizationAdded: (organization: Organization) => void
  disabled?: boolean
}

const PAGE_SIZE = 50

/**
 * Popover "Agregar organización" del tab Organizaciones del panel de
 * usuario — espejo de `RolesUserAddPopover` pero buscando organizaciones en
 * vez de usuarios. Root-admin-only (gateado por el llamador): lista TODAS
 * las organizaciones de la instalación, no solo la activa.
 */
export function UserOrganizationAddPopover({
  excludeOrganizationIds,
  onOrganizationAdded,
  disabled,
}: UserOrganizationAddPopoverProps) {
  const { t } = useTranslation(["users", "organizations", "common"])
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Organization[]>([])
  const isFirstOpenRef = useRef(true)

  const { data, isLoading, isFetching } = useOrganizations({
    page,
    pageSize: PAGE_SIZE,
    search,
    enabled: open,
  })

  useEffect(() => {
    if (!open) {
      isFirstOpenRef.current = true
      return
    }
    const delay = isFirstOpenRef.current ? 0 : 250
    isFirstOpenRef.current = false
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, delay)
    return () => clearTimeout(timer)
  }, [open, searchInput])

  useEffect(() => {
    if (!data) return
    setItems((prev) => (page === 1 ? data.data : [...prev, ...data.data]))
  }, [data, page])

  useEffect(() => {
    if (!open) {
      setSearchInput("")
      setSearch("")
      setPage(1)
    }
  }, [open])

  const visibleItems = items.filter((org) => !excludeOrganizationIds.has(org.id))
  const hasNext = data?.has_next ?? false

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-[13px] font-medium text-muted-foreground hover:cursor-pointer hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="size-3.5" />
          {t("users:detail.addOrganization")}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[412px] p-0"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="p-3 pb-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("users:detail.searchOrganizationsPlaceholder")}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto px-1 pb-1" onWheel={(e) => e.stopPropagation()}>
          {isLoading && page === 1 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : visibleItems.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              {t("users:detail.noOrganizationsFound")}
            </p>
          ) : (
            <div className="space-y-0.5 pb-1">
              {visibleItems.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => onOrganizationAdded(org)}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:cursor-pointer hover:bg-muted"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Building2 className="size-3.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{org.name}</div>
                    {org.description && (
                      <div className="truncate text-[11px] text-muted-foreground">{org.description}</div>
                    )}
                  </div>
                </button>
              ))}
              {hasNext && (
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="w-full py-2 text-center text-[11px] font-medium text-primary hover:cursor-pointer hover:underline disabled:opacity-60"
                >
                  {isFetching ? t("common:loading") : t("users:detail.picker.loadMore")}
                </button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
