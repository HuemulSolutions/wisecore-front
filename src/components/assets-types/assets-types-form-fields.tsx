import { useTranslation } from 'react-i18next';
import { HuemulField } from '@/huemul/components/huemul-field';
import type { DocumentTypeFormFieldsProps } from '@/types/assets'

export type { DocumentTypeFormFieldsProps } from '@/types/assets'

export default function DocumentTypeFormFields({
  name,
  color,
  onNameChange,
  onColorChange,
  errors = {},
  disabled = false,
}: DocumentTypeFormFieldsProps) {
  const { t } = useTranslation('asset-types')

  return (
    <div className="space-y-4">
      <HuemulField
        label={t('form.assetTypeName')}
        name="name"
        value={name}
        onChange={(v) => onNameChange(String(v))}
        placeholder={t('form.assetTypeNamePlaceholder')}
        error={errors.name}
        disabled={disabled}
        required
      />
      <HuemulField
        type="color"
        label={t('form.color')}
        name="color"
        value={color}
        onChange={(v) => onColorChange(String(v))}
        error={errors.color}
        disabled={disabled}
      />
    </div>
  );
}
