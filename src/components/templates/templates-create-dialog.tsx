import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { TemplateFormFields } from "@/components/templates/templates-form-fields";
import { addTemplate } from "@/services/templates";
import { AlertCircle, FileCode } from "lucide-react";
import { getErrorMessage } from "@/lib/error-utils";
import { logger } from "@/lib/logger";
import type { CreateTemplateDialogProps, TemplateFormValues } from '@/types/templates';
export type { CreateTemplateDialogProps } from '@/types/templates';

const EMPTY_VALUES: TemplateFormValues = {
  name: "",
  description: "",
  instructions: "",
  contextRequired: false,
};

export function CreateTemplateDialog({
  open,
  onOpenChange,
  organizationId,
  onTemplateCreated,
}: CreateTemplateDialogProps) {
  const { t } = useTranslation('templates');
  const queryClient = useQueryClient();
  const [values, setValues] = useState<TemplateFormValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    logger.log('🔔 [CREATE-TEMPLATE-DIALOG] Open state changed:', open);
    if (open) {
      setValues(EMPTY_VALUES);
      setError(null);
    }
  }, [open]);

  const createTemplateMutation = useMutation({
    mutationFn: (newData: { name: string; description: string; instructions: string; organization_id: string; context_required: boolean }) => {
      logger.log('🚀 [CREATE-TEMPLATE-DIALOG] Starting template creation:', newData.name);
      return addTemplate(newData);
    },
    meta: { successMessage: t('create.success') },
    onSuccess: (created) => {
      logger.log('✅ [CREATE-TEMPLATE-DIALOG] Template created successfully:', created);
      queryClient.invalidateQueries({ queryKey: ["templates", organizationId] });

      // Store the callback to execute after dialog closes
      const executeCallback = () => {
        logger.log('📞 [CREATE-TEMPLATE-DIALOG] Calling onTemplateCreated callback');
        onTemplateCreated({ id: created.id, name: created.name, description: created.description });
      };

      // Close dialog first
      logger.log('🚪 [CREATE-TEMPLATE-DIALOG] Closing dialog');
      onOpenChange(false);

      // Wait for dialog to fully close before executing callback
      setTimeout(executeCallback, 300);
    },
    onError: (error) => {
      logger.error("Create template error:", error);
      setError(getErrorMessage(error, t('create.errorFailed')));
    },
  });

  const handleCreate = () => {
    if (!values.name.trim()) {
      setError(t('create.errorNameRequired'));
      return;
    }
    if (!organizationId) {
      setError(t('create.errorOrganizationRequired'));
      return;
    }
    setError(null);
    createTemplateMutation.mutate({
      name: values.name,
      description: values.description,
      instructions: values.instructions,
      organization_id: organizationId,
      context_required: values.contextRequired,
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
        disabled: !values.name.trim() || !organizationId,
        loading: createTemplateMutation.isPending,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-5 py-2">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        <TemplateFormFields
          values={values}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
          disabled={createTemplateMutation.isPending}
        />
      </div>
    </HuemulSheet>
  );
}
