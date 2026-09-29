import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EditSectionDialog } from '@/components/sections/sections-edit-sheet';
import { useOrganization } from '@/contexts/organization-context';
import { useInvalidateDocumentSectionAccess } from '@/hooks/useDocumentSectionAccess';
import { handleApiError } from '@/lib/error-utils';
import { getDocumentSectionsConfig } from '@/services/assets';
import { updateSection } from '@/services/section';
import type { SectionsConfigResponse } from '@/types/assets';
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

  const { data: config } = useQuery<SectionsConfigResponse>({
    queryKey: ['document-sections-config', documentId, executionId ?? null],
    queryFn: () => getDocumentSectionsConfig(documentId, selectedOrganizationId!, executionId),
    enabled: open && !!documentId && !!selectedOrganizationId,
    staleTime: 30000,
  });

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

  // El form inicializa su estado desde `item` al montar: se monta recién con la definición cargada.
  if (!open || !item) return null;

  return (
    <EditSectionDialog
      open={open}
      onOpenChange={onOpenChange}
      item={item as unknown as EditFormItem}
      onSave={(data) => updateMutation.mutate(data)}
      existingSections={sections as never}
      hasTemplate={!!templateId}
      documentId={documentId}
      templateId={templateId}
      executionId={executionId}
      containerName={documentName}
    />
  );
}
