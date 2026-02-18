import { ReusableAlertDialog } from '@/components/ui/reusable-alert-dialog';

interface Organization {
  id: string;
  name: string;
  description?: string | null;
  db_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organization,
  onConfirm,
  isDeleting
}: DeleteOrganizationDialogProps) {
  if (!organization) return null;

  const description = (
    <div className="space-y-4">
      <p>Are you sure you want to delete "{organization.name}"? This action cannot be undone.</p>
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold">
            {organization.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{organization.name}</p>
            {organization.description && (
              <p className="text-sm text-gray-600">{organization.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Organization"
      description={description}
      onConfirm={onConfirm}
      confirmLabel="Delete"
      isProcessing={isDeleting}
      variant="destructive"
    />
  );
}
