import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/dialog';
import { ReusableDialog } from '@/components/ui/reusable-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, CheckCircle, Settings } from 'lucide-react';
import { getUserOrganizations, generateOrganizationToken, addOrganization } from '@/services/organizations';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import ProtectedComponent from '../protected-component';
import type { UserOrganization } from '@/types/users';

interface OrganizationSelectionDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  preselectedOrganizationId?: string;
}

export function OrganizationSelectionDialog({ open, onOpenChange, preselectedOrganizationId }: OrganizationSelectionDialogProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>(preselectedOrganizationId || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  
  const { selectedOrganizationId, setSelectedOrganizationId, setOrganizations, setOrganizationToken, organizationToken, setRequiresOrganizationSelection } = useOrganization();
  const { user } = useAuth();
  const { isLoading: permissionsLoading } = useUserPermissions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: organizationsData, isLoading } = useQuery({
    queryKey: ['user-organizations', user?.id],
    queryFn: () => getUserOrganizations(user!.id),
    enabled: open && !!user?.id, // Solo cargar cuando el dialog esté abierto y tengamos user_id
  });

  const createOrgMutation = useMutation({
    mutationFn: addOrganization,
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] });
      handleSelectOrganization(newOrg.id);
      setNewOrgName('');
      setNewOrgDescription('');
      setShowCreateForm(false);
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: generateOrganizationToken,
    onSuccess: async (tokenResponse, organizationId) => {
      const orgToken = tokenResponse.token || tokenResponse.data?.token;
      
      if (!orgToken) {
        throw new Error('No token received from server');
      }
      
      // Actualizar el contexto con la nueva organización y token
      setSelectedOrganizationId(organizationId);
      setOrganizationToken(orgToken);
      
      console.log('Organization changed and token generated successfully:', orgToken?.substring(0, 10) + '...');
      
      // Esperar un poco para que el contexto se propague completamente
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Invalidar todas las queries que dependen de la organización
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && (
            queryKey.includes('documents') ||
            queryKey.includes('document-types') ||
            queryKey.includes('roles') ||
            queryKey.includes('permissions') ||
            queryKey.includes('assets') ||
            queryKey.includes('asset-types') ||
            queryKey.includes('custom-fields') ||
            queryKey.includes('users') ||
            queryKey.includes('knowledge') ||
            queryKey.includes('library') ||
            queryKey.some(key => typeof key === 'string' && key.includes('org'))
          );
        }
      });
      
      // Cerrar el dialog después de seleccionar la organización
      if (onOpenChange) {
        onOpenChange(false);
      }
      
      // Redirigir al home después de cambiar la organización
      navigate(`/${organizationId}/home`);
    },
  });

  React.useEffect(() => {
    if (organizationsData) {
      setOrganizations(organizationsData);
    }
  }, [organizationsData, setOrganizations]);

  React.useEffect(() => {
    if (preselectedOrganizationId) {
      setSelectedOrgId(preselectedOrganizationId);
    }
  }, [preselectedOrganizationId]);

  // Resetear el select al valor actual cuando se abre el diálogo
  React.useEffect(() => {
    if (open) {
      setSelectedOrgId(preselectedOrganizationId || selectedOrganizationId || '');
      setShowCreateForm(false);
    }
  }, [open, preselectedOrganizationId, selectedOrganizationId]);

  const handleSelectOrganization = (orgId?: string) => {
    const organizationId = orgId || selectedOrgId;
    if (organizationId && user?.id) {
      // Limpiar estado anterior de la organización
      setOrganizationToken('');
      
      // Generar nuevo token usando mutation
      generateTokenMutation.mutate(organizationId);
    }
  };

  const handleCreateOrganization = () => {
    if (newOrgName.trim()) {
      createOrgMutation.mutate({ 
        name: newOrgName.trim(),
        description: newOrgDescription.trim() || undefined
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <ReusableDialog
        open={open}
        onOpenChange={onOpenChange || (() => {})}
        title={!showCreateForm ? "Select Organization" : "Create New Organization"}
        description={!showCreateForm ? "Please select an organization to continue using Wisecore. You can create a new organization if needed." : "Enter the details for your new organization."}
        icon={Building2}
        maxWidth="md"
        maxHeight="90vh"
        footer={
          !showCreateForm ? (
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={() => handleSelectOrganization()}
                disabled={Boolean(!selectedOrgId || isLoading || generateTokenMutation.isPending || (organizationToken && permissionsLoading))}
                className="w-full bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {generateTokenMutation.isPending 
                  ? 'Generating token...' 
                  : (organizationToken && permissionsLoading)
                  ? 'Loading permissions...'
                  : 'Continue with Selected Organization'}
              </Button>
              
              {organizationToken && permissionsLoading && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Setting up your workspace permissions...
                  </p>
                </div>
              )}

              <ProtectedComponent requireRootAdmin>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full hover:cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Organization
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setRequiresOrganizationSelection(false);
                    if (onOpenChange) onOpenChange(false);
                    navigate('/_/global-admin');
                  }}
                  className="w-full hover:cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Global Admin
                </Button>
              </ProtectedComponent>
              
              {onOpenChange && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedOrgId(selectedOrganizationId || '');
                    onOpenChange(false);
                  }}
                  className="w-full hover:cursor-pointer"
                >
                  Cancel
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewOrgName('');
                  setNewOrgDescription('');
                }}
                className="flex-1 hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={!newOrgName.trim() || createOrgMutation.isPending}
                className="flex-1 bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              >
                {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          )
        }
      >
        {!showCreateForm ? (
          <div className="space-y-4">
            <Label htmlFor="org-select" className="text-sm font-medium">
              Available Organizations
            </Label>
            <Select 
              value={selectedOrgId} 
              onValueChange={setSelectedOrgId}
              disabled={isLoading}
            >
              <SelectTrigger id="org-select" className="w-full">
                <SelectValue placeholder={isLoading ? "Loading organizations..." : "Select an organization"} />
              </SelectTrigger>
              <SelectContent>
                {organizationsData?.map((org: UserOrganization) => (
                  <SelectItem 
                    key={org.id} 
                    value={org.id} 
                    className={org.member ? "hover:cursor-pointer" : "opacity-50 cursor-not-allowed"}
                    disabled={!org.member}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-md font-semibold text-xs ${
                        org.member 
                          ? "bg-[#4464f7] text-white" 
                          : "bg-gray-300 text-gray-500"
                      }`}>
                        {org.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={!org.member ? "text-muted-foreground" : ""}>
                        {org.name}
                      </span>
                      {!org.member && (
                        <span className="text-xs text-muted-foreground ml-auto">(Not a member)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-org-name" className="text-sm font-medium">
                Organization Name *
              </Label>
              <Input
                id="new-org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Enter organization name"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateOrganization();
                  }
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-org-desc" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Input
                id="new-org-desc"
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                placeholder="Enter organization description"
                className="w-full"
              />
            </div>
          </div>
        )}
      </ReusableDialog>
    </Dialog>
  );
}