import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog";

interface DeleteSectionExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionExecution: {
    name?: string;
  };
  onConfirm: () => void;
  isProcessing: boolean;
}

export function DeleteSectionExecutionDialog({
  open,
  onOpenChange,
  sectionExecution,
  onConfirm,
  isProcessing,
}: DeleteSectionExecutionDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Section"
      description={
        <>
          Are you sure you want to delete this section? This action cannot be undone.
          {sectionExecution.name && (
            <span className="block mt-2 font-medium">
              Section: {sectionExecution.name}
            </span>
          )}
        </>
      }
      onConfirm={onConfirm}
      confirmLabel="Delete"
      isProcessing={isProcessing}
      variant="destructive"
    />
  );
}
