import { useTranslation } from 'react-i18next';
import { HuemulField } from '@/huemul/components/huemul-field';
import { PlusCircle } from 'lucide-react';
import { isRootAdmin } from '@/lib/jwt-utils';

interface AssetFormFieldsProps {
  name: string;
  description: string;
  internalCode: string;
  templateId: string;
  documentTypeId: string;
  createInitialVersion: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onInternalCodeChange: (value: string) => void;
  onTemplateIdChange: (value: string) => void;
  onDocumentTypeIdChange: (value: string) => void;
  onCreateInitialVersionChange: (value: boolean) => void;
  onCreateDocType?: () => void;
  templates: any[];
  documentTypes: any[];
  isLoadingDocTypes?: boolean;
  docTypesError?: any;
  disabled?: boolean;
}

export default function AssetFormFields({
  name,
  description,
  internalCode,
  templateId,
  documentTypeId,
  createInitialVersion,
  onNameChange,
  onDescriptionChange,
  onInternalCodeChange,
  onTemplateIdChange,
  onDocumentTypeIdChange,
  onCreateInitialVersionChange,
  onCreateDocType,
  templates,
  documentTypes,
  isLoadingDocTypes = false,
  docTypesError = null,
  disabled = false,
}: AssetFormFieldsProps) {
  const { t } = useTranslation('assets')
  return (
    <div className="grid gap-6">
      <HuemulField
        type="text"
        label={t('form.assetName')}
        name="name"
        required
        value={name}
        onChange={(v) => onNameChange(String(v))}
        placeholder={t('form.assetNamePlaceholder')}
        disabled={disabled}
      />

      <HuemulField
        type="text"
        label={t('form.internalCode')}
        name="internalCode"
        value={internalCode}
        onChange={(v) => onInternalCodeChange(String(v))}
        placeholder={t('form.internalCodePlaceholder')}
        description={t('form.internalCodeDescription')}
        disabled={disabled}
      />

      <HuemulField
        type="textarea"
        label={t('form.description')}
        name="description"
        value={description}
        onChange={(v) => onDescriptionChange(String(v))}
        placeholder={t('form.descriptionPlaceholder')}
        rows={4}
        description={t('form.descriptionFieldDescription')}
        disabled={disabled}
      />

      <HuemulField
        type="switch"
        label={t('form.createInitialVersion')}
        name="createInitialVersion"
        value={createInitialVersion}
        onChange={(v) => {
          onCreateInitialVersionChange(Boolean(v))
          if (v) onTemplateIdChange('')
        }}
        description={`${t('form.createInitialVersionDescription')}${templateId ? t('form.createInitialVersionDisabled') : ''}`}
        disabled={disabled || !!templateId}
        labelFirst
        className="rounded-lg border p-4"
      />

      <HuemulField
        type="select"
        label={t('form.template')}
        name="template"
        value={templateId}
        onChange={(v) => {
          onTemplateIdChange(String(v))
          if (v) onCreateInitialVersionChange(false)
        }}
        options={templates.map((t: any) => ({ label: t.name, value: t.id }))}
        placeholder={t('form.templatePlaceholder')}
        description={t('form.templateDescription')}
        disabled={disabled || createInitialVersion}
      />

      <HuemulField
        type="select"
        label={t('form.assetType')}
        name="documentType"
        id="documentType"
        required
        value={documentTypeId}
        onChange={(v) => onDocumentTypeIdChange(String(v))}
        options={documentTypes.map((dt: any) => ({ label: dt.name, value: dt.id, color: dt.color }))}
        placeholder={isLoadingDocTypes ? t('form.assetTypeLoading') : t('form.assetTypePlaceholder')}
        disabled={disabled || isLoadingDocTypes}
        error={docTypesError ? t('form.assetTypeError') : undefined}
        labelAction={
          isRootAdmin() && onCreateDocType
            ? { icon: PlusCircle, onClick: onCreateDocType, tooltip: t('form.newType') }
            : undefined
        }
      />
    </div>
  );
}
