import { Pencil } from 'lucide-react';
import { ReusableDialog } from '@/components/ui/reusable-dialog';
import NameDescriptionFields from '@/components/assets/content/name-description-fields';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Organization {
  id: string;
  name: string;
  description?: string | null;
  db_name?: string;
  created_at?: string;
  updated_at?: string;
  max_users?: number | null;
  token_limit?: number | null;
}

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSave: () => void;
  isSaving: boolean;
  onOrgChange: (org: Organization) => void;
  isRootAdmin?: boolean;
}

export function EditOrganizationDialog({
  open,
  onOpenChange,
  organization,
  onSave,
  isSaving,
  onOrgChange,
  isRootAdmin = false
}: EditOrganizationDialogProps) {
  if (!organization) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  const isValid = organization.name.trim().length > 0;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Organization"
      description="Update the name and description of this organization."
      icon={Pencil}
      maxWidth="md"
      formId="edit-organization-form"
      isValid={isValid}
      isSubmitting={isSaving}
      submitLabel="Save Changes"
      maxHeight="90vh"
      showDefaultFooter={true}
    >
      <form id="edit-organization-form" onSubmit={handleSubmit} className="grid gap-6">
        <NameDescriptionFields
          name={organization.name}
          description={organization.description || ''}
          onNameChange={(name) => onOrgChange({ ...organization, name })}
          onDescriptionChange={(description) => onOrgChange({ ...organization, description })}
          nameLabel="Organization Name *"
          descriptionLabel="Description (Optional)"
          namePlaceholder="Enter organization name"
          descriptionPlaceholder="Enter organization description"
          disabled={isSaving}
          nameRequired={true}
          descriptionRequired={false}
        />

        {isRootAdmin && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="max_users">Max Users (Optional)</Label>
              <Input
                id="max_users"
                name="max_users"
                type="number"
                min="1"
                value={organization.max_users ?? ''}
                onChange={(e) => onOrgChange({ 
                  ...organization, 
                  max_users: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Leave empty for unlimited"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of users allowed in this organization
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="token_limit">Token Limit (Optional)</Label>
              <Input
                id="token_limit"
                name="token_limit"
                type="number"
                min="1"
                value={organization.token_limit ?? ''}
                onChange={(e) => onOrgChange({ 
                  ...organization, 
                  token_limit: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Leave empty for unlimited"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens allowed for this organization
              </p>
            </div>
          </>
        )}
      </form>
    </ReusableDialog>
  );
}
