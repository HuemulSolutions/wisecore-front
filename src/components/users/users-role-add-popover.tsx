"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Plus, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { roleRowSwatch } from "@/lib/reference-colors"
import { useRoles } from "@/hooks/useRbac"
import type { Role } from "@/types/rbac"

export interface UsersRoleAddPopoverProps {
  /** Roles ya asignados o ya en staging — se excluyen de los resultados. */
  excludeRoleIds: Set<string>
  /** Agrega un rol existente al staging del panel. */
  onRoleAdded: (role: Role, opts?: { created?: boolean }) => void
  disabled?: boolean
}

const PAGE_SIZE = 50

/**
 * Popover "Agregar rol": solo busca/lista roles existentes. Crear un rol
 * nuevo se hace desde el botón "Crear rol" de `UsersDetailRolesTab`, que abre
 * `CreateRoleSheet` completo — ver ia context/inline-create-entity-in-sheet-guide.md.
 */
export function UsersRoleAddPopover({
  excludeRoleIds,
  onRoleAdded,
  disabled,
}: UsersRoleAddPopoverProps) {
  const { t } = useTranslation(["users", "common"])
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Role[]>([])
  const isFirstOpenRef = useRef(true)

  const { data, isLoading, isFetching } = useRoles(open, page, PAGE_SIZE, search)

  // Fetch inmediato al abrir, debounce 250ms en cada cambio de búsqueda
  // posterior — mismo patrón que huemul-tag-picker.tsx.
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

  // Acumula (no reemplaza) al paginar con "Cargar más"; una búsqueda nueva
  // resetea desde `page=1` arriba.
  useEffect(() => {
    if (!open || !data) return
    setItems((prev) => (page === 1 ? data.data : [...prev, ...data.data]))
  }, [open, data, page])

  useEffect(() => {
    if (!open) {
      setSearchInput("")
      setSearch("")
      setPage(1)
    }
  }, [open])

  const visibleItems = items.filter((role) => !excludeRoleIds.has(role.id))
  const hasNext = data?.has_next ?? false

  const handleSelect = (role: Role) => {
    onRoleAdded(role)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-[13px] font-medium text-muted-foreground hover:cursor-pointer hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="size-3.5" />
          {t("detail.addRole")}
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
              placeholder={t("detail.picker.searchPlaceholder")}
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
              {search
                ? t("detail.picker.noResults", { query: search })
                : t("detail.picker.noResultsEmpty")}
            </p>
          ) : (
            <div className="space-y-0.5 pb-1">
              {visibleItems.map((role) => {
                const swatch = roleRowSwatch(role.color)
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelect(role)}
                    className="flex w-full items-start gap-2 rounded-md p-2 text-left hover:cursor-pointer hover:bg-muted"
                  >
                    <span
                      className="mt-1 size-1.75 shrink-0 rounded-full"
                      style={{ backgroundColor: swatch.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{role.name}</div>
                      {role.description && (
                        <div className="truncate text-[11px] text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </div>
                    {role.permission_num != null && (
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-0 text-[10px] text-muted-foreground">
                        {role.permission_num}
                      </span>
                    )}
                  </button>
                )
              })}
              {hasNext && (
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="w-full py-2 text-center text-[11px] font-medium text-primary hover:cursor-pointer hover:underline disabled:opacity-60"
                >
                  {isFetching ? t("common:loading") : t("detail.picker.loadMore")}
                </button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
