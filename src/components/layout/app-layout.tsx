import { Outlet, Link, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { ChevronRight } from "lucide-react"
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
      '/library': 'Library',
      '/assets': 'Assets',
      '/editor': 'Editor',
      '/search': 'Search',
      '/templates': 'Templates',
      '/organizations': 'Organizations',
      '/graph': 'Graph',
    }
    
    // Handle dynamic routes
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
        <main className="flex flex-col h-screen w-full">
          <header className="shrink-0 border-b flex items-center p-4 gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="hover:cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle sidebar</p>
              </TooltipContent>
            </Tooltip>
            
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
          </header>
        <div className="flex-1 overflow-auto bg-muted/50 min-h-0">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
    </TooltipProvider>
  )
}