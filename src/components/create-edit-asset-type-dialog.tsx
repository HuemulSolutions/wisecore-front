import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { useRoles } from "@/hooks/useRbac"
import { type AssetType } from "@/services/asset-types"

// Access levels for asset types
export const ACCESS_LEVELS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  RESTRICTED: 'restricted',
  CONFIDENTIAL: 'confidential'
} as const

type AccessLevel = typeof ACCESS_LEVELS[keyof typeof ACCESS_LEVELS]

// Asset permissions
export const ASSET_PERMISSIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve'
} as const

type AssetPermission = typeof ASSET_PERMISSIONS[keyof typeof ASSET_PERMISSIONS]

interface CreateEditAssetTypeDialogProps {
  assetType: AssetType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateEditAssetTypeDialog({ assetType, open, onOpenChange }: CreateEditAssetTypeDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [searchRole, setSearchRole] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultAccessLevel: 'private' as AccessLevel,
  })
  
  const [rolePermissions, setRolePermissions] = useState<Map<string, Set<AssetPermission>>>(new Map())
  
  const { createAssetType, updateAssetType } = useAssetTypeMutations()
  const { data: rolesData } = useRoles()
  
  const roles = rolesData?.data || []

  // Reset form when assetType changes or dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      setSearchRole('')
      setRolePermissions(new Map())
      
      if (assetType) {
        setFormData({
          name: assetType.name,
          description: assetType.description,
          defaultAccessLevel: 'private' as AccessLevel,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          defaultAccessLevel: 'private' as AccessLevel,
        })
      }
    }
  }, [assetType, open])

  const handleSubmit = () => {
    // Convert rolePermissions to a serializable format
    const rolePermissionsArray = Array.from(rolePermissions.entries()).map(([roleId, permissions]) => ({
      roleId,
      permissions: Array.from(permissions)
    }))
    
    const submissionData = {
      name: formData.name,
      description: formData.description,
      defaultAccessLevel: formData.defaultAccessLevel,
      rolePermissions: rolePermissionsArray
    }
    
    console.log('Asset Type Data:', submissionData)
    
    if (assetType) {
      // Update existing asset type (for now just using basic data)
      updateAssetType.mutate({ 
        id: assetType.id, 
        data: {
          name: formData.name,
          description: formData.description,
        }
      }, {
        onSuccess: () => onOpenChange(false)
      })
    } else {
      // Create new asset type (for now just using basic data)
      createAssetType.mutate({
        name: formData.name,
        description: formData.description,
      }, {
        onSuccess: () => onOpenChange(false)
      })
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | AccessLevel) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const toggleRolePermission = (roleId: string, permission: AssetPermission) => {
    setRolePermissions(prev => {
      const newMap = new Map(prev)
      const currentPermissions = newMap.get(roleId) || new Set()
      
      if (currentPermissions.has(permission)) {
        currentPermissions.delete(permission)
      } else {
        currentPermissions.add(permission)
      }
      
      if (currentPermissions.size === 0) {
        newMap.delete(roleId)
      } else {
        newMap.set(roleId, currentPermissions)
      }
      
      return newMap
    })
  }
  
  const isRolePermissionChecked = (roleId: string, permission: AssetPermission): boolean => {
    return rolePermissions.get(roleId)?.has(permission) || false
  }
  
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchRole.toLowerCase())
  )
  
  const goToNextStep = () => {
    if (currentStep === 1 && formData.name.trim()) {
      setCurrentStep(2)
    }
  }
  
  const goToPreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const isLoading = createAssetType.isPending || updateAssetType.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={currentStep === 2 ? "sm:max-w-4xl max-h-[90vh] overflow-hidden" : "sm:max-w-[600px]"}>
        <DialogHeader>
          <DialogTitle>
            {assetType ? 'Edit Asset Type' : 'Create New Asset Type'} - Step {currentStep} of 2
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 
              ? (assetType ? 'Update the asset type information.' : 'Enter the basic information for the new asset type.')
              : 'Configure role-based permissions for this asset type.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {currentStep === 1 ? (
          // Step 1: Basic Information
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Type Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter asset type name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter asset type description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultAccessLevel">Default Access Level</Label>
              <Select
                value={formData.defaultAccessLevel}
                onValueChange={(value) => handleInputChange('defaultAccessLevel', value as AccessLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={goToNextStep}
                disabled={!formData.name.trim()}
                className="hover:cursor-pointer"
              >
                Next
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Step 2: Role Permissions
          <div className="flex flex-col space-y-4 h-full">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">View</TableHead>
                    <TableHead className="text-center">Create</TableHead>
                    <TableHead className="text-center">Edit</TableHead>
                    <TableHead className="text-center">Delete</TableHead>
                    <TableHead className="text-center">Approve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{role.name}</div>
                            {role.description && (
                              <div className="text-sm text-muted-foreground">{role.description}</div>
                            )}
                          </div>
                        </TableCell>
                        {Object.values(ASSET_PERMISSIONS).map((permission) => (
                          <TableCell key={permission} className="text-center">
                            <Checkbox
                              checked={isRolePermissionChecked(role.id, permission)}
                              onCheckedChange={() => toggleRolePermission(role.id, permission)}
                              className="hover:cursor-pointer"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={isLoading}
              >
                Previous
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="hover:cursor-pointer"
              >
                {isLoading ? 'Creating...' : assetType ? 'Update Asset Type' : 'Create Asset Type'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}