"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Plus, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGlobalUsers } from "@/hooks/useUsers"
import type { User } from "@/types/users"

export interface OrganizationUserAddPopoverProps {
  /** Usuarios ya miembros de la organización — se excluyen de los resultados. */
  excludeUserIds: Set<string>
  onUserAdded: (user: User) => void
  disabled?: boolean
}

const PAGE_SIZE = 50

/**
 * Popover "Agregar usuario" del tab Usuarios del panel de organización —
 * espejo de `RolesUserAddPopover`, pero busca **cross-org** vía
 * `useGlobalUsers` (`GET /users`, root-admin-only) en vez de `useUsers`
 * (org-scoped): el usuario a agregar puede no pertenecer a ninguna
 * organización todavía. Gateado por el llamador (`canManageMembers`,
 * root-admin-only).
 */
export function OrganizationUserAddPopover({
  excludeUserIds,
  onUserAdded,
  disabled,
}: OrganizationUserAddPopoverProps) {
  const { t } = useTranslation(["organizations", "roles", "users", "common"])
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<User[]>([])
  const isFirstOpenRef = useRef(true)

  const { data, isLoading, isFetching } = useGlobalUsers({
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

  const visibleItems = items.filter((u) => !excludeUserIds.has(u.id))
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
          {t("organizations:detail.addUser")}
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
              placeholder={t("roles:detail.searchUsersPlaceholder")}
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
              {t("roles:detail.noUsersFound")}
            </p>
          ) : (
            <div className="space-y-0.5 pb-1">
              {visibleItems.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onUserAdded(user)}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:cursor-pointer hover:bg-muted"
                >
                  <Avatar size="sm">
                    {user.photo_url && <AvatarImage src={user.photo_url} alt={user.name} />}
                    <AvatarFallback className="bg-[#475569] text-[10px] font-semibold text-white">
                      {`${user.name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {user.name} {user.last_name}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
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
