import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Settings, Check } from "lucide-react"
import { useOrgPath, stripOrgPrefix } from "@/hooks/useOrgRouter"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { resolvePageAccess } from "@/hooks/usePageAccess"
import { RBAC_PAGES } from "@/lib/rbac-matrix"
import { SETTINGS_MENU_GROUPS, type HeaderMenuEntry } from "@/lib/header-menu"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface HeaderSettingsMenuProps {
  organizationToken: string | null
  onOpenApiTokens: () => void
}

/**
 * Panel de configuración del header (ícono de engranaje). Layout multi-
 * columna: los grupos se definen en `src/lib/header-menu.ts` y este
 * componente solo resuelve permisos + renderiza. Para agregar una opción
 * nueva no se toca este archivo: se agrega la entrada al registro (ver
 * ia context/header-menu-guide.md).
 */
export function HeaderSettingsMenu({ organizationToken, onOpenApiTokens }: HeaderSettingsMenuProps) {
  const { t } = useTranslation("layout")
  const location = useLocation()
  const buildPath = useOrgPath()
  const { hasAnyPermission, isRootAdmin, isOrgAdmin } = useUserPermissions()

  const currentPath = stripOrgPrefix(location.pathname)
  const isPathActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/")

  const isEntryVisible = (entry: HeaderMenuEntry): boolean => {
    if (entry.kind === "action") {
      return !entry.requireOrgAdmin || (isOrgAdmin && !!organizationToken)
    }
    return resolvePageAccess(RBAC_PAGES[entry.page], { hasAnyPermission, isRootAdmin })
  }

  const entryPath = (entry: Extract<HeaderMenuEntry, { kind: "page" }>): string =>
    entry.absolutePath ? `/${entry.page}` : buildPath(`/${entry.page}`)

  const visibleGroups = SETTINGS_MENU_GROUPS
    .map((group) => ({ ...group, entries: group.entries.filter(isEntryVisible) }))
    .filter((group) => group.entries.length > 0)

  if (visibleGroups.length === 0) return null

  const isAnySettingsActive = visibleGroups.some((group) =>
    group.entries.some((entry) => entry.kind === "page" && isPathActive(`/${entry.page}`))
  )

  const itemClass = (path: string) =>
    cn(
      "hover:cursor-pointer flex items-center gap-2",
      isPathActive(path) && "bg-accent text-accent-foreground font-medium"
    )
  const iconClass = (path: string) =>
    cn("h-4 w-4 shrink-0", isPathActive(path) ? "text-accent-foreground" : "text-muted-foreground")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 hover:cursor-pointer", isAnySettingsActive && "bg-accent text-accent-foreground")}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">{t("header.settingsMenuSrOnly")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-160 max-w-[calc(100vw-2rem)] p-2">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {visibleGroups.map((group) => (
            <DropdownMenuGroup key={group.id} className="mb-3 inline-block w-full break-inside-avoid align-top">
              <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                {t(group.labelKey)}
              </DropdownMenuLabel>
              {group.entries.map((entry) => {
                const Icon = entry.icon
                if (entry.kind === "action") {
                  return (
                    <DropdownMenuItem
                      key={entry.id}
                      className="hover:cursor-pointer flex items-center gap-2"
                      onSelect={onOpenApiTokens}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{t(entry.labelKey)}</span>
                    </DropdownMenuItem>
                  )
                }
                const path = entryPath(entry)
                const activePath = `/${entry.page}`
                return (
                  <DropdownMenuItem key={entry.page} asChild>
                    <Link to={path} className={itemClass(activePath)}>
                      <Icon className={iconClass(activePath)} />
                      <span className="flex-1">{t(entry.labelKey)}</span>
                      {isPathActive(activePath) && <Check className="h-3.5 w-3.5 ml-auto" />}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
