import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { getAllOrganizations, addOrganization } from '@/services/organizations';
import { useOrganization } from '@/contexts/organization-context';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationSelectionDialogProps {
  open: boolean;
}

export function OrganizationSelectionDialog({ open }: OrganizationSelectionDialogProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  
  const { setSelectedOrganizationId, setOrganizations } = useOrganization();
  const queryClient = useQueryClient();

  const { data: organizationsData, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
    enabled: open, // Solo cargar cuando el dialog esté abierto
  });

  const createOrgMutation = useMutation({
    mutationFn: addOrganization,
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setSelectedOrganizationId(newOrg.id);
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

  const handleSelectOrganization = () => {
    if (selectedOrgId) {
      setSelectedOrganizationId(selectedOrgId);
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
    <Dialog open={open} modal>
      <DialogContent 
        className="sm:max-w-[500px]"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-primary" />
            Select Organization
          </DialogTitle>
          <DialogDescription>
            Please select an organization to continue using Wisecore. You can create a new organization if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showCreateForm ? (
            <>
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

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSelectOrganization}
                  disabled={!selectedOrgId || isLoading}
                  className="w-full bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Continue with Selected Organization
                </Button>

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
              </div>
            </>
          ) : (
            <>
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

              <div className="flex gap-3">
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}