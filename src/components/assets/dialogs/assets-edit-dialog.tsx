import React, { useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { updateDocument, getDocumentById } from '@/services/assets';
import { useOrganization } from '@/contexts/organization-context';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulField, HuemulFieldGroup, type FetchOptionsParams } from '@/huemul/components/huemul-field';
import { getAssetTypes } from '@/services/asset-types';
import { getUsers } from '@/services/users';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/error-utils';
import { Pencil } from 'lucide-react';
import type { EditDocumentDialogProps } from "@/types/assets";

interface EditDocumentFormState {
  /** Documento al que pertenece el estado: evita mostrar datos del documento anterior. */
  documentId: string;
  name: string;
  description: string;
  internalCode: string;
  documentTypeId: string;
  documentTypeName: string;
  documentTypeColor?: string;
  createdBy: string;
  createdByLabel: string;
  initialCreatedBy: string;
  contextRequired: boolean;
}

const EditDocumentDialog: React.FC<EditDocumentDialogProps> = React.memo(({
  open,
  onOpenChange,
  documentId,
  currentName,
  onUpdated
}) => {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['assets', 'common']);

  // El formulario nace null y se inicializa una sola vez por apertura con el
  // detalle real del documento: nunca se muestra ni se guarda un estado
  // parcial (ej. `context_required: false` o el tipo del documento anterior).
  const [formState, setForm] = useState<EditDocumentFormState | null>(null);
  const form = formState?.documentId === documentId ? formState : null;

  // Key propia (prefijo ['document', id]) para que las invalidaciones de
  // `['document', documentId]` también la refresquen sin compartir forma de dato.
  const { data: doc, isLoading, error: loadError } = useQuery({
    queryKey: ['document', documentId, 'edit'],
    queryFn: () => getDocumentById(documentId, selectedOrganizationId!),
    enabled: open && !!documentId && !!selectedOrganizationId,
  });

  useEffect(() => {
    if (!open) {
      setForm(null);
      return;
    }
    if (!doc) return;
    setForm((prev) => {
      if (prev && prev.documentId === documentId) return prev;
      const creator = doc.created_by_user;
      return {
        documentId,
        name: doc.name ?? currentName,
        description: doc.description || '',
        internalCode: doc.internal_code || '',
        documentTypeId: doc.document_type?.id || '',
        documentTypeName: doc.document_type?.name || '',
        documentTypeColor: doc.document_type?.color ?? undefined,
        createdBy: creator?.id ?? '',
        createdByLabel: creator ? `${creator.name} ${creator.last_name} (${creator.email})` : '',
        initialCreatedBy: creator?.id ?? '',
        contextRequired: doc.context_required === true,
      };
    });
  }, [open, doc, documentId, currentName]);

  // Error de carga: avisar y cerrar, nunca dejar el skeleton para siempre.
  useEffect(() => {
    if (open && loadError) {
      handleApiError(loadError);
      onOpenChange(false);
    }
  }, [open, loadError, onOpenChange]);

  const patchForm = useCallback((patch: Partial<EditDocumentFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string; internal_code?: string; document_type_id?: string; created_by?: string; context_required?: boolean }) => {
      if (!selectedOrganizationId) throw new Error('Organization not selected');
      return updateDocument(documentId, payload, selectedOrganizationId);
    },
    meta: { successMessage: t('assets:edit.success') },
    onSuccess: (data) => {
      // Refresh file tree/library to show updated asset info
      queryClient.invalidateQueries({ queryKey: ['library', selectedOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      // Refresh document content and details
      queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      onUpdated(data.name, data.description);
      onOpenChange(false);
    },
  });

  const fetchDocumentTypeOptions = useCallback(async ({ search, page, pageSize }: FetchOptionsParams) => {
    const response = await getAssetTypes(page, pageSize, search);
    return {
      options: response.data.map((dt) => ({ value: dt.id, label: dt.name, color: dt.color ?? undefined })),
      hasMore: response.has_next ?? false,
    };
  }, []);

  const fetchCreatedByOptions = useCallback(async ({ search, page, pageSize }: FetchOptionsParams) => {
    const response = await getUsers(selectedOrganizationId ?? undefined, page, pageSize, search);
    return {
      options: (response.data ?? []).map((u) => ({
        value: u.id,
        label: `${u.name} ${u.last_name} (${u.email})`,
      })),
      hasMore: response.has_next ?? false,
    };
  }, [selectedOrganizationId]);

  const handleSave = useCallback(() => {
    if (!form) return;
    if (!form.name.trim()) {
      toast.error(t('assets:edit.errorNameRequired'));
      return;
    }
    if (!form.documentTypeId || !form.documentTypeId.trim()) {
      toast.error(t('assets:edit.errorTypeRequired'));
      return;
    }

    const payload: { name: string; description?: string; internal_code?: string; document_type_id: string; created_by?: string; context_required: boolean } = {
      name: form.name.trim(),
      document_type_id: form.documentTypeId.trim(),
      context_required: form.contextRequired,
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }

    if (form.internalCode.trim()) {
      payload.internal_code = form.internalCode.trim();
    }

    if (form.createdBy.trim() && form.createdBy.trim() !== form.initialCreatedBy) {
      payload.created_by = form.createdBy.trim();
    }

    logger.log('Updating document with payload:', payload);
    mutation.mutate(payload);
  }, [form, mutation, t]);

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('assets:edit.title')}
      description={t('assets:edit.description')}
      icon={Pencil}
      side="right"
      maxWidth="sm:max-w-xl"
      cancelLabel={t('common:cancel')}
      bodyLoading={isLoading || !form}
      saveAction={{
        label: t('assets:edit.submitLabel'),
        onClick: handleSave,
        loading: mutation.isPending,
        disabled: !form || !form.name.trim() || !form.documentTypeId,
      }}
    >
      {form && (
        <HuemulFieldGroup>
          <HuemulField
            label={t('assets:form.assetName')}
            name="name"
            value={form.name}
            onChange={(v) => patchForm({ name: String(v) })}
            placeholder={t('assets:form.assetNamePlaceholder')}
            required
            autoFocus
            disabled={mutation.isPending}
          />

          <HuemulField
            label={t('assets:form.internalCode')}
            name="internalCode"
            value={form.internalCode}
            onChange={(v) => patchForm({ internalCode: String(v) })}
            placeholder={t('assets:form.internalCodePlaceholder')}
            disabled={mutation.isPending}
          />

          <HuemulField
            type="textarea"
            label={t('assets:form.description')}
            name="description"
            value={form.description}
            onChange={(v) => patchForm({ description: String(v) })}
            placeholder={t('assets:form.descriptionPlaceholder')}
            rows={4}
            disabled={mutation.isPending}
          />

          <HuemulField
            type="async-combobox"
            label={t('assets:form.assetType')}
            name="documentType"
            value={form.documentTypeId}
            onChange={(v) => patchForm({ documentTypeId: String(v) })}
            placeholder={t('assets:form.assetTypePlaceholder')}
            required
            disabled={mutation.isPending}
            fetchOptions={fetchDocumentTypeOptions}
            selectedLabel={form.documentTypeName}
            selectedColor={form.documentTypeColor}
            pageSize={100}
          />

          <HuemulField
            type="async-combobox"
            label={t('assets:form.owner')}
            name="createdBy"
            value={form.createdBy}
            onChange={(v) => patchForm({ createdBy: String(v) })}
            placeholder={t('assets:form.ownerPlaceholder')}
            description={t('assets:form.ownerDescription')}
            disabled={mutation.isPending}
            fetchOptions={fetchCreatedByOptions}
            selectedLabel={form.createdByLabel}
            onSelectedLabelChange={(label) => patchForm({ createdByLabel: label ?? '' })}
            pageSize={20}
          />

          <HuemulField
            type="switch"
            label={t('assets:form.contextRequired')}
            name="contextRequired"
            value={form.contextRequired}
            onChange={(v) => patchForm({ contextRequired: Boolean(v) })}
            description={t('assets:form.contextRequiredDescription')}
            disabled={mutation.isPending}
          />
        </HuemulFieldGroup>
      )}
    </HuemulSheet>
  );
});

EditDocumentDialog.displayName = 'EditDocumentDialog';

export default EditDocumentDialog;
