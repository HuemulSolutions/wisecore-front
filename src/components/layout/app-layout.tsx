import { Outlet, Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { Home, Search, LayoutTemplate, BookText, Settings, LogOut, User, Menu } from "lucide-react"
import { useState, useMemo, useEffect, useRef } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OrganizationSelectionDialog } from "@/components/organization/organization-selection-dialog"
import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useAuth } from "@/contexts/auth-context"
import { NavKnowledgeProvider } from "@/components/layout/nav-knowledge"
import EditUserDialog from "@/components/users/users-edit-dialog"
import { cn } from "@/lib/utils"

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
]

export default function AppLayout() {
  const location = useLocation()
  const rawNavigate = useNavigate()
  const { orgId } = useParams<{ orgId: string }>()
  const buildPath = useOrgPath()
  const { requiresOrganizationSelection, organizationToken, selectedOrganizationId, setSelectedOrganizationId, setOrganizationToken, setRequiresOrganizationSelection } = useOrganization()
  const { isLoading: permissionsLoading } = useUserPermissions()
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isInSelectionFlow, setIsInSelectionFlow] = useState(false)
  const [isSwitchingOrg, setIsSwitchingOrg] = useState(false)
  const isSwitchingOrgRef = useRef(false)
  const lastSyncedUrlOrgRef = useRef<string | null>(null)
  // Remember whether the user previously had org-scoped nav access.
  // This lets us show loading placeholders instead of hiding items during
  // the brief gap when the token/permissions are being refreshed.
  const hadOrgAccessRef = useRef(false)
  
  const {
    isRootAdmin,
    isOrgAdmin,
    canAccessUsers,
    canAccessRoles,
    canAccessModels,
    canAccessDocumentTypes,
    canAccessAssets,
    canAccessTemplates,
    // hasPermission,
    hasAnyPermission,
  } = useUserPermissions()
  
  // --- Sync URL orgId → organization context (shared URL / pasted link scenario) ---
  // Only triggers when the URL's orgId ACTUALLY changes (user navigated to a
  // different org URL, e.g. pasted a shared link). Does NOT trigger when
  // selectedOrganizationId changes from the dialog/switcher — that's handled
  // by the context→URL sync below.
  useEffect(() => {
    if (!orgId || orgId === '_' || !user?.id) return

    // If org selection is required (fresh login, no org in localStorage),
    // don't auto-select from the URL. Navigate to a clean URL so the
    // org-selection dialog is shown instead of silently picking the org
    // that was left in the URL from the previous session.
    if (requiresOrganizationSelection) {
      rawNavigate('/home', { replace: true })
      return
    }

    // Only act when the URL orgId truly changed since last check
    if (orgId === lastSyncedUrlOrgRef.current) return
    lastSyncedUrlOrgRef.current = orgId

    // If URL org already matches context, nothing to do
    if (orgId === selectedOrganizationId) return

    // URL has a different org than context → user pasted a shared link
    let cancelled = false
    isSwitchingOrgRef.current = true
    setIsSwitchingOrg(true)
    console.log(`[OrgSync] URL orgId "${orgId}" differs from context "${selectedOrganizationId}", switching...`)

    generateOrganizationToken(orgId)
      .then(async (tokenResponse) => {
        if (cancelled) return

        const orgToken = tokenResponse.token || tokenResponse.data?.token
        if (!orgToken) {
          throw new Error('No token received from server')
        }

        setSelectedOrganizationId(orgId)
        setOrganizationToken(orgToken)
        setRequiresOrganizationSelection(false)

        console.log(`[OrgSync] Switched to org "${orgId}" successfully`)

        await new Promise(resolve => setTimeout(resolve, 200))

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
        console.error(`[OrgSync] Failed to switch to org "${orgId}":`, error)
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
  const shouldShowDialog = requiresOrganizationSelection ||
    (isInSelectionFlow && !!organizationToken && permissionsLoading)
  
  // Filtrar opciones del menú de configuración basándose en permisos
  // NOTA: isOrgAdmin hace bypass de permisos, isRootAdmin NO
  const hasAssetManagementAccess = canAccessDocumentTypes || isOrgAdmin
  const canAccessOrganizations = isOrgAdmin || hasAnyPermission(['organization:l', 'organization:r'])
  const hasAdministrationAccess = canAccessUsers || canAccessRoles || canAccessModels || canAccessOrganizations || isOrgAdmin || isRootAdmin
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

      let shouldShowItem = true
      
      switch (item.title) {
        case "Assets":
          shouldShowItem = canAccessAssets || isOrgAdmin
          break
        case "Templates":
          shouldShowItem = canAccessTemplates || isOrgAdmin
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
    canAccessAssets,
    canAccessTemplates,
    isOrgAdmin,
    isRootAdmin,
    isSwitchingOrg
  ])

  return (
    <TooltipProvider>
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
                  <Link
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
                    <span>{item.title}</span>
                  </Link>
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
                  <div className="px-2 text-lg font-semibold">Navigation</div>
                  <nav className="flex flex-col gap-1">
                    {filteredNavigationItems.map((item, index) => {
                      const Icon = item.icon
                      const currentPath = item.orgScoped ? stripOrgPrefix(location.pathname) : location.pathname
                      const isActive = !item.loading && (currentPath === item.url || 
                      (item.url !== '/home' && (currentPath.startsWith(item.url + '/') || currentPath === item.url)))
                      const linkTo = item.orgScoped ? buildPath(item.url) : item.url
                      
                      return (
                        <Link
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
                          <span>{item.title}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Right section: Version + Settings + User (initials only) */}
            <div className="flex items-center gap-2">

              {/* Version indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden md:flex bg-muted/50 text-muted-foreground text-xs font-mono px-2 py-1 rounded border">
                    v{packageInfo.version}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Application Version</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Settings dropdown */}
              {hasSettingsAccess && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:cursor-pointer">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {hasAssetManagementAccess && (
                      <>
                        <DropdownMenuLabel>Asset Management</DropdownMenuLabel>
                        {(canAccessDocumentTypes || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/asset-types")} className="hover:cursor-pointer">
                              Asset Types
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessDocumentTypes || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/custom-fields")} className="hover:cursor-pointer">
                              Custom Fields
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {hasAdministrationAccess && <DropdownMenuSeparator />}
                      </>
                    )}
                    
                    {hasAdministrationAccess && (
                      <>
                        <DropdownMenuLabel>Administration</DropdownMenuLabel>
                        {(canAccessOrganizations || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/organizations")} className="hover:cursor-pointer">
                              Organizations
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isRootAdmin && (
                          <DropdownMenuItem asChild>
                            <Link to="/global-admin" className="hover:cursor-pointer">
                              Global Admin Settings
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessUsers || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/users")} className="hover:cursor-pointer">
                              Users
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessRoles || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/roles")} className="hover:cursor-pointer">
                              Roles
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessModels || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/models")} className="hover:cursor-pointer">
                              Models
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessDocumentTypes || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to={buildPath("/auth-types")} className="hover:cursor-pointer">
                              Auth Types
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User menu (initials only) */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={`${user.name} ${user.last_name}`} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                          {getUserInitials(user.name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
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
                      Update Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="hover:cursor-pointer text-red-600" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </div>
        
        {/* Dialog de selección de organización */}
        <OrganizationSelectionDialog open={shouldShowDialog} />
        
        {/* Edit profile dialog */}
        {user && (
          <EditUserDialog 
            user={user}
            open={profileDialogOpen} 
            onOpenChange={setProfileDialogOpen} 
          />
        )}
      </NavKnowledgeProvider>
    </TooltipProvider>
  )
}
