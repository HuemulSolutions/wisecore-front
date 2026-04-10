import React, { useEffect, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { updateDocument, getDocumentById } from '@/services/assets';
import { useOrganization } from '@/contexts/organization-context';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { HuemulField, HuemulFieldGroup, type FetchOptionsParams } from '@/huemul/components/huemul-field';
import { getDocumentTypesWithInfo } from '@/services/role-document-type';
import { toast } from 'sonner';
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

  // Prefill cuando se abre o cambia el doc
  useEffect(() => {
    let cancelled = false;
    async function prefill() {
      if (!open) return;
      setName(currentName);
      setDescription(currentDescription || '');
      
      // Siempre cargar datos del documento para obtener todos los campos
      try {
        const doc = await getDocumentById(documentId, selectedOrganizationId!);
        if (!cancelled) {
          setDescription(doc?.description || '');
          setInternalCode(doc?.internal_code || '');
          setDocumentTypeId(doc?.document_type?.id || '');
          setDocumentTypeName(doc?.document_type?.name || '');
          setDocumentTypeColor(doc?.document_type?.color ?? undefined);
        }
      } catch (e) {
        console.error('Error loading document:', e);
        // Si falla, usar valores proporcionados como fallback
        setDescription(currentDescription || '');
        setDocumentTypeId(currentDocumentTypeId || '');
      }
    }
    prefill();
    return () => { cancelled = true };
  }, [open, currentName, currentDescription, currentDocumentTypeId, documentId, selectedOrganizationId]);

  const mutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string; internal_code?: string; document_type_id?: string }) => {
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
    const response = await getDocumentTypesWithInfo(page, pageSize);
    const filtered = search
      ? response.data.filter((dt) => dt.name.toLowerCase().includes(search.toLowerCase()))
      : response.data;
    return {
      options: filtered.map((dt) => ({ value: dt.id, label: dt.name, color: dt.color ?? undefined })),
      hasMore: response.has_next,
    };
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.error(t('assets:edit.errorNameRequired'));
      return;
    }
    if (!documentTypeId || !documentTypeId.trim()) {
      toast.error(t('assets:edit.errorTypeRequired'));
      return;
    }
    
    const payload: { name: string; description?: string; internal_code?: string; document_type_id: string } = {
      name: name.trim(),
      document_type_id: documentTypeId.trim(),
    };
    
    if (description.trim()) {
      payload.description = description.trim();
    }
    
    if (internalCode.trim()) {
      payload.internal_code = internalCode.trim();
    }
    
    console.log('Updating document with payload:', payload);
    mutation.mutate(payload);
  }, [name, description, internalCode, documentTypeId, mutation]);

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('assets:edit.title')}
      description={t('assets:edit.description')}
      icon={Edit3}
      maxWidth="sm:max-w-xl"
      maxHeight="max-h-[90vh]"
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
          type="async-select"
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
      </HuemulFieldGroup>
    </HuemulDialog>
  );
});

EditDocumentDialog.displayName = 'EditDocumentDialog';

export default EditDocumentDialog;
