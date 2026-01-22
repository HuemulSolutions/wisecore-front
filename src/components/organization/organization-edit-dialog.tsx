import { Pencil } from 'lucide-react';
import { ReusableDialog } from '@/components/ui/reusable-dialog';
import NameDescriptionFields from '@/components/assets/content/name-description-fields';

interface Organization {
  id: string;
  name: string;
  description?: string | null;
  db_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSave: () => void;
  isSaving: boolean;
  onOrgChange: (org: Organization) => void;
}

export function EditOrganizationDialog({
  open,
  onOpenChange,
  organization,
  onSave,
  isSaving,
  onOrgChange
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
      </form>
    </ReusableDialog>
  );
}
