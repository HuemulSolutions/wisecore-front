import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulField } from "@/huemul/components/huemul-field";
import { updateTemplate } from "@/services/templates";
import { Edit3 } from "lucide-react";
import { withRefresh } from "@/lib/query-utils";
import type { EditTemplateDialogProps } from '@/types/templates';
export type { EditTemplateDialogProps } from '@/types/templates';

export function EditTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  templateDescription,
  templateInstructions,
  organizationId,
  onSuccess,
}: EditTemplateDialogProps) {
  const { t } = useTranslation('templates');
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editInstructions, setEditInstructions] = useState("");

  useEffect(() => {
    if (open) {
      setEditName(templateName);
      setEditDescription(templateDescription || "");
      setEditInstructions(templateInstructions || "");
    }
  }, [open, templateName, templateDescription, templateInstructions]);

  const updateTemplateMutation = useMutation({
    mutationFn: withRefresh(
      (data: any) => updateTemplate(templateId, data, organizationId),
      queryClient,
      () => [['template', templateId]],
    ),
    meta: { successMessage: t('edit.success') },
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    updateTemplateMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim() || null,
      instructions: editInstructions.trim() || null
    });
  };

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('edit.title')}
      description={t('edit.description')}
      icon={Edit3}
      maxWidth="w-full sm:max-w-2xl lg:max-w-3xl"
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
          rows={8}
          inputClassName="min-h-[16rem]"
          disabled={updateTemplateMutation.isPending}
        />
        <HuemulField
          label={t('form.instructions')}
          type="textarea"
          value={editInstructions}
          onChange={(v) => setEditInstructions(String(v))}
          placeholder={t('form.instructionsPlaceholder')}
          rows={8}
          inputClassName="min-h-[16rem]"
          disabled={updateTemplateMutation.isPending}
        />
      </div>
    </HuemulSheet>
  );
}
