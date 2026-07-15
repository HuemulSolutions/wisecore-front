import { HuemulField } from '@/huemul/components/huemul-field';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { QUESTION_TYPE } from '@/components/sections/question-type-meta';
import type { CustomFieldFormFieldsProps, CustomFieldOption } from '@/types/custom-fields';

export type { CustomFieldFormFieldsProps } from '@/types/custom-fields';

export default function CustomFieldFormFields({
  name,
  description,
  dataType,
  masc,
  questionType,
  options,
  onNameChange,
  onDescriptionChange,
  onDataTypeChange,
  onMascChange,
  onQuestionTypeChange,
  onOptionsChange,
  dataTypes,
  formatDataType,
  errors = {},
  disabled = false,
  loadingDataTypes = false,
}: CustomFieldFormFieldsProps) {
  const { t } = useTranslation(['custom-fields', 'common'])

  const handleAddOption = () => {
    onOptionsChange([...options, { id: '', label: '' }])
  }

  const handleRemoveOption = (index: number) => {
    onOptionsChange(options.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, field: keyof CustomFieldOption, value: string) => {
    const updated = options.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt
    )
    onOptionsChange(updated)
  }

  const MASK_APPLICABLE_TYPES = ['string', 'int', 'decimal', 'url']

  return (
    <div className="space-y-4">
      <HuemulField
        type="text"
        label={t('common:name')}
        name="name"
        placeholder={t('form.namePlaceholder')}
        value={name}
        onChange={(v) => onNameChange(String(v))}
        disabled={disabled}
        error={errors.name}
        required
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

      {dataType === 'list' && (
        <HuemulField
          type="select"
          label={t('form.questionTypeLabel')}
          name="question_type"
          placeholder={t('form.questionTypePlaceholder')}
          value={questionType}
          onChange={(v) => onQuestionTypeChange(String(v))}
          disabled={disabled}
          options={[
            { label: t('form.questionTypeSingle'), value: QUESTION_TYPE.dropdown },
            { label: t('form.questionTypeMultiple'), value: QUESTION_TYPE.dropdownMultiple },
          ]}
        />
      )}

      {dataType === 'list' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {t('form.listOptionsLabel')}
          </p>
          {errors.options && (
            <p className="text-sm text-destructive">{errors.options}</p>
          )}
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <HuemulField
                    type="text"
                    label={index === 0 ? t('form.optionIdLabel') : undefined}
                    name={`option_id_${index}`}
                    placeholder={t('form.optionIdPlaceholder')}
                    value={option.id}
                    onChange={(v) => handleOptionChange(index, 'id', String(v))}
                    disabled={disabled}
                    error={errors[`option_${index}_id`]}
                  />
                </div>
                <div className="flex-1">
                  <HuemulField
                    type="text"
                    label={index === 0 ? t('form.optionNameLabel') : undefined}
                    name={`option_name_${index}`}
                    placeholder={t('form.optionNamePlaceholder')}
                    value={option.label}
                    onChange={(v) => handleOptionChange(index, 'label', String(v))}
                    disabled={disabled}
                    error={errors[`option_${index}_name`]}
                  />
                </div>
                <div className={index === 0 ? 'mt-6' : ''}>
                  <HuemulButton
                    icon={Trash2}
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={() => handleRemoveOption(index)}
                    type="button"
                  />
                </div>
              </div>
            ))}
          </div>
          <HuemulButton
            icon={Plus}
            variant="outline"
            size="sm"
            label={t('form.listOptionsAddButton')}
            disabled={disabled}
            onClick={handleAddOption}
            type="button"
          />
        </div>
      )}

      {MASK_APPLICABLE_TYPES.includes(dataType) && (
        <HuemulField
          type="text"
          label={t('form.maskLabel')}
          name="masc"
          placeholder={t('form.maskPlaceholder')}
          value={masc}
          onChange={(v) => onMascChange(String(v))}
          disabled={disabled}
        />
      )}

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
    </div>
  );
}
