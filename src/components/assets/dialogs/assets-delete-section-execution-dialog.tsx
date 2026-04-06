import { useTranslation } from "react-i18next";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";

interface DeleteSectionExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionExecution: {
    name?: string;
  };
  onAction: () => Promise<void>;
}

export function DeleteSectionExecutionDialog({
  open,
  onOpenChange,
  sectionExecution,
  onAction,
}: DeleteSectionExecutionDialogProps) {
  const { t } = useTranslation('sections')
  const { t: tCommon } = useTranslation('common')

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={
        <>
          {t('deleteDialog.description')}
          {sectionExecution.name && (
            <span className="block mt-2 font-medium">
              {t('deleteDialog.sectionLabel', { name: sectionExecution.name })}
            </span>
          )}
        </>
      }
      onAction={onAction}
      actionLabel={tCommon('delete')}
      cancelLabel={tCommon('cancel')}
      actionVariant="destructive"
    />
  );
}
