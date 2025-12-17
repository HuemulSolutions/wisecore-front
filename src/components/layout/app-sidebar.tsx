"use client"

import * as React from "react"
import { Home, Search, LayoutTemplate, BookText, Shield, Package } from "lucide-react"
import { useLocation } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { getAllOrganizations, addOrganization } from "@/services/organizations"
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
  {
    title: "Asset Management",
    url: "#",
    icon: Package,
    items: [
      {
        title: "Asset Types",
        url: "/asset-types",
      },
    ],
  },
  {
    title: "Administration",
    url: "#",
    icon: Shield,
    items: [
      {
        title: "Users",
        url: "/users",
      },
      {
        title: "Roles",
        url: "/roles",
      },
      {
        title: "Models",
        url: "/models",
      },
      {
        title: "Auth Types",
        url: "/auth-types",
      },
    ],
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
  const queryClient = useQueryClient()
  const location = useLocation()
  const isMobile = useIsMobile()
  const {
    isRootAdmin,
    canAccessUsers,
    canAccessRoles,
    canAccessAssets,
    canAccessModels,
    canAccessTemplates,
    canAccessDocumentTypes,
    isLoading: permissionsLoading,
  } = useUserPermissions()
  
  const { 
    selectedOrganizationId, 
    organizations, 
    organizationToken,
    setSelectedOrganizationId, 
    setOrganizations 
  } = useOrganization()

  // Query para obtener organizaciones
  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
  })

  // Mutation para crear organización
  const createOrgMutation = useMutation({
    mutationFn: addOrganization,
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setSelectedOrganizationId(newOrg.id)
    },
  })

  // Cerrar sidebar automáticamente en móvil cuando cambia la ubicación
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [location.pathname, isMobile, setOpenMobile])

  // Actualizar organizaciones cuando se cargan los datos
  useEffect(() => {
    if (organizationsData) {
      setOrganizations(organizationsData)
    }
  }, [organizationsData, setOrganizations])

  const handleCreateOrganization = (name: string) => {
    createOrgMutation.mutate({ name })
  }

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganizationId(orgId)
  }

  // Obtener organización seleccionada
  const selectedOrg = organizations.find(org => org.id === selectedOrganizationId) || null

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
          shouldShowItem = canAccessAssets || isRootAdmin;
          break;
        case "Templates":
          // Mostrar Templates si tiene cualquier permiso relacionado con templates
          shouldShowItem = canAccessTemplates || isRootAdmin;
          break;
        case "Asset Management":
          // Mostrar Asset Management si tiene acceso a document types o asset types
          shouldShowItem = canAccessDocumentTypes || isRootAdmin;
          break;
        case "Administration":
          // Mostrar Administration si tiene acceso a cualquier función administrativa
          shouldShowItem = canAccessUsers || canAccessRoles || canAccessModels || isRootAdmin;
          break;
        default:
          // Home y Search son accesibles para todos los usuarios autenticados
          shouldShowItem = true;
      }

      if (!shouldShowItem) {
        return null;
      }

      // Si el item tiene subitems, filtrarlos también
      if (item.items) {
        const filteredSubItems = item.items.filter(subItem => {
          switch (subItem.title) {
            case "Asset Types":
              // Solo mostrar si tiene permisos para gestionar tipos de documentos/assets
              return canAccessDocumentTypes || isRootAdmin;
            case "Users":
              // Solo mostrar si tiene permisos para gestionar usuarios
              return canAccessUsers || isRootAdmin;
            case "Roles":
              // Solo mostrar si tiene permisos para gestionar roles
              return canAccessRoles || isRootAdmin;
            case "Models":
              // Solo mostrar si tiene permisos para gestionar modelos LLM
              return canAccessModels || isRootAdmin;
            case "Auth Types":
              // Solo root admin puede gestionar tipos de autenticación
              return isRootAdmin;
            default:
              return true;
          }
        });

        // Si no tiene subitems visibles, no mostrar el item principal
        if (filteredSubItems.length === 0) {
          return null;
        }

        return {
          ...item,
          items: filteredSubItems
        };
      }

      return item;
    }).filter(Boolean) as typeof navigationItems;
  }, [
    menuReady,
    canAccessAssets,
    canAccessTemplates, 
    canAccessDocumentTypes,
    canAccessUsers,
    canAccessRoles,
    canAccessModels,
    isRootAdmin
  ])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          organizations={organizations}
          selectedOrganization={selectedOrg}
          onOrganizationChange={handleOrganizationChange}
          onCreateOrganization={handleCreateOrganization}
          isCreating={createOrgMutation.isPending}
        />
      </SidebarHeader>
      <SidebarContent>
        {!menuReady ? (
          <div className="space-y-2 px-2 pt-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-sidebar-foreground/70 px-2 mb-2">
                Navigation
              </div>
              {/* Home */}
              <div className="flex items-center gap-3 rounded-md px-3 py-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-12" />
              </div>
              {/* Search */}
              <div className="flex items-center gap-3 rounded-md px-3 py-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-16" />
              </div>
              {/* Loading placeholders para otros elementos */}
              <div className="flex items-center gap-3 rounded-md px-3 py-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center gap-3 rounded-md px-3 py-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ) : (
          <NavMain items={filteredNavigationItems} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}