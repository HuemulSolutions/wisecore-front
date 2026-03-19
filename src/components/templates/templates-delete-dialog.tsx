import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { deleteTemplate } from "@/services/templates";
import { toast } from "sonner";

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  organizationId: string;
  onSuccess: () => void;
}

export function DeleteTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  organizationId,
  onSuccess,
}: DeleteTemplateDialogProps) {
  const { t } = useTranslation('templates');
  const queryClient = useQueryClient();

  const deleteTemplateMutation = useMutation({
    mutationFn: () => deleteTemplate(templateId, organizationId),
    onSuccess: () => {
      toast.success(t('delete.success'));
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
      actionLabel={t('delete.actionLabel')}
      onAction={handleDelete}
    />
  );
}
