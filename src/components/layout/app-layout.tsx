import { Outlet, Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { Home, Search, LayoutTemplate, BookText, Menu, Network, Workflow } from "lucide-react"
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
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { OrganizationSelectionDialog } from "@/components/organization/organization-selection-dialog"
import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useAuth } from "@/contexts/auth-context"
import { RBAC_PAGES } from "@/lib/rbac-matrix"
import { HeaderSettingsMenu } from "@/components/layout/header-settings-menu"
import { HeaderUserMenu } from "@/components/layout/header-user-menu"

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
    <ResizablePanel id="outlet" order={side === "left" ? 2 : 1} defaultSize={isOpen ? 100 - defaultSize : 100} minSize={30} className="overflow-auto">
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </ResizablePanel>
  )

  const sidePanel = (
    <ResizablePanel
      id="global-panel"
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
    // El editor de diagramas (árbol de assets + canvas) vive en /diagrams: es
    // una superficie de trabajo, no una pantalla de configuración, así que va
    // en el nav central. `Advanced` bajó al dropdown de settings.
    title: "Diagrams",
    url: "/diagrams",
    icon: Network,
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
  
  // Sin helpers `canAccessX`: todo gate de nav sale de RBAC_PAGES, que es la
  // misma fuente que el guard de ruta (ver ia context/rbac-audit-guide.md).
  const {
    isRootAdmin,
    isOrgAdmin,
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
  
  // Permiso de la página Modelos: lo consume el LlmConfigBanner además del
  // menú de settings (HeaderSettingsMenu), por eso queda acá y no solo en el
  // registro del menú.
  const canAccessModelsPage = hasAnyPermission(RBAC_PAGES.models.routePermissions)

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

      // Ningún `|| isOrgAdmin` en los cases: ese bypass ya vive dentro de
      // hasAnyPermission (ver permissions-context.tsx).
      switch (item.title) {
        case "Assets":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.asset.routePermissions)
          break
        case "Templates":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.templates.routePermissions)
          break
        case "Diagrams":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.diagrams.routePermissions)
          break
        case "Workflow":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.workflow.routePermissions)
          break
        case "Search":
          shouldShowItem = hasAnyPermission(RBAC_PAGES.search.routePermissions)
          break
        default:
          // Secure-by-default: un ítem nuevo sin `case` queda oculto en vez de
          // visible para todos. `/search` vivió así hasta la 15ª pasada, y el
          // mismo agujero por omisión sostuvo el ítem de Media.
          shouldShowItem = false
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

  // Vista compartida de workflow a pantalla completa (ver
  // ia context/fullscreen-share-route-guide.md): mismos providers que el resto
  // de la app (Chatbot/GlobalPanel/Tooltip/EditingGuard/NavKnowledge, de los
  // que depende AssetFormSection), pero SIN header/nav/LlmConfigBanner/
  // GlobalPanelOutlet — quien abre el link no debe ver ni tocar el resto de
  // la organización. Todos los efectos de arriba (OrgSync, returnUrl, etc.)
  // siguen corriendo igual: solo cambia lo que se renderiza.
  const isBareRoute = /^\/workflow\/share\//.test(stripOrgPrefix(location.pathname))
  if (isBareRoute) {
    return (
      <ChatbotProvider resetKey={selectedOrganizationId ?? 'no-org'}>
        <GlobalPanelProvider>
          <TooltipProvider>
            <EditingGuardProvider>
              <NavKnowledgeProvider>
                <div className="flex flex-col h-dvh overflow-hidden">
                  <Suspense fallback={<PageSkeleton />}>
                    <Outlet />
                  </Suspense>
                </div>
              </NavKnowledgeProvider>
            </EditingGuardProvider>
          </TooltipProvider>
        </GlobalPanelProvider>
      </ChatbotProvider>
    )
  }

  return (
    <ChatbotProvider resetKey={selectedOrganizationId ?? 'no-org'}>
      <GlobalPanelProvider>
      <TooltipProvider>
        <EditingGuardProvider>
        <NavKnowledgeProvider>
        <div className="flex flex-col h-dvh overflow-hidden">
          <header
            className="sticky top-0 z-(--z-app-header) flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4"
            data-app-header
          >
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
              <HeaderSettingsMenu
                organizationToken={organizationToken}
                onOpenApiTokens={handleOpenApiTokens}
              />

              {/* User menu (initials only) */}
              {user && (
                <HeaderUserMenu
                  user={user}
                  organizationToken={organizationToken}
                  canListNotifications={canListNotifications}
                  unreadNotificationsCount={unreadNotificationsCount}
                  onUpdateProfile={handleUpdateProfile}
                  onOpenNotifications={handleOpenNotifications}
                  onOpenSubscriptions={handleOpenSubscriptions}
                  onSignOut={handleSignOut}
                />
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
            // Editar el propio perfil no es una acción sobre el recurso `user`
            // de la organización: no requiere `user:u`.
            canSave={true}
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
