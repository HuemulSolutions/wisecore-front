import {
  Fingerprint,
  FileStack,
  Waypoints,
  Settings2,
  Tag,
  LayoutPanelTop,
  Image,
  Users,
  Shield,
  Building2,
  Blocks,
  Plug,
  KeyRound,
  Zap,
  Coins,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import type { RbacPageKey } from "@/lib/rbac-matrix"

/**
 * Registro declarativo del panel de configuración del header (el dropdown
 * del ícono de engranaje). Reemplaza el JSX hardcodeado que existía antes en
 * `app-layout.tsx`: cada entrada NO repite ruta ni permisos — se derivan de
 * `RBAC_PAGES[page]` (misma fuente que el guard de ruta de App.tsx), igual
 * que ya hace `navigationItems` con el nav central.
 *
 * Para agregar una opción nueva: ver ia context/header-menu-guide.md.
 */

export type HeaderMenuEntry =
  /** Navega a una página; ruta y permisos salen de RBAC_PAGES[page]. */
  | {
      kind: "page"
      page: RbacPageKey
      icon: LucideIcon
      labelKey: string
      /** Solo para rutas fuera de /:orgId (hoy únicamente global-admin). */
      absolutePath?: boolean
    }
  /** Abre un sheet en vez de navegar: no tiene entrada de ruta en RBAC_PAGES. */
  | {
      kind: "action"
      id: "api-tokens"
      icon: LucideIcon
      labelKey: string
      requireOrgAdmin?: boolean
    }

export interface HeaderMenuGroup {
  id: string
  labelKey: string
  entries: HeaderMenuEntry[]
}

export const SETTINGS_MENU_GROUPS: HeaderMenuGroup[] = [
  {
    id: "asset-structure",
    labelKey: "settings.groups.assetStructure",
    entries: [
      { kind: "page", page: "asset-types", icon: FileStack, labelKey: "settings.assetTypes" },
      { kind: "page", page: "asset-type-relationships", icon: Waypoints, labelKey: "settings.assetTypeRelationships" },
      { kind: "page", page: "custom-fields", icon: Settings2, labelKey: "settings.customFields" },
      { kind: "page", page: "tags", icon: Tag, labelKey: "settings.tags" },
    ],
  },
  {
    id: "design-files",
    labelKey: "settings.groups.designFiles",
    entries: [
      { kind: "page", page: "canvas", icon: LayoutPanelTop, labelKey: "settings.canvas" },
      { kind: "page", page: "media", icon: Image, labelKey: "settings.media" },
    ],
  },
  {
    id: "people-access",
    labelKey: "settings.groups.peopleAccess",
    entries: [
      { kind: "page", page: "users", icon: Users, labelKey: "settings.users" },
      { kind: "page", page: "roles", icon: Shield, labelKey: "settings.roles" },
      { kind: "page", page: "organizations", icon: Building2, labelKey: "settings.organizations" },
    ],
  },
  {
    id: "connections-ai",
    labelKey: "settings.groups.connectionsAi",
    entries: [
      { kind: "page", page: "models", icon: Blocks, labelKey: "settings.models" },
      { kind: "page", page: "external-systems", icon: Plug, labelKey: "settings.externalSystems" },
      { kind: "page", page: "auth-types", icon: Fingerprint, labelKey: "settings.authTypes" },
      { kind: "action", id: "api-tokens", icon: KeyRound, labelKey: "settings.apiTokens", requireOrgAdmin: true },
    ],
  },
  {
    id: "tools-usage",
    labelKey: "settings.groups.toolsUsage",
    entries: [
      { kind: "page", page: "advanced", icon: Zap, labelKey: "settings.advanced" },
      { kind: "page", page: "token-usage", icon: Coins, labelKey: "settings.tokenUsage" },
    ],
  },
  {
    id: "system",
    labelKey: "settings.groups.system",
    entries: [
      { kind: "page", page: "global-admin", icon: ShieldCheck, labelKey: "settings.globalAdminSettings", absolutePath: true },
    ],
  },
]
