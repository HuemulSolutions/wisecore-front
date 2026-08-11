import { Outlet, Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { Home, Search, LayoutTemplate, BookText, Settings, LogOut, User, Menu, Zap, FileStack, Settings2, LayoutPanelTop, Building2, ShieldCheck, Shield, Users, Blocks, Network, Check, Image, Bell, BellRing, Workflow, Coins, KeyRound } from "lucide-react"
import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { useOrgPath, stripOrgPrefix } from "@/hooks/useOrgRouter"
import { useQueryClient } from "@tanstack/react-query"
import { generateOrganizationToken } from "@/services/organizations"
import packageInfo from "../../../package.json"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OrganizationSelectionDialog } from "@/components/organization/organization-selection-dialog"
import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useAuth } from "@/contexts/auth-context"
import { RBAC_PAGES } from "@/lib/rbac-matrix"

import { ChatbotProvider } from "@/contexts/chatbot-provider"
import { NavKnowledgeProvider } from "@/contexts/nav-knowledge-provider"
import { GlobalPanelProvider, useGlobalPanel } from "@/contexts/global-panel-context"
import { WisyToggle } from "@/components/layout/global-panel-toggle"
import { LlmConfigBanner } from "@/components/layout/llm-config-banner"
import { EditingGuardProvider, useOptionalEditingGuard } from "@/contexts/editing-guard-context"
import EditUserSheet from "@/components/users/users-edit-sheet"
import { SubscriptionsSheet } from "@/components/subscriptions/subscriptions-sheet"
import { NotificationsSheet } from "@/components/notifications/notifications-sheet"
import { TokensSheet } from "@/components/tokens/tokens-sheet"
import { useUnreadNotificationsCount } from "@/hooks/useUnreadNotificationsCount"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { X } from "lucide-react"

/** Wraps <Outlet /> with the global resizable side-panel. */
function GlobalPanelOutlet() {
  const { isOpen, side, content, title, raw, defaultSize, minSize, maxSize, panelRef, closePanel } = useGlobalPanel()
  const [wasOpen, setWasOpen] = useState(isOpen)

  // Sync the panel imperative handle with the isOpen state.
  // On open: expand to defaultSize. On close: collapse to 0.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    if (isOpen && !wasOpen) {
      panel.expand(defaultSize)
    } else if (!isOpen && wasOpen) {
      panel.collapse()
    }
    setWasOpen(isOpen)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCollapse = useCallback(() => {
    // Only close the context when the panel is truly collapsing while open
    if (isOpen) closePanel()
  }, [isOpen, closePanel])

  const panelContent = raw ? (
    content
  ) : (
    <div className="flex flex-col h-full border-l">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 shrink-0">
        <span className="text-sm font-medium truncate">{title || "Panel"}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="hover:cursor-pointer"
          onClick={closePanel}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto">{content}</div>
    </div>
  )

  const outletPanel = (
    <ResizablePanel order={side === "left" ? 2 : 1} defaultSize={isOpen ? 100 - defaultSize : 100} minSize={30} className="overflow-auto">
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </ResizablePanel>
  )

  const sidePanel = (
    <ResizablePanel
      ref={panelRef}
      order={side === "left" ? 1 : 3}
      defaultSize={isOpen ? defaultSize : 0}
      minSize={minSize}
      maxSize={maxSize}
      collapsible
      collapsedSize={0}
      onCollapse={handleCollapse}
      className={raw ? "overflow-hidden" : "overflow-auto"}
    >
      {panelContent}
    </ResizablePanel>
  )

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
      {outletPanel}
      <ResizableHandle className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} />
      {sidePanel}
    </ResizablePanelGroup>
  )
}

/** Nav link that checks for unsaved section edits before navigating. */
function GuardedNavLink({ to, onClick, children, ...props }: React.ComponentProps<typeof Link>) {
  const navigate = useNavigate()
  const { guardedAction } = useOptionalEditingGuard()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e)
      if (e.defaultPrevented) return
    }
    e.preventDefault()
    guardedAction(() => navigate(to as string))
  }

  return (
    <Link to={to} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}

// Navigation items
const navigationItems = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
    orgScoped: false,
  },
  {
    title: "Assets",
    url: "/asset", 
    icon: BookText,
    orgScoped: true,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
    orgScoped: true,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: LayoutTemplate,
    orgScoped: true,
  },
  {
    title: "Advanced",
    url: "/advanced",
    icon: Zap,
    orgScoped: true,
  },
  {
    title: "Workflow",
    url: "/workflow",
    icon: Workflow,
    orgScoped: true,
  },
]

export default function AppLayout() {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const rawNavigate = useNavigate()
  const { orgId } = useParams<{ orgId: string }>()
  const buildPath = useOrgPath()
  const { requiresOrganizationSelection, organizationToken, selectedOrganizationId, setSelectedOrganizationId, setOrganizationToken, setRequiresOrganizationSelection } = useOrganization()
  const { isLoading: permissionsLoading, refreshPermissions } = useUserPermissions()
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [subscriptionsSheetOpen, setSubscriptionsSheetOpen] = useState(false)
  const [notificationsSheetOpen, setNotificationsSheetOpen] = useState(false)
  const [tokensSheetOpen, setTokensSheetOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isInSelectionFlow, setIsInSelectionFlow] = useState(false)
  const [isSwitchingOrg, setIsSwitchingOrg] = useState(false)
  const unreadNotificationsCount = useUnreadNotificationsCount(selectedOrganizationId)
  const isSwitchingOrgRef = useRef(false)
  const lastSyncedUrlOrgRef = useRef<string | null>(null)
  const previousChatbotOrgRef = useRef<string | null>(null)
  // Remember whether the user previously had org-scoped nav access.
  // This lets us show loading placeholders instead of hiding items during
  // the brief gap when the token/permissions are being refreshed.
  const hadOrgAccessRef = useRef(false)
  
  const {
    isRootAdmin,
    isOrgAdmin,
    canAccessUsers,
    canAccessRoles,
    canAccessDocumentTypes,
    canAccessExternalSystems,
    canAccessTokenUsage,
    hasAnyPermission,
  } = useUserPermissions()

  // Badge y entrada de notificaciones: ambas abren una LECTURA, así que se
  // gatean con `notification:l|r` y no con el helper `canAccessNotifications`
  // (cualquier acción sobre el recurso). Mismo gate en useUnreadNotificationsCount
  // y en NotificationsSheet — una affordance, un solo criterio.
  const canListNotifications = hasAnyPermission(['notification:l', 'notification:r'])
  
  // --- Sync URL orgId → organization context (shared URL / pasted link scenario) ---
  // Only triggers when the URL's orgId ACTUALLY changes (user navigated to a
  // different org URL, e.g. pasted a shared link). Does NOT trigger when
  // selectedOrganizationId changes from the dialog/switcher — that's handled
  // by the context→URL sync below.
  useEffect(() => {
    if (!orgId || orgId === '_' || !user?.id) return

    // Only act when the URL orgId truly changed since last check
    if (orgId === lastSyncedUrlOrgRef.current) return
    lastSyncedUrlOrgRef.current = orgId

    // If URL org already matches context, nothing to do
    if (orgId === selectedOrganizationId) return

    // URL has a different org than context → user pasted a shared link
    let cancelled = false
    isSwitchingOrgRef.current = true
    setIsSwitchingOrg(true)
    logger.log(`[OrgSync] URL orgId "${orgId}" differs from context "${selectedOrganizationId}", switching...`)

    generateOrganizationToken(orgId)
      .then((tokenResponse) => {
        if (cancelled) return

        const orgToken = tokenResponse.token || tokenResponse.data?.token
        if (!orgToken) {
          throw new Error('No token received from server')
        }

        setSelectedOrganizationId(orgId)
        setOrganizationToken(orgToken)
        setRequiresOrganizationSelection(false)

        logger.log(`[OrgSync] Switched to org "${orgId}" successfully`)

        // Deep link URL is already correct — clean up any saved returnUrl
        sessionStorage.removeItem('returnUrl')

        // Immediately refresh permissions from the new token instead of
        // waiting for the 2-second polling interval.
        refreshPermissions()

        if (cancelled) return

        // Invalidate org-dependent queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey
            return Array.isArray(queryKey) && (
              queryKey.includes('documents') ||
              queryKey.includes('document-types') ||
              queryKey.includes('roles') ||
              queryKey.includes('permissions') ||
              queryKey.includes('assets') ||
              queryKey.includes('asset-types') ||
              queryKey.includes('custom-fields') ||
              queryKey.includes('users') ||
              queryKey.includes('knowledge') ||
              queryKey.includes('library') ||
              queryKey.some(key => typeof key === 'string' && key.includes('org'))
            )
          }
        })
      })
      .catch((error) => {
        if (cancelled) return
        logger.error(`[OrgSync] Failed to switch to org "${orgId}":`, error)
        // If token generation fails (user doesn't have access), redirect
        // with the current org, or show org selection dialog
        if (selectedOrganizationId) {
          const pathWithoutOrg = stripOrgPrefix(location.pathname)
          rawNavigate(`/${selectedOrganizationId}${pathWithoutOrg}${location.search}`, { replace: true })
        } else {
          rawNavigate('/', { replace: true })
        }
      })
      .finally(() => {
        if (!cancelled) isSwitchingOrgRef.current = false
      })

    // Cleanup: cancel the in-flight switch if effect re-runs.
    // Also reset lastSyncedUrlOrgRef so React Strict Mode's second
    // invocation re-processes the orgId instead of skipping it.
    return () => {
      cancelled = true
      isSwitchingOrgRef.current = false
      lastSyncedUrlOrgRef.current = null
    }
  }, [orgId, selectedOrganizationId, user?.id, requiresOrganizationSelection])  // eslint-disable-line react-hooks/exhaustive-deps

  // --- Sync organization context → URL (dialog/switcher scenario) ---
  // When the user picks a different org from the dialog/switcher the context
  // updates but the URL still points to the old org.  We redirect to /home
  // in the new org because the previous page content is org-specific and
  // wouldn't make sense in the new org.  This is the SINGLE navigation
  // source for this flow — the dialog intentionally does NOT call navigate.
  useEffect(() => {
    if (isSwitchingOrgRef.current) return
    // Don't override a URL org that the URL→context sync hasn't processed yet.
    if (orgId && orgId !== '_' && lastSyncedUrlOrgRef.current !== orgId) return
    if (selectedOrganizationId && orgId && orgId !== selectedOrganizationId) {
      setIsSwitchingOrg(true)
      lastSyncedUrlOrgRef.current = selectedOrganizationId
      rawNavigate(`/${selectedOrganizationId}/home`, { replace: true })
    }
  }, [selectedOrganizationId, orgId, rawNavigate])

  // --- Redirect to saved deep-link URL after org selection at /home ---
  // When the user lands at /home after login (no orgId in URL) and previously
  // visited a deep link, redirect to that URL once the org is ready.
  useEffect(() => {
    if (requiresOrganizationSelection) return // still selecting
    if (!selectedOrganizationId || !organizationToken) return // not ready
    if (orgId) return // already at an org-scoped URL

    const returnUrl = sessionStorage.getItem('returnUrl')
    if (returnUrl) {
      sessionStorage.removeItem('returnUrl')
      const urlObj = new URL(returnUrl, window.location.origin)
      const returnPathWithoutOrg = stripOrgPrefix(urlObj.pathname)
      rawNavigate(
        `/${selectedOrganizationId}${returnPathWithoutOrg}${urlObj.search}`,
        { replace: true }
      )
    }
  }, [requiresOrganizationSelection, selectedOrganizationId, organizationToken, orgId, rawNavigate])

  // Track active selection flow: enters when org selection is required,
  // exits once permissions finish loading after the user picks an org.
  useEffect(() => {
    if (requiresOrganizationSelection) {
      setIsInSelectionFlow(true)
    }
  }, [requiresOrganizationSelection])

  useEffect(() => {
    if (isInSelectionFlow && !permissionsLoading && !requiresOrganizationSelection) {
      setIsInSelectionFlow(false)
    }
  }, [isInSelectionFlow, permissionsLoading, requiresOrganizationSelection])

  // Show the dialog when:
  // 1. Organization selection is explicitly required, OR
  // 2. User is in an active selection flow and permissions are still loading
  //    (keeps dialog open after org pick until permissions are ready).
  // This does NOT trigger on page refresh because isInSelectionFlow stays false
  // when the org/token are restored from localStorage.
  // When the URL already contains a valid orgId (deep link), suppress the
  // dialog so the URL→context sync can auto-select that org.
  const urlHasOrg = !!orgId && orgId !== '_'
  const shouldShowDialog = !urlHasOrg && (
    requiresOrganizationSelection ||
    (isInSelectionFlow && !!organizationToken && permissionsLoading)
  )
  
  // Filtrar opciones del menú de configuración basándose en permisos
  // NOTA: isOrgAdmin hace bypass de permisos, isRootAdmin NO
  const hasAssetManagementAccess = canAccessDocumentTypes || isOrgAdmin || hasAnyPermission(RBAC_PAGES.canvas.routePermissions) || hasAnyPermission(RBAC_PAGES.diagrams.routePermissions) || hasAnyPermission(RBAC_PAGES["custom-fields"].routePermissions) || hasAnyPermission(RBAC_PAGES.media.routePermissions)
  const canAccessOrganizations = isOrgAdmin || hasAnyPermission(['organization:l', 'organization:r'])
  // Antes usaba el helper canAccessModels (10 permisos, incluye llm:c/llm:d),
  // más ancho que el guard de ruta — ver ia context/rbac-audit-guide.md.
  const canAccessModelsPage = hasAnyPermission(RBAC_PAGES.models.routePermissions)
  const hasAdministrationAccess = canAccessUsers || canAccessRoles || canAccessModelsPage || canAccessOrganizations || canAccessExternalSystems || canAccessTokenUsage || isOrgAdmin || isRootAdmin
  // Antes terminaba en `|| !!organizationToken`, un OR que existía solo para
  // habilitar el ítem de Media (la única entrada sin permiso propio) y que
  // abría el dropdown entero a cualquier usuario con token de organización.
  const hasSettingsAccess = hasAssetManagementAccess || hasAdministrationAccess || isRootAdmin

  // Generate initials from user name
  const getUserInitials = (firstName: string, lastName: string): string => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase()
  }

  const handleSignOut = () => {
    logout()
  }

  const handleUpdateProfile = () => {
    setTimeout(() => {
      setProfileDialogOpen(true)
    }, 0)
  }

  const handleOpenSubscriptions = () => {
    setTimeout(() => {
      setSubscriptionsSheetOpen(true)
    }, 0)
  }

  const handleOpenNotifications = () => {
    setTimeout(() => {
      setNotificationsSheetOpen(true)
    }, 0)
  }

  const handleOpenApiTokens = () => {
    setTimeout(() => {
      setTokensSheetOpen(true)
    }, 0)
  }

  // Track when the user is switching orgs so we can keep showing
  // nav items as loading instead of hiding them.
  useEffect(() => {
    if (isSwitchingOrg && organizationToken && !permissionsLoading) {
      setIsSwitchingOrg(false)
    }
  }, [isSwitchingOrg, organizationToken, permissionsLoading])

  // Filtrar navigationItems basándose en permisos del usuario
  const filteredNavigationItems = useMemo(() => {
    // Determine whether we should show org-scoped items as loading placeholders.
    // This is true when:
    //   - There's no token yet but the user previously had org access (switching)
    //   - There's a token but permissions are still loading
    //   - We're in an active org-switch transition
    const isTransitioning = isSwitchingOrg ||
      (organizationToken && permissionsLoading) ||
      (!organizationToken && hadOrgAccessRef.current)

    const result = navigationItems.map(item => {
      // Non-org-scoped items (e.g. Home) are always visible
      if (!item.orgScoped) return { ...item, loading: false }

      // During any transition, show org-scoped items as loading
      if (isTransitioning) return { ...item, loading: true }

      // No org token and user never had access — don't show
      if (!organizationToken) return null

      // El permiso mostrado en el nav es EXACTAMENTE el que exige el guard de
      // ruta correspondiente (misma fuente: RBAC_PAGES) — antes este switch
      // usaba helpers `canAccessX` más amplios (cualquier acción c/r/u/d/l
      // sobre el recurso) que el guard de ruta, así que un usuario podía ver
      // el ítem de nav y aun así rebotar a /home al hacer click. Ver
      // ia context/rbac-audit-guide.md.
      let shouldShowItem = true

      switch (item.title) {
        case "Assets":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.asset.routePermissions) || isOrgAdmin
          break
        case "Templates":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.templates.routePermissions) || isOrgAdmin
          break
        case "Advanced":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.advanced.routePermissions) || isOrgAdmin
          break
        case "Workflow":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.workflow.routePermissions) || isOrgAdmin
          break
        default:
          shouldShowItem = true
      }

      return shouldShowItem ? { ...item, loading: false } : null
    }).filter(Boolean) as (typeof navigationItems[number] & { loading: boolean })[]

    // Update the ref: if we're showing real (non-loading) org items, remember it
    const hasRealOrgItems = result.some(i => i.orgScoped && !i.loading)
    if (hasRealOrgItems) hadOrgAccessRef.current = true

    return result
  }, [
    organizationToken,
    permissionsLoading,
    hasAnyPermission,
    isOrgAdmin,
    isRootAdmin,
    isSwitchingOrg
  ])

  // Purge the entire query cache whenever the active organization changes.
  // Org-scoped query keys are inconsistent across the codebase (some include
  // organizationId, most don't — e.g. ['document-content', docId]), and the
  // invalidateQueries predicates elsewhere only cover a hardcoded allowlist
  // of key fragments that doesn't even match those keys. A stale document's
  // cached content (2min staleTime / 5min gcTime, refetchOnMount: false) can
  // otherwise render under the wrong organization with zero network request.
  // clear() is opt-out by design so new query keys are covered for free.
  useEffect(() => {
    const previousOrg = previousChatbotOrgRef.current
    if (previousOrg === selectedOrganizationId) {
      return
    }

    previousChatbotOrgRef.current = selectedOrganizationId

    if (previousOrg === null) {
      // Initial mount — nothing cached yet for a previous org to purge.
      return
    }

    queryClient.cancelQueries() // stop in-flight requests still carrying the old X-Org-Id
    // Drop inactive cache entries outright (nothing is mounted to re-render them
    // stale), and invalidate the rest so mounted useQuery hooks refetch under
    // the new X-Org-Id instead of rendering stale data with zero request.
    // A full queryClient.clear() here used to drop every ACTIVE query to
    // `undefined` in the same commit that <ChatbotProvider> remounted the
    // whole layout via `key` — that double blast was the biggest single
    // burst of DOM deletions in the app on every org switch. The remount is
    // gone (see ChatbotProvider's resetKey), and this makes the purge itself
    // gentler too.
    queryClient.removeQueries({ type: 'inactive' })
    queryClient.invalidateQueries()
  }, [queryClient, selectedOrganizationId])

  return (
    <ChatbotProvider resetKey={selectedOrganizationId ?? 'no-org'}>
      <GlobalPanelProvider>
      <TooltipProvider>
        <EditingGuardProvider>
        <NavKnowledgeProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
            {/* Left section: Organization Switcher */}
            <div className="flex items-center gap-2 min-w-45">
              <OrganizationSwitcher />
            </div>
            
            {/* Center section: Navigation Menu */}
            <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
              {filteredNavigationItems.map((item, index) => {
                const Icon = item.icon
                const currentPath = item.orgScoped ? stripOrgPrefix(location.pathname) : location.pathname
                const isActive = !item.loading && (currentPath === item.url || 
                  (item.url !== '/home' && (currentPath.startsWith(item.url + '/') || currentPath === item.url)))
                const linkTo = item.orgScoped ? buildPath(item.url) : item.url
                
                return (
                  <GuardedNavLink
                    key={item.title}
                    to={item.loading ? '#' : linkTo}
                    onClick={item.loading ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      item.orgScoped && "nav-item-enter",
                      item.loading 
                        ? "animate-pulse pointer-events-none opacity-50" 
                        : "hover:cursor-pointer",
                      isActive 
                        ? "bg-accent text-accent-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                    style={item.orgScoped ? { animationDelay: `${index * 60}ms` } : undefined}
                    tabIndex={item.loading ? -1 : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{t(`nav.${item.title.toLowerCase()}`)}</span>
                  </GuardedNavLink>
                )
              })}
            </nav>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden hover:cursor-pointer">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col gap-4 py-4">
                  <div className="px-2 text-lg font-semibold">{t('nav.navigationMenuTitle')}</div>
                  <nav className="flex flex-col gap-1">
                    {filteredNavigationItems.map((item, index) => {
                      const Icon = item.icon
                      const currentPath = item.orgScoped ? stripOrgPrefix(location.pathname) : location.pathname
                      const isActive = !item.loading && (currentPath === item.url || 
                      (item.url !== '/home' && (currentPath.startsWith(item.url + '/') || currentPath === item.url)))
                      const linkTo = item.orgScoped ? buildPath(item.url) : item.url
                      
                      return (
                        <GuardedNavLink
                          key={item.title}
                          to={item.loading ? '#' : linkTo}
                          onClick={item.loading ? (e: React.MouseEvent) => e.preventDefault() : () => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            item.orgScoped && "nav-item-enter",
                            item.loading 
                              ? "animate-pulse pointer-events-none opacity-50" 
                              : "hover:cursor-pointer",
                            isActive 
                              ? "bg-accent text-accent-foreground" 
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                          style={item.orgScoped ? { animationDelay: `${index * 60}ms` } : undefined}
                          tabIndex={item.loading ? -1 : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{t(`nav.${item.title.toLowerCase()}`)}</span>
                        </GuardedNavLink>
                      )
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Right section: Version + Settings + User (initials only) */}
            <div className="flex items-center gap-2">

              {/* Wisy toggle */}
              <WisyToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden md:flex bg-muted/50 text-muted-foreground text-xs font-mono px-2 py-1 rounded border">
                    v{packageInfo.version}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('header.applicationVersion')}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Settings dropdown */}
              {hasSettingsAccess && (() => {
                const currentPath = stripOrgPrefix(location.pathname)
                const isSettingsActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/')
                const isAnySettingsActive = [
                  '/asset-types', '/custom-fields', '/canvas', '/diagrams', '/media',
                  '/organizations', '/global-admin', '/users', '/roles', '/models', '/auth-types', '/external-systems', '/token-usage'
                ].some(isSettingsActive)

                const settingsItemClass = (path: string) => cn(
                  'hover:cursor-pointer flex items-center gap-2',
                  isSettingsActive(path) && 'bg-accent text-accent-foreground font-medium'
                )
                const settingsIconClass = (path: string) => cn(
                  'h-4 w-4 shrink-0',
                  isSettingsActive(path) ? 'text-accent-foreground' : 'text-muted-foreground'
                )

                return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 w-8 p-0 hover:cursor-pointer',
                        isAnySettingsActive && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">{t('header.settingsMenuSrOnly')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {hasAssetManagementAccess && (
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                          {t('settings.assetManagement')}
                        </DropdownMenuLabel>
                        {(hasAnyPermission(RBAC_PAGES["asset-types"].routePermissions) || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/asset-types")} className={settingsItemClass('/asset-types')}>
                              <FileStack className={settingsIconClass('/asset-types')} />
                              <span className="flex-1">{t('settings.assetTypes')}</span>
                              {isSettingsActive('/asset-types') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(hasAnyPermission(RBAC_PAGES["custom-fields"].routePermissions) || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/custom-fields")} className={settingsItemClass('/custom-fields')}>
                              <Settings2 className={settingsIconClass('/custom-fields')} />
                              <span className="flex-1">{t('settings.customFields')}</span>
                              {isSettingsActive('/custom-fields') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {(hasAnyPermission(RBAC_PAGES.canvas.routePermissions) || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/canvas")} className={settingsItemClass('/canvas')}>
                              <LayoutPanelTop className={settingsIconClass('/canvas')} />
                              <span className="flex-1">{t('settings.canvas')}</span>
                              {isSettingsActive('/canvas') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(hasAnyPermission(RBAC_PAGES.diagrams.routePermissions) || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/diagrams")} className={settingsItemClass('/diagrams')}>
                              <Workflow className={settingsIconClass('/diagrams')} />
                              <span className="flex-1">{t('settings.diagrams')}</span>
                              {isSettingsActive('/diagrams') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(hasAnyPermission(RBAC_PAGES.media.routePermissions) || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/media")} className={settingsItemClass('/media')}>
                              <Image className={settingsIconClass('/media')} />
                              <span className="flex-1">{t('settings.media')}</span>
                              {isSettingsActive('/media') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                    )}

                    {hasAssetManagementAccess && hasAdministrationAccess && <DropdownMenuSeparator />}
                    
                    {hasAdministrationAccess && (
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                          {t('settings.administration')}
                        </DropdownMenuLabel>
                        {(canAccessOrganizations || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/organizations")} className={settingsItemClass('/organizations')}>
                              <Building2 className={settingsIconClass('/organizations')} />
                              <span className="flex-1">{t('settings.organizations')}</span>
                              {isSettingsActive('/organizations') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isRootAdmin && (
                          <DropdownMenuItem asChild>
                            <Link to="/global-admin" className={settingsItemClass('/global-admin')}>
                              <ShieldCheck className={settingsIconClass('/global-admin')} />
                              <span className="flex-1">{t('settings.globalAdminSettings')}</span>
                              {isSettingsActive('/global-admin') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessUsers || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/users")} className={settingsItemClass('/users')}>
                              <Users className={settingsIconClass('/users')} />
                              <span className="flex-1">{t('settings.users')}</span>
                              {isSettingsActive('/users') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessRoles || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/roles")} className={settingsItemClass('/roles')}>
                              <Shield className={settingsIconClass('/roles')} />
                              <span className="flex-1">{t('settings.roles')}</span>
                              {isSettingsActive('/roles') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canAccessModelsPage && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/models")} className={settingsItemClass('/models')}>
                              <Blocks className={settingsIconClass('/models')} />
                              <span className="flex-1">{t('settings.models')}</span>
                              {isSettingsActive('/models') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isRootAdmin && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/auth-types")} className={settingsItemClass('/auth-types')}>
                              <Shield className={settingsIconClass('/auth-types')} />
                              <span className="flex-1">{t('settings.authTypes')}</span>
                              {isSettingsActive('/auth-types') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {/* Mismo permiso que el guard de ruta: `canAccessExternalSystems`
                            (5 acciones) mostraba el ítem a roles que la ruta rebotaba. */}
                        {hasAnyPermission([...RBAC_PAGES["external-systems"].routePermissions]) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/external-systems")} className={settingsItemClass('/external-systems')}>
                              <Network className={settingsIconClass('/external-systems')} />
                              <span className="flex-1">{t('settings.externalSystems')}</span>
                              {isSettingsActive('/external-systems') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessTokenUsage || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/token-usage")} className={settingsItemClass('/token-usage')}>
                              <Coins className={settingsIconClass('/token-usage')} />
                              <span className="flex-1">{t('settings.tokenUsage')}</span>
                              {isSettingsActive('/token-usage') && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                )
              })()}

              {/* User menu (initials only) */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={`${user.name} ${user.last_name}`} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                          {getUserInitials(user.name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      {organizationToken && canListNotifications &&unreadNotificationsCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium leading-none">
                          {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="hover:cursor-pointer" 
                      onSelect={handleUpdateProfile}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('header.updateProfile')}
                    </DropdownMenuItem>
                    {organizationToken && canListNotifications &&(
                      <DropdownMenuItem
                        className="hover:cursor-pointer"
                        onSelect={handleOpenNotifications}
                      >
                        <BellRing className="h-4 w-4 mr-2" />
                        {t('header.notifications')}
                        {unreadNotificationsCount > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium leading-none">
                            {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                          </span>
                        )}
                      </DropdownMenuItem>
                    )}
                    {organizationToken && (
                      <DropdownMenuItem
                        className="hover:cursor-pointer"
                        onSelect={handleOpenSubscriptions}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        {t('header.mySubscriptions')}
                      </DropdownMenuItem>
                    )}
                    {organizationToken && isOrgAdmin && (
                      <DropdownMenuItem
                        className="hover:cursor-pointer"
                        onSelect={handleOpenApiTokens}
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        {t('header.apiTokens')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="hover:cursor-pointer text-red-600" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('header.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>

          <LlmConfigBanner organizationId={selectedOrganizationId} canAccessModels={canAccessModelsPage} />

          <GlobalPanelOutlet />
        </div>

        {/* Dialog de selección de organización */}
        <OrganizationSelectionDialog open={shouldShowDialog} />
        
        {/* Edit profile sheet */}
        {user && (
          <EditUserSheet
            user={user}
            open={profileDialogOpen}
            onOpenChange={setProfileDialogOpen}
            showDailyDigest
          />
        )}

        {/* Subscriptions sheet */}
        {organizationToken && selectedOrganizationId && (
          <SubscriptionsSheet
            open={subscriptionsSheetOpen}
            onOpenChange={setSubscriptionsSheetOpen}
            organizationId={selectedOrganizationId}
          />
        )}

        {/* Notifications sheet */}
        {organizationToken && selectedOrganizationId && (
          <NotificationsSheet
            open={notificationsSheetOpen}
            onOpenChange={setNotificationsSheetOpen}
            organizationId={selectedOrganizationId}
          />
        )}

        {/* API tokens sheet */}
        {organizationToken && selectedOrganizationId && isOrgAdmin && (
          <TokensSheet
            open={tokensSheetOpen}
            onOpenChange={setTokensSheetOpen}
            organizationId={selectedOrganizationId}
          />
        )}
        </NavKnowledgeProvider>
        </EditingGuardProvider>
      </TooltipProvider>
      </GlobalPanelProvider>
    </ChatbotProvider>
  )
}
