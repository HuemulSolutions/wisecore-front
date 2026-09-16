import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { TemplateFormFields } from "@/components/templates/templates-form-fields";
import { updateTemplate, getTemplateById } from "@/services/templates";
import { Edit3 } from "lucide-react";
import { withRefresh } from "@/lib/query-utils";
import type { EditTemplateDialogProps, TemplateFormValues } from '@/types/templates';
export type { EditTemplateDialogProps } from '@/types/templates';

type UpdateTemplatePayload = Parameters<typeof updateTemplate>[1];

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
  const [values, setValues] = useState<TemplateFormValues>({
    name: "",
    description: "",
    instructions: "",
    contextRequired: false,
  });

  // Prefill inicial desde las props (rápido, pero el sidebar solo pasa datos
  // del listado y puede no traer context_required/instructions completos).
  useEffect(() => {
    if (open) {
      setValues({
        name: templateName,
        description: templateDescription || "",
        instructions: templateInstructions || "",
        contextRequired: false,
      });
    }
  }, [open, templateName, templateDescription, templateInstructions]);

  // Detalle real del template — reusa la key que ya invalidan withRefresh y
  // templates-content.tsx, y es la única fuente confiable de context_required
  // (y de instructions) sin importar desde qué call-site se abrió el dialog
  // (ver "ia context/": editar desde el sidebar del listado no debe apagar
  // en silencio flags que el listado no trae).
  const { data: templateDetail } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => getTemplateById(templateId, organizationId),
    enabled: open && !!templateId && !!organizationId,
  });

  useEffect(() => {
    if (!open || !templateDetail) return;
    setValues({
      name: templateDetail.name ?? templateName,
      description: templateDetail.description || "",
      instructions: templateDetail.instructions || "",
      contextRequired: templateDetail.context_required === true,
    });
  }, [open, templateDetail, templateName]);

  const updateTemplateMutation = useMutation({
    mutationFn: withRefresh(
      (data: UpdateTemplatePayload) => updateTemplate(templateId, data, organizationId),
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
      name: values.name.trim(),
      description: values.description.trim() || null,
      instructions: values.instructions.trim() || null,
      context_required: values.contextRequired,
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
        disabled: !values.name.trim(),
        loading: updateTemplateMutation.isPending,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-5 py-2">
        <TemplateFormFields
          values={values}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
          disabled={updateTemplateMutation.isPending}
        />
      </div>
    </HuemulSheet>
  );
}
