import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { Plus, Loader2 } from "lucide-react";
import {
  useAssetTypeGeneralForm,
  AssetTypeGeneralFormFields,
} from "@/components/assets-types/assets-types-general-form";
import type { CreateDocumentTypeProps } from '@/types/assets'

export type { CreateDocumentTypeProps } from '@/types/assets'

export default function CreateDocumentType({
  trigger,
  onDocumentTypeCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  documentType,
  type = 'document',
  canSave
}: CreateDocumentTypeProps) {
  const { t } = useTranslation(['asset-types', 'common'])
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const isDialogOpen = externalOpen !== undefined ? externalOpen : internalDialogOpen;
  const setIsDialogOpen = externalOnOpenChange || setInternalDialogOpen;

  const isEditing = !!documentType;

  const form = useAssetTypeGeneralForm({
    documentTypeId: documentType?.document_type_id,
    type,
    enabled: isDialogOpen,
    // El reset lo dispara el efecto de cierre del sheet.
    onSaved: (result) => {
      onDocumentTypeCreated?.(result);
      setIsDialogOpen(false);
    },
  });

  // Reset form when dialog closes or documentType changes
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen]);

  const dialogTitle = isEditing
    ? t(type === 'asset' ? 'asset-types:edit.assetTitle' : 'asset-types:edit.documentTitle')
    : t(type === 'asset' ? 'asset-types:create.assetTitle' : 'asset-types:create.documentTitle')
  const dialogDescription = isEditing
    ? t(type === 'asset' ? 'asset-types:edit.assetDescription' : 'asset-types:edit.documentDescription')
    : t(type === 'asset' ? 'asset-types:create.assetDescription' : 'asset-types:create.documentDescription')

  if (!canSave) return null

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
          onClick: form.submit,
          loading: form.isSaving,
          disabled: !form.values.name.trim(),
          closeOnSuccess: false,
        }}
        cancelLabel={t('common:cancel')}
      >
        {form.isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AssetTypeGeneralFormFields form={form} type={type} />
        )}
      </HuemulSheet>
    </>
  );
}
