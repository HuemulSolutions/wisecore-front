"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OrganizationSelectionDialog } from '@/components/organization/organization-selection-dialog'
import { CreateOrganizationDialog } from '@/components/organization/organization-create-dialog'
import { EditOrganizationDialog } from '@/components/organization/organization-edit-dialog'
import { DeleteOrganizationDialog } from '@/components/organization/organization-delete-dialog'

import { Button } from "@/components/ui/button"
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

export function OrganizationSwitcher() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isOrgSelectionOpen, setIsOrgSelectionOpen] = React.useState(false)
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

  const renderButton = () => {
    if (!selectedOrganization) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2 hover:cursor-pointer h-10"
          onClick={() => setIsOrgSelectionOpen(true)}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200 text-gray-500 font-semibold text-xs shrink-0">
            --
          </div>
          <span className="truncate text-sm font-medium text-gray-500">Select Organization</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      )
    }

    return (
      <Button
        variant="outline"
        size="sm"
        className="justify-start gap-2 hover:cursor-pointer h-10"
        onClick={() => setIsOrgSelectionOpen(true)}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold text-xs shrink-0">
          {selectedOrganization.name.substring(0, 2).toUpperCase()}
        </div>
        <span className="truncate text-sm font-medium max-w-37.5">{selectedOrganization.name}</span>
        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <>
      {renderButton()}
      
      <OrganizationSelectionDialog 
        open={isOrgSelectionOpen} 
        onOpenChange={setIsOrgSelectionOpen}
        preselectedOrganizationId={selectedOrganizationId || undefined}
      />
      
      <CreateOrganizationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={(data) => createOrgMutation.mutate(data)}
        isPending={createOrgMutation.isPending}
      />
    
    <EditOrganizationDialog
      open={isEditDialogOpen}
      onOpenChange={setIsEditDialogOpen}
      organization={editingOrg}
      onSave={() => {
        if (editingOrg && editingOrg.name.trim()) {
          updateOrgMutation.mutate({
            id: editingOrg.id,
            name: editingOrg.name.trim(),
            description: editingOrg.description?.trim() || undefined
          })
        }
      }}
      isSaving={updateOrgMutation.isPending}
      onOrgChange={setEditingOrg}
    />
    
    <DeleteOrganizationDialog
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      organization={deletingOrg}
      onConfirm={() => {
        if (deletingOrg) {
          deleteOrgMutation.mutate(deletingOrg.id)
        }
      }}
      isDeleting={deleteOrgMutation.isPending}
    />
  </>
  )
}