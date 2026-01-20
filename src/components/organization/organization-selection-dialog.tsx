import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Building2, Plus, CheckCircle } from 'lucide-react';
import { getUserOrganizations, generateOrganizationToken, addOrganization } from '@/services/organizations';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import ProtectedComponent from '../protected-component';

interface Organization {
  id: string;
  name: string;
  description?: string | null;
  db_name?: string;
  created_at?: string;
  updated_at?: string;
}

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
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  
  const { setSelectedOrganizationId, setOrganizations, setOrganizationToken, organizationToken } = useOrganization();
  const { user } = useAuth();
  const { isLoading: permissionsLoading } = useUserPermissions();
  const queryClient = useQueryClient();

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

  const handleSelectOrganization = async (orgId?: string) => {
    const organizationId = orgId || selectedOrgId;
    if (organizationId && user?.id) {
      setIsGeneratingToken(true);
      try {
        // Limpiar estado anterior de la organización
        setOrganizationToken('');
        
        // Generar nuevo token para la organización seleccionada PRIMERO
        const tokenResponse = await generateOrganizationToken(organizationId);
        const orgToken = tokenResponse.token || tokenResponse.data?.token;
        
        if (!orgToken) {
          throw new Error('No token received from server');
        }
        
        // Actualizar el contexto con la nueva organización y token
        setSelectedOrganizationId(organizationId);
        setOrganizationToken(orgToken);
        
        console.log('Organization changed and token generated successfully:', orgToken?.substring(0, 10) + '...');
        
        // Esperar un poco más para que el contexto se propague completamente
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // SOLO DESPUÉS invalidar todas las queries que dependen de la organización
        // Ahora que el nuevo token está disponible, las queries se ejecutarán correctamente
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            // Invalidar queries que contengan claves relacionadas con organizaciones
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
        
      } catch (error) {
        console.error('Error changing organization:', error);
        // Mantener el estado anterior si hay error
        // Podrías mostrar un toast de error aquí si tienes configurado
      } finally {
        setIsGeneratingToken(false);
      }
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
        footer={
          !showCreateForm ? (
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={() => handleSelectOrganization()}
                disabled={Boolean(!selectedOrgId || isLoading || isGeneratingToken || (organizationToken && permissionsLoading))}
                className="w-full bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isGeneratingToken 
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
              </ProtectedComponent>
              
              {onOpenChange && (
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
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
                {organizationsData?.map((org: Organization) => (
                  <SelectItem key={org.id} value={org.id} className="hover:cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold text-xs">
                        {org.name.substring(0, 2).toUpperCase()}
                      </div>
                      {org.name}
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