import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulField } from "@/huemul/components/huemul-field";
import { addTemplate } from "@/services/templates";
import { AlertCircle, FileCode } from "lucide-react";
import { getErrorMessage } from "@/lib/error-utils";
import type { CreateTemplateDialogProps } from '@/types/templates';
export type { CreateTemplateDialogProps } from '@/types/templates';

export function CreateTemplateDialog({
  open,
  onOpenChange,
  organizationId,
  onTemplateCreated,
}: CreateTemplateDialogProps) {
  const { t } = useTranslation('templates');
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    console.log('🔔 [CREATE-TEMPLATE-DIALOG] Open state changed:', open);
    if (open) {
      setNewName("");
      setNewDescription("");
      setNewInstructions("");
      setError(null);
    }
  }, [open]);

  const createTemplateMutation = useMutation({
    mutationFn: (newData: { name: string; description: string; instructions: string; organization_id: string }) => {
      console.log('🚀 [CREATE-TEMPLATE-DIALOG] Starting template creation:', newData.name);
      return addTemplate(newData);
    },
    meta: { successMessage: t('create.success') },
    onSuccess: (created) => {
      console.log('✅ [CREATE-TEMPLATE-DIALOG] Template created successfully:', created);
      queryClient.invalidateQueries({ queryKey: ["templates", organizationId] });
      
      // Store the callback to execute after dialog closes
      const executeCallback = () => {
        console.log('📞 [CREATE-TEMPLATE-DIALOG] Calling onTemplateCreated callback');
        onTemplateCreated({ id: created.id, name: created.name, description: created.description });
      };
      
      // Close dialog first
      console.log('🚪 [CREATE-TEMPLATE-DIALOG] Closing dialog');
      onOpenChange(false);
      
      // Wait for dialog to fully close before executing callback
      setTimeout(executeCallback, 300);
    },
    onError: (error) => {
      console.error("Create template error:", error);
      setError(getErrorMessage(error, t('create.errorFailed')));
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) {
      setError(t('create.errorNameRequired'));
      return;
    }
    if (!organizationId) {
      setError(t('create.errorOrganizationRequired'));
      return;
    }
    setError(null);
    createTemplateMutation.mutate({
      name: newName,
      description: newDescription,
      instructions: newInstructions,
      organization_id: organizationId,
    });
  };

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('create.title')}
      description={t('create.description')}
      icon={FileCode}
      maxWidth="w-full sm:max-w-2xl lg:max-w-3xl"
      cancelLabel={t('create.cancelLabel', { defaultValue: 'Cancel' })}
      saveAction={{
        label: t('create.submitLabel'),
        onClick: handleCreate,
        disabled: !newName.trim() || !organizationId,
        loading: createTemplateMutation.isPending,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-4 py-2">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        <HuemulField
          label={t('form.templateName')}
          type="text"
          value={newName}
          onChange={(v) => setNewName(String(v))}
          placeholder={t('form.templateNamePlaceholder')}
          required
          disabled={createTemplateMutation.isPending}
        />
        <HuemulField
          label={t('form.description')}
          type="textarea"
          value={newDescription}
          onChange={(v) => setNewDescription(String(v))}
          placeholder={t('form.descriptionPlaceholder')}
          rows={8}
          inputClassName="min-h-[16rem]"
          disabled={createTemplateMutation.isPending}
        />
        <HuemulField
          label={t('form.instructions')}
          type="textarea"
          value={newInstructions}
          onChange={(v) => setNewInstructions(String(v))}
          placeholder={t('form.instructionsPlaceholder')}
          rows={8}
          inputClassName="min-h-[16rem]"
          disabled={createTemplateMutation.isPending}
        />
      </div>
    </HuemulSheet>
  );
}
