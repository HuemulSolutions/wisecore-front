import React, { useEffect, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { updateDocument, getDocumentById } from '@/services/assets';
import { useOrganization } from '@/contexts/organization-context';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulField, HuemulFieldGroup, type FetchOptionsParams } from '@/huemul/components/huemul-field';
import { getAssetTypes } from '@/services/asset-types';
import { getUsers } from '@/services/users';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Edit3 } from 'lucide-react';
import type { EditDocumentDialogProps } from "@/types/assets";

const EditDocumentDialog: React.FC<EditDocumentDialogProps> = React.memo(({ 
  open, 
  onOpenChange, 
  documentId, 
  currentName, 
  currentDescription, 
  currentDocumentTypeId,
  onUpdated 
}) => {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['assets', 'common']);

  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const [internalCode, setInternalCode] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState(currentDocumentTypeId || '');
  const [documentTypeName, setDocumentTypeName] = useState('');
  const [documentTypeColor, setDocumentTypeColor] = useState<string | undefined>(undefined);
  const [createdBy, setCreatedBy] = useState('');
  const [createdByLabel, setCreatedByLabel] = useState('');
  const [initialCreatedBy, setInitialCreatedBy] = useState('');
  const [contextRequired, setContextRequired] = useState(false);
  // Solo se manda context_required en el payload si el prefill realmente
  // cargó — si getDocumentById falla, no queremos apagar el flag sin que
  // el usuario lo haya pedido.
  const [contextRequiredLoaded, setContextRequiredLoaded] = useState(false);

  // Prefill cuando se abre o cambia el doc
  useEffect(() => {
    let cancelled = false;
    async function prefill() {
      if (!open) return;
      setName(currentName);
      setDescription(currentDescription || '');
      setCreatedBy('');
      setCreatedByLabel('');
      setInitialCreatedBy('');
      setContextRequired(false);
      setContextRequiredLoaded(false);

      // Siempre cargar datos del documento para obtener todos los campos
      try {
        const doc = await getDocumentById(documentId, selectedOrganizationId!);
        if (!cancelled) {
          setDescription(doc?.description || '');
          setInternalCode(doc?.internal_code || '');
          setDocumentTypeId(doc?.document_type?.id || '');
          setDocumentTypeName(doc?.document_type?.name || '');
          setDocumentTypeColor(doc?.document_type?.color ?? undefined);
          setContextRequired(doc?.context_required === true);
          setContextRequiredLoaded(true);

          const creator = doc?.created_by_user;
          if (creator) {
            setCreatedBy(creator.id);
            setInitialCreatedBy(creator.id);
            setCreatedByLabel(`${creator.name} ${creator.last_name} (${creator.email})`);
          }
        }
      } catch (e) {
        logger.error('Error loading document:', e);
        // Si falla, usar valores proporcionados como fallback
        setDescription(currentDescription || '');
        setDocumentTypeId(currentDocumentTypeId || '');
      }
    }
    prefill();
    return () => { cancelled = true };
  }, [open, currentName, currentDescription, currentDocumentTypeId, documentId, selectedOrganizationId]);

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
    if (!name.trim()) {
      toast.error(t('assets:edit.errorNameRequired'));
      return;
    }
    if (!documentTypeId || !documentTypeId.trim()) {
      toast.error(t('assets:edit.errorTypeRequired'));
      return;
    }
    
    const payload: { name: string; description?: string; internal_code?: string; document_type_id: string; created_by?: string; context_required?: boolean } = {
      name: name.trim(),
      document_type_id: documentTypeId.trim(),
    };

    if (description.trim()) {
      payload.description = description.trim();
    }

    if (internalCode.trim()) {
      payload.internal_code = internalCode.trim();
    }

    if (createdBy.trim() && createdBy.trim() !== initialCreatedBy) {
      payload.created_by = createdBy.trim();
    }

    if (contextRequiredLoaded) {
      payload.context_required = contextRequired;
    }

    logger.log('Updating document with payload:', payload);
    mutation.mutate(payload);
  }, [name, description, internalCode, documentTypeId, createdBy, initialCreatedBy, contextRequired, contextRequiredLoaded, mutation]);

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('assets:edit.title')}
      description={t('assets:edit.description')}
      icon={Edit3}
      side="right"
      maxWidth="sm:max-w-xl"
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: t('assets:edit.submitLabel'),
        onClick: handleSave,
        loading: mutation.isPending,
        disabled: !name.trim() || !documentTypeId,
      }}
    >
      <HuemulFieldGroup>
        <HuemulField
          label={t('assets:form.assetName')}
          name="name"
          value={name}
          onChange={(v) => setName(String(v))}
          placeholder={t('assets:form.assetNamePlaceholder')}
          required
          autoFocus
          disabled={mutation.isPending}
        />

        <HuemulField
          label={t('assets:form.internalCode')}
          name="internalCode"
          value={internalCode}
          onChange={(v) => setInternalCode(String(v))}
          placeholder={t('assets:form.internalCodePlaceholder')}
          disabled={mutation.isPending}
        />

        <HuemulField
          type="textarea"
          label={t('assets:form.description')}
          name="description"
          value={description}
          onChange={(v) => setDescription(String(v))}
          placeholder={t('assets:form.descriptionPlaceholder')}
          rows={4}
          disabled={mutation.isPending}
        />

        <HuemulField
          type="async-combobox"
          label={t('assets:form.assetType')}
          name="documentType"
          value={documentTypeId}
          onChange={(v) => setDocumentTypeId(String(v))}
          placeholder={t('assets:form.assetTypePlaceholder')}
          required
          disabled={mutation.isPending}
          fetchOptions={fetchDocumentTypeOptions}
          selectedLabel={documentTypeName}
          selectedColor={documentTypeColor}
          pageSize={100}
        />

        <HuemulField
          type="async-combobox"
          label={t('assets:form.owner')}
          name="createdBy"
          value={createdBy}
          onChange={(v) => setCreatedBy(String(v))}
          placeholder={t('assets:form.ownerPlaceholder')}
          description={t('assets:form.ownerDescription')}
          disabled={mutation.isPending}
          fetchOptions={fetchCreatedByOptions}
          selectedLabel={createdByLabel}
          onSelectedLabelChange={(label) => setCreatedByLabel(label ?? '')}
          pageSize={20}
        />

        <HuemulField
          type="switch"
          label={t('assets:form.contextRequired')}
          name="contextRequired"
          value={contextRequired}
          onChange={(v) => setContextRequired(Boolean(v))}
          description={t('assets:form.contextRequiredDescription')}
          disabled={mutation.isPending}
        />
      </HuemulFieldGroup>
    </HuemulSheet>
  );
});

EditDocumentDialog.displayName = 'EditDocumentDialog';

export default EditDocumentDialog;
