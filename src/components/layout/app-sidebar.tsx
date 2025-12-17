"use client"

import * as React from "react"
import { Home, Search, LayoutTemplate, BookText, Shield, Package } from "lucide-react"
import { useLocation } from "react-router-dom"
import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useOrganization } from "@/contexts/organization-context"
import { useAuth } from "@/contexts/auth-context"
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
  const { user } = useAuth()
  
  const { 
    selectedOrganizationId, 
    organizations, 
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

  // Filtrar navigationItems basándose en permisos de administrador
  const filteredNavigationItems = navigationItems.filter(item => {
    // Si el item es "Administration" o "Asset Management", solo mostrarlo si el usuario es admin
    if (item.title === "Administration" || item.title === "Asset Management") {
      return user?.is_root_admin === true
    }
    return true
  })

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
        <NavMain items={filteredNavigationItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}