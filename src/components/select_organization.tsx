import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useOrganization } from '../contexts/organization-context';
import { getAllOrganizations, addOrganization } from '../services/organizations';
import { Building2, Plus } from 'lucide-react';

interface OrganizationSelectorProps {
  onClose?: () => void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ onClose }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const navigate = useNavigate();
  
  const { 
    selectedOrganizationId, 
    organizations, 
    setSelectedOrganizationId, 
    setOrganizations 
  } = useOrganization();

  const queryClient = useQueryClient();

  const { data: organizationsData, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
  });

  const createOrgMutation = useMutation({
    mutationFn: addOrganization,
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setSelectedOrganizationId(newOrg.id);
      setIsDialogOpen(false);
      setNewOrgName('');
    },
  });

  const handleCreateOrganization = () => {
    if (newOrgName.trim()) {
      createOrgMutation.mutate({ name: newOrgName.trim() });
    }
  };

  useEffect(() => {
    if (organizationsData) {
      setOrganizations(organizationsData);
    }
  }, [organizationsData, setOrganizations]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Organization</span>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 w-6 p-0 hover:cursor-pointer"
            >
              <Plus className="h-3 w-3" />
            </Button>
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
                      handleCreateOrganization();
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
      </div>
      <Select
        value={selectedOrganizationId || undefined}
        onValueChange={(value) => {
          setSelectedOrganizationId(value);
          navigate('/');
          onClose?.();
        }}
      >
        <SelectTrigger className="w-full hover:cursor-pointer">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem 
              key={org.id} 
              value={org.id}
              className="hover:cursor-pointer"
            >
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};