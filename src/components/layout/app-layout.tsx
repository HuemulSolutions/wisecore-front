import { Outlet, Link, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { ChevronRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import packageInfo from "../../../package.json"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function AppLayout() {
  const location = useLocation()
  
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

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-sidebar-border bg-background">
            <div className="flex items-center gap-2 px-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="hover:cursor-pointer -ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle sidebar</p>
                </TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="mr-2 h-4" />
              
              {/* Breadcrumb navigation */}
              <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
                {isHomePage ? (
                  <span className="font-semibold text-foreground px-2 py-2">
                    Wisecore
                  </span>
                ) : (
                  <>
                    <Link
                      to="/home"
                      className="font-semibold text-muted-foreground hover:text-foreground hover:cursor-pointer transition-colors px-2 py-2 rounded-md hover:bg-muted/50"
                    >
                      Wisecore
                    </Link>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 mx-1" />
                    <span className="font-medium text-foreground px-2 py-2">
                      {currentPage}
                    </span>
                  </>
                )}
              </nav>
            </div>
            
            {/* Version indicator */}
            <div className="flex items-center px-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted/50 text-muted-foreground text-xs font-mono px-2 py-1 rounded-md border">
                    v{packageInfo.version}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Application Version</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}