import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import type { DeleteExecutionDialogProps } from "@/types/execution";

export type { DeleteExecutionDialogProps } from "@/types/execution";

export function DeleteExecutionDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteExecutionDialogProps) {
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Version"
      description="This action cannot be undone. This will permanently delete the execution."
      onAction={async () => { onConfirm(); }}
      actionLabel="Delete"
      actionVariant="destructive"
    />
  );
}
