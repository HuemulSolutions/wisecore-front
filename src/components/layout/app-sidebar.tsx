"use client"

import * as React from "react"
import { Home, Search, LayoutTemplate, BookText, Settings } from "lucide-react"
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
// import { NavUser } from "@/components/nav-user" // Hidden - user information disabled
import { TeamSwitcher } from "@/components/team-switcher"
import { useOrganization } from "@/contexts/organization-context"
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
    title: "Models",
    url: "/models", 
    icon: Settings,
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
      
      // Si no hay organización seleccionada, seleccionar la primera
      if (!selectedOrganizationId && organizationsData.length > 0) {
        setSelectedOrganizationId(organizationsData[0].id)
      }
    }
  }, [organizationsData, selectedOrganizationId, setOrganizations, setSelectedOrganizationId])

  const handleCreateOrganization = (name: string) => {
    createOrgMutation.mutate({ name })
  }

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganizationId(orgId)
  }

  // Obtener organización seleccionada
  const selectedOrg = organizations.find(org => org.id === selectedOrganizationId) || 
                     (organizations.length > 0 ? organizations[0] : null)

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
        <NavMain items={navigationItems} />
      </SidebarContent>
      <SidebarFooter>
        {/* NavUser removed - user information hidden */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}