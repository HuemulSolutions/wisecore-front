"use client"

import * as React from "react"
import { Home, Search, LayoutTemplate, BookText } from "lucide-react"
import { useLocation } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { NavMain } from "@/components/layout/nav-main"
import { NavKnowledgeHeader, NavKnowledgeContent } from "@/components/layout/nav-knowledge"
import { NavUser } from "@/components/layout/nav-user"
import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"

import { useIsMobile } from "@/hooks/use-mobile"

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

// Mock user data - replace with real user context when available
// const currentUser = {
//   name: "John Doe",
//   email: "john.doe@example.com",
//   avatar: undefined // URL to avatar image
// } // Hidden - user information disabled

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()
  const location = useLocation()
  const isMobile = useIsMobile()
  const {
    isOrgAdmin,
    canAccessAssets,
    canAccessTemplates,
    isLoading: permissionsLoading,
  } = useUserPermissions()
  
  const { 
    organizationToken
  } = useOrganization()



  // Cerrar sidebar automáticamente en móvil cuando cambia la ubicación
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [location.pathname, isMobile, setOpenMobile])









  // Estado interno para controlar el parpadeo del menú
  const [menuReady, setMenuReady] = useState(false);
  
  // Determinar si los permisos están listos para mostrar
  const permissionsReady = organizationToken && !permissionsLoading;

  // Controlar la transición del menú con un pequeño delay para evitar parpadeo
  useEffect(() => {
    console.log('Sidebar state:', { 
      organizationToken: !!organizationToken, 
      permissionsLoading, 
      permissionsReady, 
      menuReady 
    });
    
    if (permissionsReady) {
      // Pequeño delay para asegurar que el contexto esté completamente actualizado
      const timer = setTimeout(() => {
        console.log('Setting menuReady to true');
        setMenuReady(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Inmediatamente mostrar loading cuando no está ready
      console.log('Setting menuReady to false');
      setMenuReady(false);
    }
  }, [permissionsReady, organizationToken, permissionsLoading]);

  // Filtrar navigationItems basándose en permisos del usuario
  const filteredNavigationItems = useMemo(() => {
    // Si los permisos no están listos, no devolver ningún item
    // El componente mostrará skeleton loading en su lugar
    if (!menuReady) {
      return [];
    }

    return navigationItems.map(item => {
      // Verificar cada item principal
      let shouldShowItem = true;
      
      switch (item.title) {
        case "Assets":
          // Mostrar Assets si tiene cualquier permiso relacionado con assets
          shouldShowItem = canAccessAssets || isOrgAdmin;
          break;
        case "Templates":
          // Mostrar Templates si tiene cualquier permiso relacionado con templates
          shouldShowItem = canAccessTemplates || isOrgAdmin;
          break;
        default:
          // Home y Search son accesibles para todos los usuarios autenticados
          shouldShowItem = true;
      }

      return shouldShowItem ? item : null;
    }).filter(Boolean) as typeof navigationItems;
  }, [
    menuReady,
    canAccessAssets,
    canAccessTemplates,
    isOrgAdmin
  ])

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <NavKnowledgeProvider> */}
        <SidebarHeader>
          <OrganizationSwitcher />
          {!menuReady ? (
            <div className="space-y-1 px-2 pt-2">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-sidebar-foreground/70 px-2 mb-1">
                  Navigation
                </div>
                {/* Home */}
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-10" />
                </div>
                {/* Search */}
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-14" />
                </div>
                {/* Loading placeholders para otros elementos */}
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <NavMain items={filteredNavigationItems} />
              <NavKnowledgeHeader />
            </>
          )}
        </SidebarHeader>
        <SidebarContent>
          {menuReady && <NavKnowledgeContent />}
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      {/* </NavKnowledgeProvider> */}
    </Sidebar>
  )
}