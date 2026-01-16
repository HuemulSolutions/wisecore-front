import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog";

interface DeleteExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function DeleteExecutionDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing,
}: DeleteExecutionDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Version"
      description="This action cannot be undone. This will permanently delete the execution."
      onConfirm={onConfirm}
      confirmLabel="Delete"
      isProcessing={isProcessing}
      variant="destructive"
    />
  );
}
