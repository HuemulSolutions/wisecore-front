"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit2, Trash2, Plus, Search, Package, FileStack, Shield, MoreVertical } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useDocumentTypes, useDocumentTypeMutations } from "@/hooks/useDocumentTypes"
import { type DocumentType } from "@/services/document-types"
import CreateEditDocumentTypeDialog from "@/components/create-edit-document-type-dialog"
import RolePermissionsDialog from "@/components/role-permissions-dialog"
import DocumentTypePermissions from "@/components/document-type-permissions"



// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function AssetTypesPage() {
  const { user: currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<Set<string>>(new Set())
  const [editingDocumentType, setEditingDocumentType] = useState<DocumentType | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [rolePermissionsDocumentType, setRolePermissionsDocumentType] = useState<DocumentType | null>(null)
  const [deletingDocumentType, setDeletingDocumentType] = useState<DocumentType | null>(null)

  // Check if user is admin
  if (!currentUser?.is_root_admin) {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
        </div>
      </div>
    )
  }

  // Use real API calls
  const { data: documentTypesData, isLoading, error } = useDocumentTypes()
  const { deleteDocumentType, bulkDeleteDocumentTypes } = useDocumentTypeMutations()

  const documentTypes = documentTypesData?.data || []

  // Filter document types
  const filteredDocumentTypes = documentTypes.filter((documentType) =>
    documentType.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle document type selection
  const handleDocumentTypeSelection = (documentTypeId: string) => {
    const newSelection = new Set(selectedDocumentTypes)
    if (newSelection.has(documentTypeId)) {
      newSelection.delete(documentTypeId)
    } else {
      newSelection.add(documentTypeId)
    }
    setSelectedDocumentTypes(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedDocumentTypes.size === filteredDocumentTypes.length) {
      setSelectedDocumentTypes(new Set())
    } else {
      setSelectedDocumentTypes(new Set(filteredDocumentTypes.map(documentType => documentType.id)))
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="mb-6">
            <Skeleton className="h-10 w-80" />
          </div>
          <Card className="overflow-hidden border border-border bg-card">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-2">Error loading asset types</div>
          <p className="text-muted-foreground">An error occurred while loading asset types</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <FileStack className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Asset Types</h1>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="hover:cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Asset Type
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search asset types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredDocumentTypes.length} asset types
          </Badge>
        </div>

        {/* Bulk Actions */}
        {selectedDocumentTypes.size > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedDocumentTypes.size} asset type(s) selected
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Asset Types</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedDocumentTypes.size} selected asset type(s)? This action cannot be undone and may affect existing documents.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      bulkDeleteDocumentTypes.mutate(Array.from(selectedDocumentTypes), {
                        onSuccess: () => setSelectedDocumentTypes(new Set())
                      })
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Table */}
        <Card className="border border-border bg-card overflow-auto max-h-[70vh]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-12 px-4 py-4 text-left">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={selectedDocumentTypes.size === filteredDocumentTypes.length && filteredDocumentTypes.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Asset Type Name</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Color</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Asset Count</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Role Permissions</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocumentTypes.map((documentType) => (
                  <tr key={documentType.id} className="border-b border-border hover:bg-muted/20 transition">
                    <td className="w-12 px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={selectedDocumentTypes.has(documentType.id)}
                        onChange={() => handleDocumentTypeSelection(documentType.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">{documentType.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: documentType.color }}
                        />
                        <span className="text-sm text-muted-foreground">{documentType.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="default" className="text-xs">
                        {documentType.document_count || 0} documents
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <DocumentTypePermissions documentTypeId={documentType.id} />
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {formatDate(documentType.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="hover:cursor-pointer h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setRolePermissionsDocumentType(documentType)
                            }, 0)
                          }} className="hover:cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setEditingDocumentType(documentType)
                            }, 0)
                          }} className="hover:cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Asset Type
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setDeletingDocumentType(documentType)
                            }, 0)
                          }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Asset Type
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDocumentTypes.length === 0 && (
            <div className="text-center py-12">
              <FileStack className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No asset types found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search criteria."
                  : "No asset types have been created yet."}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-4 hover:cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Asset Type
                </Button>
              )}
            </div>
          )}

          {/* Footer stats */}
          {filteredDocumentTypes.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 bg-muted/20 text-sm text-muted-foreground">
              <span>
                Showing {filteredDocumentTypes.length} of {documentTypes.length} asset types
              </span>
              <div className="flex items-center gap-4">
                <span>{documentTypes.reduce((acc, type) => acc + (type.document_count || 0), 0)} total documents</span>
              </div>
            </div>
          )}
        </Card>

        {/* Create/Edit Dialog */}
        <CreateEditDocumentTypeDialog
          documentType={editingDocumentType}
          open={!!editingDocumentType || showCreateDialog}
          onOpenChange={(open) => {
            if (!open) {
              setEditingDocumentType(null)
              setShowCreateDialog(false)
            }
          }}
        />

        {/* Role Permissions Dialog */}
        <RolePermissionsDialog
          documentType={rolePermissionsDocumentType}
          open={!!rolePermissionsDocumentType}
          onOpenChange={(open) => {
            if (!open) {
              setRolePermissionsDocumentType(null)
            }
          }}
        />

        {/* Delete Document Type Dialog */}
        <AlertDialog 
          open={!!deletingDocumentType} 
          onOpenChange={(open) => {
            if (!open) {
              setDeletingDocumentType(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Asset Type</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the asset type "{deletingDocumentType?.name}"? This action cannot be undone and may affect existing documents of this type.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingDocumentType) {
                    deleteDocumentType.mutate(deletingDocumentType.id)
                    setDeletingDocumentType(null)
                  }
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}