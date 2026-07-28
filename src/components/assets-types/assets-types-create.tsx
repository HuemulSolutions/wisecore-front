import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulField } from "@/huemul/components/huemul-field";
import { createDocumentType, updateDocumentType, getDocumentTypeById } from "@/services/document-types";
import { Plus, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/error-utils";
import type { CreateDocumentTypeProps } from '@/types/assets'
import type { CreateDocumentTypeData } from '@/types/document-types'

export type { CreateDocumentTypeProps } from '@/types/assets'

export default function CreateDocumentType({ 
  trigger, 
  onDocumentTypeCreated, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  documentType,
  type = 'document'
}: CreateDocumentTypeProps) {
  const { t } = useTranslation(['asset-types', 'common'])
  const queryClient = useQueryClient();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isDialogOpen = externalOpen !== undefined ? externalOpen : internalDialogOpen;
  const setIsDialogOpen = externalOnOpenChange || setInternalDialogOpen;
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [requiresIsoStrictVersioning, setRequiresIsoStrictVersioning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedOrganizationId } = useOrganization();

  const isEditing = !!documentType;
  const documentTypeId = documentType?.document_type_id;

  // Fetch document type data when editing
  const { data: documentTypeData, isLoading: isLoadingDocumentType } = useQuery({
    queryKey: ['document-type', documentTypeId],
    queryFn: () => getDocumentTypeById(documentTypeId!),
    enabled: isEditing && !!documentTypeId && isDialogOpen,
  });

  // Update form when document type data is loaded
  useEffect(() => {
    if (documentTypeData?.data) {
      setName(documentTypeData.data.name);
      setSelectedColor(documentTypeData.data.color);
      setRequiresIsoStrictVersioning(documentTypeData.data.requires_iso_strict_versioning ?? true);
    }
  }, [documentTypeData]);

  // Reset form when dialog closes or documentType changes
  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);

  const mutation = useMutation({
    mutationFn: (documentTypeData: CreateDocumentTypeData) => {
      if (isEditing && documentTypeId) {
        return updateDocumentType(documentTypeId, documentTypeData);
      }
      return createDocumentType(documentTypeData);
    },
    onSuccess: (result) => {
      const queryKey = type === 'asset' ? 'asset-types' : 'document-types';
      queryClient.invalidateQueries({ queryKey: [queryKey, 'list-with-roles'] });
      queryClient.invalidateQueries({ queryKey: [queryKey, selectedOrganizationId] });
      // Always invalidate the document-types list so canvas/relationship pages refresh
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      onDocumentTypeCreated?.(result);
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      setError(getErrorMessage(error, t(isEditing ? 'form.errorUpdating' : 'form.errorCreating', { type })));
    },
  });

  const resetForm = () => {
    setName("");
    setSelectedColor("#3B82F6");
    setRequiresIsoStrictVersioning(true);
    setError(null);
  };

  const handleAccept = () => {
    if (!name.trim()) {
      setError(t('form.nameRequired'));
      return;
    }

    setError(null);
    
    mutation.mutate({
      name: name.trim(),
      color: selectedColor,
      requires_iso_strict_versioning: requiresIsoStrictVersioning,
    });
  };

  const dialogTitle = isEditing
    ? t(type === 'asset' ? 'edit.assetTitle' : 'edit.documentTitle')
    : t(type === 'asset' ? 'create.assetTitle' : 'create.documentTitle')
  const dialogDescription = isEditing
    ? t(type === 'asset' ? 'edit.assetDescription' : 'edit.documentDescription')
    : t(type === 'asset' ? 'create.assetDescription' : 'create.documentDescription')

  return (
    <>
      {trigger && (
        <span onClick={() => setIsDialogOpen(true)}>
          {trigger}
        </span>
      )}

      <HuemulSheet
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={dialogTitle}
        description={dialogDescription}
        icon={Plus}
        maxWidth="sm:max-w-lg"
        saveAction={{
          label: isEditing ? t('common:update') : t('common:create'),
          onClick: handleAccept,
          loading: mutation.isPending,
          disabled: !name.trim(),
          closeOnSuccess: false,
        }}
        cancelLabel={t('common:cancel')}
      >
        {isLoadingDocumentType ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <HuemulField
              label={t(type === 'asset' ? 'form.assetNameLabel' : 'form.documentNameLabel')}
              name="name"
              value={name}
              onChange={(v) => setName(String(v))}
              placeholder={t(type === 'asset' ? 'form.assetNameLabel' : 'form.documentNameLabel')}
              error={error === t('form.nameRequired') ? error : undefined}
              required
            />

            <HuemulField
              type="color"
              label={t('form.color')}
              name="color"
              value={selectedColor}
              onChange={(v) => setSelectedColor(String(v))}
            />

            <HuemulField
              type="switch"
              label={t('form.requiresIsoStrictVersioning')}
              description={t('form.requiresIsoStrictVersioningDescription')}
              name="requires_iso_strict_versioning"
              value={requiresIsoStrictVersioning}
              onChange={(v) => setRequiresIsoStrictVersioning(v as boolean)}
            />

            {error && error !== t('form.nameRequired') && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
          </div>
        )}
      </HuemulSheet>
    </>
  );
}