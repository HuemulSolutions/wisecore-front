import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { TemplateFormFields } from "@/components/templates/templates-form-fields";
import { updateTemplate, getTemplateById } from "@/services/templates";
import { Pencil } from "lucide-react";
import { withRefresh } from "@/lib/query-utils";
import { handleApiError } from "@/lib/error-utils";
import type { EditTemplateDialogProps, TemplateFormValues } from '@/types/templates';
export type { EditTemplateDialogProps } from '@/types/templates';

type UpdateTemplatePayload = Parameters<typeof updateTemplate>[1];

export function EditTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  organizationId,
  onSuccess,
}: EditTemplateDialogProps) {
  const { t } = useTranslation('templates');
  const queryClient = useQueryClient();
  const [values, setValues] = useState<TemplateFormValues | null>(null);

  // Detalle real del template — reusa la key que ya invalidan withRefresh y
  // templates-content.tsx, y es la única fuente confiable de context_required
  // (y de instructions) sin importar desde qué call-site se abrió el dialog
  // (ver "ia context/": editar desde el sidebar del listado no debe apagar
  // en silencio flags que el listado no trae).
  const { data: templateDetail, isLoading: isLoadingDetail, error: loadError } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => getTemplateById(templateId, organizationId),
    enabled: open && !!templateId && !!organizationId,
  });

  // El formulario se inicializa una sola vez por apertura, con el detalle real:
  // un refetch en segundo plano no debe pisar lo que el usuario ya editó, y
  // nunca se muestra/guarda un estado parcial (ej. `context_required: false`).
  useEffect(() => {
    if (!open) {
      setValues(null);
      return;
    }
    if (!templateDetail) return;
    setValues((prev) => prev ?? {
      name: templateDetail.name ?? templateName,
      description: templateDetail.description || "",
      instructions: templateDetail.instructions || "",
      contextRequired: templateDetail.context_required === true,
    });
  }, [open, templateDetail, templateName]);

  // Error de carga: avisar y cerrar, nunca dejar el skeleton para siempre.
  useEffect(() => {
    if (open && loadError) {
      handleApiError(loadError);
      onOpenChange(false);
    }
  }, [open, loadError, onOpenChange]);

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
    if (!values) return;
    updateTemplateMutation.mutate({
      name: values.name.trim(),
      description: values.description.trim() || null,
      instructions: values.instructions.trim() || null,
      context_required: values.contextRequired,
    });
  };

  const loading = isLoadingDetail || !values;

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('edit.title')}
      description={t('edit.description')}
      icon={Pencil}
      bodyLoading={loading}
      maxWidth="w-full sm:max-w-2xl lg:max-w-3xl"
      saveAction={{
        label: t('edit.submitLabel'),
        onClick: handleSubmit,
        disabled: !values?.name.trim(),
        loading: updateTemplateMutation.isPending,
        closeOnSuccess: false,
      }}
    >
      {values && (
        <div className="space-y-5 py-2">
          <TemplateFormFields
            values={values}
            onChange={(patch) => setValues((v) => (v ? { ...v, ...patch } : v))}
            disabled={updateTemplateMutation.isPending}
          />
        </div>
      )}
    </HuemulSheet>
  );
}
