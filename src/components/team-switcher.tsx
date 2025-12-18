"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Check } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getUserOrganizations, generateOrganizationToken, addOrganization } from '@/services/organizations'
import { useOrganization } from '@/contexts/organization-context'
import { useAuth } from '@/contexts/auth-context'

interface Organization {
  id: string;
  name: string;
  description?: string | null;
  db_name?: string;
  created_at?: string;
  updated_at?: string;
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newOrgName, setNewOrgName] = React.useState('')
  const [newOrgDescription, setNewOrgDescription] = React.useState('')
  const [isGeneratingToken, setIsGeneratingToken] = React.useState(false)
  
  const { selectedOrganizationId, organizations, setSelectedOrganizationId, setOrganizations, setOrganizationToken } = useOrganization()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: organizationsData, isLoading } = useQuery({
    queryKey: ['user-organizations', user?.id],
    queryFn: () => getUserOrganizations(user!.id),
    enabled: !!user?.id,
  })

  const createOrgMutation = useMutation({
    mutationFn: addOrganization,
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] })
      handleOrganizationChange(newOrg.id)
      setNewOrgName('')
      setNewOrgDescription('')
      setIsDialogOpen(false)
    },
  })

  React.useEffect(() => {
    if (organizationsData) {
      setOrganizations(organizationsData)
    }
  }, [organizationsData, setOrganizations])

  const selectedOrganization = organizations?.find(org => org.id === selectedOrganizationId)

  const handleOrganizationChange = async (orgId: string) => {
    if (orgId && user?.id) {
      setIsGeneratingToken(true)
      try {
        const tokenResponse = await generateOrganizationToken(user.id, orgId)
        const orgToken = tokenResponse.token || tokenResponse.data?.token
        
        setSelectedOrganizationId(orgId)
        setOrganizationToken(orgToken)
        
        console.log('Organization token generated successfully:', orgToken?.substring(0, 10) + '...')
        
      } catch (error) {
        console.error('Error generating organization token:', error)
      } finally {
        setIsGeneratingToken(false)
      }
    }
  }

  const handleCreateOrganization = () => {
    if (newOrgName.trim()) {
      createOrgMutation.mutate({ 
        name: newOrgName.trim(),
        description: newOrgDescription.trim() || undefined
      })
    }
  }

  if (!selectedOrganization) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-200 text-gray-500 font-semibold text-xs flex-shrink-0">
                  --
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-gray-500">Select Organization</span>
                  <span className="truncate text-xs text-muted-foreground">Choose from list</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Organizations
              </DropdownMenuLabel>
              {organizationsData?.map((org: Organization) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrganizationChange(org.id)}
                  className="gap-2 p-2 hover:cursor-pointer"
                  disabled={isGeneratingToken}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold text-xs">
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setTimeout(() => setIsDialogOpen(true), 0)
                    }}
                    className="gap-2 p-2 hover:cursor-pointer"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-transparent">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">Add Organization</div>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      Create New Organization
                    </DialogTitle>
                    <DialogDescription>
                      Create a new organization to manage your documents and templates.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <label htmlFor="org-name" className="text-sm font-medium text-gray-900">
                        Organization Name *
                      </label>
                      <Input
                        id="org-name"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Enter organization name"
                        className="w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleCreateOrganization()
                          }
                        }}
                      />
                    </div>
                    <div className="grid gap-4">
                      <label htmlFor="org-desc" className="text-sm font-medium text-gray-900">
                        Description (Optional)
                      </label>
                      <Input
                        id="org-desc"
                        value={newOrgDescription}
                        onChange={(e) => setNewOrgDescription(e.target.value)}
                        placeholder="Enter organization description"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false)
                        setNewOrgName('')
                        setNewOrgDescription('')
                      }}
                      className="hover:cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateOrganization}
                      disabled={!newOrgName.trim() || createOrgMutation.isPending}
                      className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                    >
                      {createOrgMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold text-xs flex-shrink-0">
                {selectedOrganization.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{selectedOrganization.name}</span>
                <span className="truncate text-xs text-muted-foreground">Organization</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizationsData?.map((org: Organization) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrganizationChange(org.id)}
                className="gap-2 p-2 hover:cursor-pointer"
                disabled={isGeneratingToken}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold text-xs">
                  {org.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                </div>
                {selectedOrganization.id === org.id && (
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setTimeout(() => setIsDialogOpen(true), 0)
                  }}
                  className="gap-2 p-2 hover:cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add Organization</div>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Create New Organization
                  </DialogTitle>
                  <DialogDescription>
                    Create a new organization to manage your documents and templates.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <label htmlFor="org-name-2" className="text-sm font-medium text-gray-900">
                      Organization Name *
                    </label>
                    <Input
                      id="org-name-2"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="Enter organization name"
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleCreateOrganization()
                        }
                      }}
                    />
                  </div>
                  <div className="grid gap-4">
                    <label htmlFor="org-desc-2" className="text-sm font-medium text-gray-900">
                      Description (Optional)
                    </label>
                    <Input
                      id="org-desc-2"
                      value={newOrgDescription}
                      onChange={(e) => setNewOrgDescription(e.target.value)}
                      placeholder="Enter organization description"
                      className="w-full"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false)
                      setNewOrgName('')
                      setNewOrgDescription('')
                    }}
                    className="hover:cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateOrganization}
                    disabled={!newOrgName.trim() || createOrgMutation.isPending}
                    className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                  >
                    {createOrgMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}