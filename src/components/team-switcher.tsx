"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Check } from "lucide-react"

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function TeamSwitcher({
  organizations,
  selectedOrganization,
  onOrganizationChange,
  onCreateOrganization,
  isCreating = false,
}: {
  organizations: Array<{
    id: string
    name: string
  }>
  selectedOrganization?: {
    id: string
    name: string
  } | null
  onOrganizationChange: (orgId: string) => void
  onCreateOrganization: (name: string) => void
  isCreating?: boolean
}) {
  const { isMobile } = useSidebar()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newOrgName, setNewOrgName] = React.useState('')

  const handleCreateOrganization = () => {
    if (newOrgName.trim()) {
      onCreateOrganization(newOrgName.trim())
      setIsDialogOpen(false)
      setNewOrgName('')
    }
  }

  if (!selectedOrganization) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-200 text-gray-500 font-semibold text-xs flex-shrink-0">
              --
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-gray-500">Loading...</span>
              <span className="truncate text-xs text-muted-foreground">Organization</span>
            </div>
          </SidebarMenuButton>
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
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => onOrganizationChange(org.id)}
                className="gap-2 p-2 hover:cursor-pointer"
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
                      disabled={!newOrgName.trim() || isCreating}
                      className="hover:cursor-pointer"
                    >
                      {isCreating ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}