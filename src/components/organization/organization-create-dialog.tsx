import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ReusableDialog } from '@/components/ui/reusable-dialog';
import NameDescriptionFields from '../assets/content/name-description-fields';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  isPending: boolean;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        description: description.trim() || undefined
      });
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Organization"
      description="Create a new organization to manage documents and users."
      icon={Plus}
      maxWidth="md"
      formId="create-organization-form"
      isValid={isValid}
      isSubmitting={isPending}
      submitLabel="Create Organization"
    >
      <form id="create-organization-form" onSubmit={handleSubmit} className="grid gap-6">
        <NameDescriptionFields
          name={name}
          description={description}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          nameLabel="Organization Name *"
          descriptionLabel="Description (Optional)"
          namePlaceholder="Enter organization name"
          descriptionPlaceholder="Enter organization description"
          disabled={isPending}
          nameRequired={true}
          descriptionRequired={false}
        />
      </form>
    </ReusableDialog>
  );
}
