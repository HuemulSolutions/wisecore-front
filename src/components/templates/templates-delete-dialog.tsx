import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { deleteTemplate } from "@/services/templates";
import type { DeleteTemplateDialogProps } from '@/types/templates';
export type { DeleteTemplateDialogProps } from '@/types/templates';

export function DeleteTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  organizationId,
  onSuccess,
}: DeleteTemplateDialogProps) {
  const { t } = useTranslation(['templates', 'common']);
  const queryClient = useQueryClient();

  const deleteTemplateMutation = useMutation({
    mutationFn: () => deleteTemplate(templateId, organizationId),
    meta: { successMessage: t('delete.success') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", organizationId] });
    },
  });

  const handleDelete = async () => {
    await new Promise<void>((resolve, reject) => {
      deleteTemplateMutation.mutate(undefined, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
    onSuccess();
  };

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('delete.title')}
      description={t('delete.description', { name: templateName })}
      actionLabel={t('common:delete')}
      onAction={handleDelete}
    />
  );
}
