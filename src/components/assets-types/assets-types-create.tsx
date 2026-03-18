import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { HuemulField } from "@/huemul/components/huemul-field";
import { createDocumentType, updateDocumentType, getDocumentTypeById } from "@/services/document-types";
import { Plus, Loader2 } from "lucide-react";
import { type AssetTypeWithRoles } from "@/services/asset-types";

interface CreateDocumentTypeProps {
  trigger?: React.ReactNode;
  onDocumentTypeCreated?: (documentType: { id: string; name: string; color: string }) => void;
  // Optional external control
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Document type for editing
  documentType?: AssetTypeWithRoles | null;
  // Type: 'document' or 'asset'
  type?: 'document' | 'asset';
}

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
    }
  }, [documentTypeData]);

  // Reset form when dialog closes or documentType changes
  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);

  const mutation = useMutation({
    mutationFn: (documentTypeData: { name: string; color: string }) => {
      if (isEditing && documentTypeId) {
        return updateDocumentType(documentTypeId, documentTypeData);
      }
      return createDocumentType(documentTypeData);
    },
    onSuccess: (result) => {
      const queryKey = type === 'asset' ? 'asset-types' : 'document-types';
      queryClient.invalidateQueries({ queryKey: [queryKey, 'list-with-roles'] });
      queryClient.invalidateQueries({ queryKey: [queryKey, selectedOrganizationId] });
      onDocumentTypeCreated?.(result);
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message || t(isEditing ? 'form.errorUpdating' : 'form.errorCreating', { type }));
    },
  });

  const resetForm = () => {
    setName("");
    setSelectedColor("#3B82F6");
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

      <HuemulDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={dialogTitle}
        description={dialogDescription}
        icon={Plus}
        maxWidth="sm:max-w-lg"
        maxHeight="max-h-[90vh]"
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

            {error && error !== t('form.nameRequired') && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
          </div>
        )}
      </HuemulDialog>
    </>
  );
}