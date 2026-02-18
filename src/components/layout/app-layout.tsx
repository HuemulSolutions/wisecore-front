import { Outlet, Link, useLocation } from "react-router-dom"
import { Home, Search, LayoutTemplate, BookText, Settings, LogOut, User, Menu } from "lucide-react"
import { useState, useMemo } from "react"
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
  },
  {
    title: "Assets",
    url: "/asset", 
    icon: BookText,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: LayoutTemplate,
  },
]

export default function AppLayout() {
  const location = useLocation()
  const { requiresOrganizationSelection, organizationToken } = useOrganization()
  const { isLoading: permissionsLoading } = useUserPermissions()
  const { user, logout } = useAuth()
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
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
  
  // El diálogo debe mantenerse abierto si:
  // 1. Se requiere selección de organización O
  // 2. Tenemos token de organización pero los permisos aún están cargando
  const shouldShowDialog = requiresOrganizationSelection || (!!organizationToken && permissionsLoading)
  
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

  // Filtrar navigationItems basándose en permisos del usuario
  const filteredNavigationItems = useMemo(() => {
    if (!organizationToken || permissionsLoading) {
      return []
    }

    return navigationItems.map(item => {
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

      return shouldShowItem ? item : null
    }).filter(Boolean) as typeof navigationItems
  }, [
    organizationToken,
    permissionsLoading,
    canAccessAssets,
    canAccessTemplates,
    isRootAdmin
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
              {filteredNavigationItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.url || 
                  (item.url !== '/home' && (location.pathname.startsWith(item.url + '/') || location.pathname === item.url))
                
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:cursor-pointer",
                      isActive 
                        ? "bg-accent text-accent-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
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
                    {filteredNavigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.url || 
                      (item.url !== '/home' && (location.pathname.startsWith(item.url + '/') || location.pathname === item.url))
                      
                      return (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:cursor-pointer",
                            isActive 
                              ? "bg-accent text-accent-foreground" 
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <Icon className="h-4 w-4" />
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
                            <Link to="/asset-types" className="hover:cursor-pointer">
                              Asset Types
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessDocumentTypes || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to="/custom-fields" className="hover:cursor-pointer">
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
                            <Link to="/organizations" className="hover:cursor-pointer">
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
                            <Link to="/users" className="hover:cursor-pointer">
                              Users
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessRoles || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to="/roles" className="hover:cursor-pointer">
                              Roles
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessModels || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to="/models" className="hover:cursor-pointer">
                              Models
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessDocumentTypes || isOrgAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to="/auth-types" className="hover:cursor-pointer">
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
