import { Home, Search, LayoutTemplate, LibraryBig, BookText, ChevronDown, Building2, Check, Plus, User, Settings, LogOut } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useOrganization } from "@/contexts/organization-context"
import { getAllOrganizations, addOrganization } from "@/services/organizations"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "Library",
    url: "/library",
    icon: LibraryBig,
  },
  {
    title: "Assets",
    url: "/assets",
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

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const queryClient = useQueryClient()
  
  const { 
    selectedOrganizationId, 
    organizations, 
    setSelectedOrganizationId, 
    setOrganizations 
  } = useOrganization()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')

  // Query para obtener organizaciones
  const { data: organizationsData, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
  })

  // Mutation para crear organización
  const createOrgMutation = useMutation({
    mutationFn: addOrganization,
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setSelectedOrganizationId(newOrg.id)
      setIsDialogOpen(false)
      setNewOrgName('')
    },
  })

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

  const handleCreateOrganization = () => {
    if (newOrgName.trim()) {
      createOrgMutation.mutate({ name: newOrgName.trim() })
    }
  }

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganizationId(orgId)
  }

  // Obtener organización seleccionada
  const selectedOrg = organizations.find(org => org.id === selectedOrganizationId) || 
                     (organizations.length > 0 ? organizations[0] : null)

  // Mock user data - replace with real user context when available
  const currentUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: null // URL to avatar image
  }

  // Generate initials from user name
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // User actions
  const handleProfileClick = () => {
    console.log('Navigate to profile')
    // TODO: Navigate to profile page
  }

  const handleSettingsClick = () => {
    console.log('Navigate to settings')
    // TODO: Navigate to settings page
  }

  const handleSignOut = () => {
    console.log('Sign out user')
    // TODO: Implement sign out logic
  }

  if (isLoading) {
    return (
      <Sidebar className="bg-white border-r border-gray-200">
        <SidebarHeader className="border-b border-sidebar-border p-2 bg-white">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-gray-200 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-white">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 w-full hover:cursor-pointer",
                            isActive && "bg-accent text-accent-foreground"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="bg-white border-r border-gray-200">
      {/* Header con selector de organización */}
      <SidebarHeader className="border-b border-sidebar-border p-2 bg-white">
        {!isCollapsed && selectedOrg && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-auto py-2 hover:cursor-pointer">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold text-xs flex-shrink-0">
                      {selectedOrg.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-1 flex-col items-start leading-tight">
                      <span className="font-semibold text-sm">{selectedOrg.name}</span>
                      <span className="text-xs text-sidebar-foreground/60">Organization</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Change Organization</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => handleOrganizationChange(org.id)}
                      className="flex items-center justify-between gap-2 hover:cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{org.name}</p>
                          <p className="text-xs text-muted-foreground truncate">Organization</p>
                        </div>
                      </div>
                      {selectedOrg.id === org.id && <Check className="h-4 w-4 text-green-600 flex-shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault()
                        setTimeout(() => setIsDialogOpen(true), 0)
                      }} className="hover:cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Add Organization</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Organization</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="org-name">Organization Name</Label>
                          <Input
                            id="org-name"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            placeholder="Enter organization name"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateOrganization()
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)}
                            className="hover:cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateOrganization}
                            disabled={!newOrgName.trim() || createOrgMutation.isPending}
                            className="hover:cursor-pointer"
                          >
                            {createOrgMutation.isPending ? 'Creating...' : 'Create'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        {isCollapsed && selectedOrg && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold text-xs flex-shrink-0 mx-auto">
            {selectedOrg.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-white p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 w-full hover:cursor-pointer",
                          isActive && "bg-accent text-accent-foreground"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="bg-white border-t border-gray-200 p-2">
        {!isCollapsed ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-auto py-3 hover:cursor-pointer">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex-shrink-0">
                      {currentUser.avatar ? (
                        <img 
                          src={currentUser.avatar} 
                          alt={currentUser.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span>{getUserInitials(currentUser.name)}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col items-start leading-tight">
                      <span className="font-medium text-sm truncate">{currentUser.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{currentUser.email}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="hover:cursor-pointer" onClick={handleProfileClick}>
                    <User className="h-4 w-4 mr-2" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:cursor-pointer" onClick={handleSettingsClick}>
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="hover:cursor-pointer text-red-600" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center p-2 hover:cursor-pointer">
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                    {currentUser.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span>{getUserInitials(currentUser.name)}</span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}