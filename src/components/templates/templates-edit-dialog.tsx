import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { HuemulField } from "@/huemul/components/huemul-field";
import { updateTemplate } from "@/services/templates";
import { Edit3 } from "lucide-react";

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  templateDescription?: string;
  organizationId: string;
  onSuccess: () => void;
}

export function EditTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  templateDescription,
  organizationId,
  onSuccess,
}: EditTemplateDialogProps) {
  const { t } = useTranslation('templates');
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (open) {
      setEditName(templateName);
      setEditDescription(templateDescription || "");
    }
  }, [open, templateName, templateDescription]);

  const updateTemplateMutation = useMutation({
    mutationFn: (data: any) => updateTemplate(templateId, data, organizationId),
    meta: { successMessage: t('edit.success') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      onSuccess();
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    updateTemplateMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim() || null
    });
  };

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('edit.title')}
      description={t('edit.description')}
      icon={Edit3}
      saveAction={{
        label: t('edit.submitLabel'),
        onClick: handleSubmit,
        disabled: !editName.trim(),
        loading: updateTemplateMutation.isPending,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-4 py-2">
        <HuemulField
          label={t('form.templateName')}
          type="text"
          value={editName}
          onChange={(v) => setEditName(String(v))}
          placeholder={t('form.templateNamePlaceholder')}
          required
          disabled={updateTemplateMutation.isPending}
        />
        <HuemulField
          label={t('form.description')}
          type="textarea"
          value={editDescription}
          onChange={(v) => setEditDescription(String(v))}
          placeholder={t('form.descriptionPlaceholder')}
          rows={3}
          disabled={updateTemplateMutation.isPending}
        />
      </div>
    </HuemulDialog>
  );
}
