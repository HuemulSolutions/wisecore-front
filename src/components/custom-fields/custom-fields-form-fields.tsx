import { HuemulField } from '@/huemul/components/huemul-field';
import { useTranslation } from 'react-i18next';

interface CustomFieldFormFieldsProps {
  name: string;
  description: string;
  dataType: string;
  masc: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDataTypeChange: (value: string) => void;
  onMascChange: (value: string) => void;
  dataTypes: string[];
  formatDataType: (dataType: string) => string;
  errors?: {
    name?: string;
    description?: string;
    data_type?: string;
  };
  disabled?: boolean;
  loadingDataTypes?: boolean;
}

export default function CustomFieldFormFields({
  name,
  description,
  dataType,
  masc,
  onNameChange,
  onDescriptionChange,
  onDataTypeChange,
  onMascChange,
  dataTypes,
  formatDataType,
  errors = {},
  disabled = false,
  loadingDataTypes = false,
}: CustomFieldFormFieldsProps) {
  const { t } = useTranslation('custom-fields')

  return (
    <div className="space-y-4">
      <HuemulField
        type="text"
        label={t('columns.name')}
        name="name"
        placeholder={t('form.namePlaceholder')}
        value={name}
        onChange={(v) => onNameChange(String(v))}
        disabled={disabled}
        error={errors.name}
        required
      />
      <HuemulField
        type="textarea"
        label={t('columns.description')}
        name="description"
        placeholder={t('form.descriptionPlaceholder')}
        rows={3}
        value={description}
        onChange={(v) => onDescriptionChange(String(v))}
        disabled={disabled}
        error={errors.description}
      />
      <HuemulField
        type="select"
        label={t('columns.dataType')}
        name="data_type"
        placeholder={t('form.dataTypePlaceholder')}
        value={dataType}
        onChange={(v) => onDataTypeChange(String(v))}
        disabled={disabled || loadingDataTypes}
        error={errors.data_type}
        required
        options={dataTypes.map((type) => ({
          label: formatDataType(type),
          value: type,
        }))}
      />
      <HuemulField
        type="text"
        label={t('form.maskLabel')}
        name="masc"
        placeholder={t('form.maskPlaceholder')}
        value={masc}
        onChange={(v) => onMascChange(String(v))}
        disabled={disabled}
      />
    </div>
  );
}
