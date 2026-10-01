import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EditSectionDialog } from '@/components/sections/sections-edit-sheet';
import { useOrganization } from '@/contexts/organization-context';
import { useInvalidateDocumentSectionAccess } from '@/hooks/useDocumentSectionAccess';
import { handleApiError } from '@/lib/error-utils';
import { sectionsConfigQueryOptions } from '@/components/assets/content/components/section-definition-query';
import { updateSection } from '@/services/section';
import type { EditFormItem, EditFormItemForBackend } from '@/types/sections';

interface SectionDefinitionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  /** Versión (execution) seleccionada — misma key de caché que el sheet global de Secciones. */
  executionId?: string;
  /** Id de la definición de la sección (`section_id`), no el de la section_execution. */
  sectionId: string;
  documentName?: string;
}

/**
 * Edita la definición de UNA sección (nombre, tipo, prompt, dependencias, campos de form…) desde
 * su barra de acciones, reutilizando EditSectionDialog — el mismo sheet que usa la lista de
 * "Secciones". La definición completa no tiene GET propio: sale de sections_config del documento.
 */
export function SectionDefinitionSheet({
  open,
  onOpenChange,
  documentId,
  executionId,
  sectionId,
  documentName,
}: SectionDefinitionSheetProps) {
  const { t } = useTranslation(['sections', 'common']);
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();
  const invalidateSectionAccess = useInvalidateDocumentSectionAccess();

  const { data: config, error: loadError } = useQuery({
    ...sectionsConfigQueryOptions(documentId, selectedOrganizationId!, executionId),
    enabled: open && !!documentId && !!selectedOrganizationId,
  });

  // Sin la definición no hay nada que editar: cerrar en vez de dejar el skeleton eterno.
  useEffect(() => {
    if (open && loadError) {
      handleApiError(loadError);
      onOpenChange(false);
    }
  }, [open, loadError, onOpenChange]);

  const sections = useMemo(
    () => [...(config?.sections ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [config?.sections],
  );
  const item = sections.find((s) => s.id === sectionId);
  const templateId = config?.document?.template_id ?? config?.template_id ?? undefined;

  const updateMutation = useMutation({
    mutationFn: (data: EditFormItemForBackend) => {
      // Manual y form viven también en la versión: se propaga a la que se está viendo.
      const propagate = executionId && (data.type === 'manual' || data.type === 'form');
      const payload = propagate ? { ...data, propagate_to_executions: true, execution_id: executionId } : data;
      return updateSection(sectionId, payload, selectedOrganizationId!);
    },
    onSuccess: () => {
      toast.success(t('sections:toast.sectionUpdated'));
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', documentId] });
      invalidateSectionAccess(documentId);
    },
    onError: (error) => handleApiError(error),
  });

  if (!open) return null;

  // El sheet abre al instante con skeleton; el form (que inicializa su estado desde `item` al
  // montar) se monta recién cuando la definición llegó — EditSectionDialog lo oculta con `loading`.
  const placeholder: EditFormItem = { id: sectionId, name: '', prompt: '', order: 0, dependencies: [] };

  return (
    <EditSectionDialog
      open={open}
      onOpenChange={onOpenChange}
      loading={!item}
      item={item ? (item as unknown as EditFormItem) : placeholder}
      onSave={(data) => updateMutation.mutateAsync(data)}
      existingSections={sections as never}
      hasTemplate={!!templateId}
      documentId={documentId}
      templateId={templateId}
      executionId={executionId}
      containerName={documentName}
    />
  );
}
