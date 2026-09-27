"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Skeleton } from "@/components/ui/skeleton"
import type { PermissionWithStatus } from "@/services/rbac"
import type { RolePermissionsStagingApi } from "@/types/roles/permissions-staging"

export interface RolesDetailPermissionsTabProps {
  staging: RolePermissionsStagingApi
  canUpdate: boolean
}

function getCategory(permission: PermissionWithStatus) {
  return permission.name.split(":")[0]
}

function fallbackCategoryLabel(category: string) {
  return category.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

/**
 * Tab "Permisos": editor completo con staging propio (`RolePermissionsStagingApi`).
 * El guardado sale por el `HuemulPanelSaveBar` de `RoleDetailPanel`, no desde
 * acá — mismo reparto que el tab Usuarios.
 */
export function RolesDetailPermissionsTab({ staging, canUpdate }: RolesDetailPermissionsTabProps) {
  const { t } = useTranslation(["roles", "common"])
  const [search, setSearch] = useState("")
  const [assignedOnly, setAssignedOnly] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroupCollapsed = (category: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return staging.permissions.filter((p) => {
      if (assignedOnly && !staging.selectedIds.has(p.id)) return false
      if (!term) return true
      return p.description.toLowerCase().includes(term) || p.name.toLowerCase().includes(term)
    })
  }, [staging.permissions, staging.selectedIds, search, assignedOnly])

  const groups = useMemo(() => {
    const map = new Map<string, PermissionWithStatus[]>()
    for (const p of filtered) {
      const category = getCategory(p)
      const list = map.get(category)
      if (list) list.push(p)
      else map.set(category, [p])
    }
    return [...map.entries()]
  }, [filtered])

  if (staging.isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-2 pl-4">
              {[...Array(2)].map((_, j) => (
                <Skeleton key={j} className="h-6 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("detail.permissionsSearchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="assigned-only" className="text-xs text-muted-foreground">
          {t("permissions.assignedOnly")}
        </Label>
        <Switch id="assigned-only" checked={assignedOnly} onCheckedChange={setAssignedOnly} />
      </div>

      {staging.permissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t("detail.permissionsEmpty")}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(([category, items]) => {
            const isCollapsed = collapsedGroups.has(category)
            const ids = items.map((p) => p.id)
            const selectedInGroup = ids.filter((id) => staging.selectedIds.has(id)).length
            const allSelected = selectedInGroup === ids.length
            const someSelected = selectedInGroup > 0 && !allSelected
            const label = t(`permissions.categories.${category}`, { defaultValue: fallbackCategoryLabel(category) })

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                  <HuemulButton
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    icon={isCollapsed ? ChevronRight : ChevronDown}
                    onClick={() => toggleGroupCollapsed(category)}
                  />
                  <span className="flex-1 text-xs font-semibold">{label}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                    {selectedInGroup}/{ids.length}
                  </Badge>
                  {canUpdate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 hover:cursor-pointer"
                      onClick={() => staging.toggleMany(ids, !allSelected)}
                    >
                      {allSelected ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : someSelected ? (
                        <div className="flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary bg-primary/20">
                          <div className="h-1.5 w-0.5 rounded-full bg-primary" />
                        </div>
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="ml-4 space-y-1 border-l border-muted pl-3">
                    {items.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start gap-2 rounded-md border border-transparent p-2 hover:border-border/50 hover:bg-muted/50"
                      >
                        <Checkbox
                          id={p.id}
                          checked={staging.selectedIds.has(p.id)}
                          onCheckedChange={() => staging.toggle(p.id)}
                          disabled={!canUpdate}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <label htmlFor={p.id} className="block text-xs font-medium leading-tight hover:cursor-pointer">
                            {p.description}
                          </label>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{p.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
