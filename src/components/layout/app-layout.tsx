import { Outlet, Link, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { ChevronRight, Settings } from "lucide-react"
import { Separator } from "@/components/ui/separator"
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
import { Button } from "@/components/ui/button"
import { OrganizationSelectionDialog } from "@/components/organization/organization-selection-dialog"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"

export default function AppLayout() {
  const location = useLocation()
  const { requiresOrganizationSelection, organizationToken } = useOrganization()
  const { isLoading: permissionsLoading } = useUserPermissions()
  const {
    isRootAdmin,
    canAccessUsers,
    canAccessRoles,
    canAccessModels,
    canAccessDocumentTypes,
  } = useUserPermissions()
  
  // El diálogo debe mantenerse abierto si:
  // 1. Se requiere selección de organización O
  // 2. Tenemos token de organización pero los permisos aún están cargando
  const shouldShowDialog = requiresOrganizationSelection || (!!organizationToken && permissionsLoading)
  
  // Map routes to display names
  const getPageName = (pathname: string): string => {
    const routes: { [key: string]: string } = {
      '/home': 'Home',
      '/asset': 'Assets',
      '/editor': 'Editor',
      '/search': 'Search',
      '/templates': 'Templates',
      '/organizations': 'Organizations',
      '/graph': 'Graph',
      '/models': 'Models',
      '/users': 'Users',
      '/roles': 'Roles',
      '/auth-types': 'Authentication Types',
      '/asset-types': 'Asset Types',
      '/custom-fields': 'Custom Fields',
    }
    
    // Handle dynamic routes
    if (pathname.startsWith('/asset/')) return 'Asset'
    if (pathname.startsWith('/document/')) return 'Document'
    if (pathname.startsWith('/configTemplate/')) return 'Template Configuration'
    if (pathname.startsWith('/configDocument/')) return 'Document Configuration'
    if (pathname.startsWith('/execution/')) return 'Execution'
    if (pathname.startsWith('/docDepend/')) return 'Document Dependencies'
    
    return routes[pathname] || 'Dashboard'
  }

  const currentPage = getPageName(location.pathname)
  const isHomePage = location.pathname === '/home'

  // Filtrar opciones del menú de configuración basándose en permisos
  const hasAssetManagementAccess = canAccessDocumentTypes || isRootAdmin
  const hasAdministrationAccess = canAccessUsers || canAccessRoles || canAccessModels || isRootAdmin
  const hasSettingsAccess = hasAssetManagementAccess || hasAdministrationAccess

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-1 transition-[width,height] ease-linear group-has-[collapsible=icon]/sidebar-wrapper:h-10 border-b border-sidebar-border bg-background">
            <div className="flex items-center gap-1 px-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="hover:cursor-pointer -ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle sidebar</p>
                </TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="mr-1 h-3" />
              
              {/* Breadcrumb navigation */}
              <nav className="flex items-center gap-0.5 text-sm" aria-label="Breadcrumb">
                {isHomePage ? (
                  <span className="font-semibold text-foreground px-1 py-1">
                    Wisecore
                  </span>
                ) : (
                  <>
                    <Link
                      to="/home"
                      className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:cursor-pointer transition-colors px-1 py-1 rounded-md hover:bg-muted/50"
                    >
                      Wisecore
                    </Link>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 mx-0.5" />
                    <span className="font-medium text-foreground px-1 py-1 text-sm">
                      {currentPage}
                    </span>
                  </>
                )}
              </nav>
            </div>
            
            {/* Version indicator and settings */}
            <div className="flex items-center gap-1 px-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted/50 text-muted-foreground text-xs font-mono px-1.5 py-0.5 rounded text-[10px] border">
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
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:cursor-pointer">
                      <Settings className="h-3.5 w-3.5" />
                      <span className="sr-only">Settings menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {hasAssetManagementAccess && (
                      <>
                        <DropdownMenuLabel>Asset Management</DropdownMenuLabel>
                        {(canAccessDocumentTypes || isRootAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to="/asset-types" className="hover:cursor-pointer">
                              Asset Types
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessDocumentTypes || isRootAdmin) && (
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
                        {(canAccessUsers || isRootAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to="/users" className="hover:cursor-pointer">
                              Users
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessRoles || isRootAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to="/roles" className="hover:cursor-pointer">
                              Roles
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canAccessModels || isRootAdmin) && (
                          <DropdownMenuItem asChild>
                            <Link to="/models" className="hover:cursor-pointer">
                              Models
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isRootAdmin && (
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
            </div>
          </header>
          <div className="flex-1">
            {/* <PermissionsDebugger /> */}
            <Outlet />
          </div>
        </SidebarInset>
        
        {/* Dialog de selección de organización */}
        <OrganizationSelectionDialog open={shouldShowDialog} />
      </SidebarProvider>
    </TooltipProvider>
  )
}