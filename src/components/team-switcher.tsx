"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Loader2, Pencil } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OrganizationSelectionDialog } from '@/components/organization-selection-dialog'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getUserOrganizations, addOrganization, updateOrganization, deleteOrganization } from '@/services/organizations'
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
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isOrgSelectionOpen, setIsOrgSelectionOpen] = React.useState(false)
  const [newOrgName, setNewOrgName] = React.useState('')
  const [newOrgDescription, setNewOrgDescription] = React.useState('')
  const [editingOrg, setEditingOrg] = React.useState<Organization | null>(null)
  const [deletingOrg, setDeletingOrg] = React.useState<Organization | null>(null)
  
  const { selectedOrganizationId, organizations, setSelectedOrganizationId, setOrganizations, setOrganizationToken } = useOrganization()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: organizationsData } = useQuery({
    queryKey: ['user-organizations', user?.id],
    queryFn: () => getUserOrganizations(user!.id),
    enabled: !!user?.id,
  })

  const createOrgMutation = useMutation({
    mutationFn: addOrganization,
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] })
      setSelectedOrganizationId(newOrg.id)
      setNewOrgName('')
      setNewOrgDescription('')
      setIsDialogOpen(false)
    },
  })

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description?: string }) =>
      updateOrganization(id, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] })
      setEditingOrg(null)
      setIsEditDialogOpen(false)
    },
  })

  const deleteOrgMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] })
      setDeletingOrg(null)
      setIsDeleteDialogOpen(false)
      // If deleted org was selected, clear selection and reset context
      if (deletingOrg && selectedOrganizationId === deletingOrg.id) {
        setSelectedOrganizationId('')
        setOrganizationToken('')
        // Invalidar todas las queries de la organización eliminada
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey
            return Array.isArray(queryKey) && (
              queryKey.includes('documents') ||
              queryKey.includes('document-types') ||
              queryKey.includes('roles') ||
              queryKey.includes('permissions') ||
              queryKey.includes('assets') ||
              queryKey.includes('asset-types') ||
              queryKey.includes('users') ||
              queryKey.includes('knowledge') ||
              queryKey.includes('library') ||
              queryKey.some(key => typeof key === 'string' && key.includes('org'))
            )
          }
        })
      }
    },
  })

  React.useEffect(() => {
    if (organizationsData) {
      setOrganizations(organizationsData)
    }
  }, [organizationsData, setOrganizations])

  const selectedOrganization = organizations?.find(org => org.id === selectedOrganizationId)

  const handleCreateOrganization = () => {
    if (newOrgName.trim()) {
      createOrgMutation.mutate({ 
        name: newOrgName.trim(),
        description: newOrgDescription.trim() || undefined
      })
    }
  }

  const handleEditOrganization = () => {
    if (editingOrg && editingOrg.name.trim()) {
      updateOrgMutation.mutate({
        id: editingOrg.id,
        name: editingOrg.name.trim(),
        description: editingOrg.description?.trim() || undefined
      })
    }
  }

  const handleDeleteOrganization = () => {
    if (deletingOrg) {
      deleteOrgMutation.mutate(deletingOrg.id)
    }
  }

  const renderSidebarMenu = () => {
    if (!selectedOrganization) {
      return (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:cursor-pointer"
              onClick={() => setIsOrgSelectionOpen(true)}
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
        </SidebarMenuItem>
      </SidebarMenu>
      )
    }

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:cursor-pointer"
            onClick={() => setIsOrgSelectionOpen(true)}
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
      </SidebarMenuItem>
    </SidebarMenu>
    )
  }

  return (
    <>
      {renderSidebarMenu()}
      
      <OrganizationSelectionDialog 
        open={isOrgSelectionOpen} 
        onOpenChange={setIsOrgSelectionOpen}
        preselectedOrganizationId={selectedOrganizationId || undefined}
      />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Organization
          </DialogTitle>
          <DialogDescription>
            Create a new organization to manage documents and users.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault()
          handleCreateOrganization()
        }} className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                name="name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-desc">Description (Optional)</Label>
              <Input
                id="org-desc"
                name="description"
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                placeholder="Enter organization description"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button 
                type="button"
                variant="outline" 
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit"
              disabled={!newOrgName.trim() || createOrgMutation.isPending}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    <EditOrganizationDialog
      open={isEditDialogOpen}
      onOpenChange={setIsEditDialogOpen}
      organization={editingOrg}
      onSave={handleEditOrganization}
      isSaving={updateOrgMutation.isPending}
      onOrgChange={setEditingOrg}
    />
    
    <DeleteOrganizationDialog
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      organization={deletingOrg}
      onConfirm={handleDeleteOrganization}
      isDeleting={deleteOrgMutation.isPending}
    />
  </>
  )
}

// Edit Organization Dialog (outside of dropdown to avoid nesting issues)
function EditOrganizationDialog({ 
  open, 
  onOpenChange, 
  organization, 
  onSave, 
  isSaving,
  onOrgChange
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  organization: Organization | null;
  onSave: () => void;
  isSaving: boolean;
  onOrgChange: (org: Organization) => void;
}) {
  if (!organization) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave()
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Organization
          </DialogTitle>
          <DialogDescription>
            Update the name and description of this organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="edit-org-name">Organization Name *</Label>
              <Input
                id="edit-org-name"
                name="name"
                value={organization.name}
                onChange={(e) => {
                  onOrgChange({ ...organization, name: e.target.value })
                }}
                placeholder="Enter organization name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-org-desc">Description (Optional)</Label>
              <Input
                id="edit-org-desc"
                name="description"
                value={organization.description || ''}
                onChange={(e) => {
                  onOrgChange({ ...organization, description: e.target.value })
                }}
                placeholder="Enter organization description"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button 
                type="button"
                variant="outline" 
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit"
              disabled={!organization.name.trim() || isSaving}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Organization Dialog
function DeleteOrganizationDialog({ 
  open, 
  onOpenChange, 
  organization, 
  onConfirm, 
  isDeleting 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  organization: Organization | null;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!organization) return null;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{organization.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold">
                {organization.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{organization.name}</p>
                {organization.description && (
                  <p className="text-sm text-gray-600">{organization.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            className="bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}