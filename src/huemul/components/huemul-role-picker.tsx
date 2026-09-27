import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Loader2, Search, Shield, X } from "lucide-react"

import { useRoles } from "@/hooks/useRbac"
import { HuemulDialog } from "./huemul-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { HuemulRolePickerDialogProps } from "@/types/huemul"

const PAGE_SIZE = 50

export function HuemulRolePickerDialog({ open, onOpenChange, onSelect }: HuemulRolePickerDialogProps) {
  const { t } = useTranslation(["roles", "common"])
  const [searchTerm, setSearchTerm] = useState("")
  const [committedSearch, setCommittedSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useRoles(open, page, PAGE_SIZE, committedSearch)
  const roles = data?.data ?? []
  const hasNext = data?.has_next ?? false

  function runSearch() {
    setCommittedSearch(searchTerm.trim())
    setPage(1)
  }

  function clearSearch() {
    setSearchTerm("")
    setCommittedSearch("")
    setPage(1)
  }

  function handleSelect(id: string, name: string, description?: string | null) {
    onSelect(id, name, { description: description ?? null })
    onOpenChange(false)
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("roles:picker.title", { defaultValue: "Select role" })}
      icon={Shield}
      showFooter={false}
      maxWidth="sm:max-w-xl"
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); runSearch() }
              if (e.key === "Escape" && committedSearch) { e.preventDefault(); clearSearch() }
            }}
            placeholder={t("roles:picker.searchPlaceholder")}
            className="pl-8 pr-8 h-9"
          />
          {committedSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:cursor-pointer"
              aria-label={t("roles:picker.clearSearch", { defaultValue: "Clear" })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="min-h-75 max-h-[60vh] overflow-y-auto rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-4">
              <p className="text-sm text-red-600">{t("roles:picker.errorLoading")}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t("common:tryAgain")}
              </Button>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              {t("roles:picker.noResults")}
            </div>
          ) : (
            <div className="p-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelect(role.id, role.name, role.description)}
                  className="flex w-full items-start rounded-md p-2 text-left hover:bg-muted hover:cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{role.name}</div>
                    {role.description && (
                      <div className="truncate text-xs text-muted-foreground">{role.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {(page > 1 || hasNext) && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("common:pagination.page")} {page}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </HuemulDialog>
  )
}
