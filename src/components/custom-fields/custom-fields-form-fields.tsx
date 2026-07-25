import { HuemulField } from '@/huemul/components/huemul-field';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { QUESTION_TYPE, NUMERIC_DATA_TYPES, jsonbToInputValue } from '@/components/sections/question-type-meta';
import { CustomFieldPreview } from '@/components/custom-fields/custom-field-preview';
import type { CustomFieldFormFieldsProps, CustomFieldOption } from '@/types/custom-fields';

// Tipos de archivo seleccionables para carga_de_archivos — mismo catálogo que los form fields de sección.
const FILE_TYPE_OPTIONS = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'csv'];

export type { CustomFieldFormFieldsProps } from '@/types/custom-fields';

export default function CustomFieldFormFields({
  name,
  description,
  dataType,
  masc,
  questionType,
  options,
  minValue,
  maxValue,
  config,
  onNameChange,
  onDescriptionChange,
  onMascChange,
  onQuestionTypeChange,
  onOptionsChange,
  onMinValueChange,
  onMaxValueChange,
  onConfigChange,
  questionTypes,
  formatQuestionType,
  errors = {},
  disabled = false,
  loadingQuestionTypes = false,
}: CustomFieldFormFieldsProps) {
  const { t } = useTranslation(['custom-fields', 'common', 'sections'])

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
        label={t('form.questionTypeSelectLabel')}
        name="question_type"
        placeholder={t('form.questionTypeSelectPlaceholder')}
        value={questionType}
        onChange={(v) => onQuestionTypeChange(String(v))}
        disabled={disabled || loadingQuestionTypes}
        error={errors.question_type}
        required
        options={questionTypes.map((qt) => ({
          label: formatQuestionType(qt.question_type),
          value: qt.question_type,
        }))}
      />

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

      {/* Numérico (respuesta_numerica/decimal): rango min/max. Escala lineal y calificación
          también usan min_value/max_value pero con su propio widget (bloques siguientes). */}
      {NUMERIC_DATA_TYPES.includes(dataType) &&
        questionType !== QUESTION_TYPE.linearScale &&
        questionType !== QUESTION_TYPE.rating && (
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <HuemulField
              type="number"
              label={t('sections:form.formFields.minValue')}
              value={jsonbToInputValue(minValue)}
              onChange={(v) => onMinValueChange(v === "" ? null : Number(v))}
              placeholder={t('sections:form.formFields.noLimit')}
              disabled={disabled}
            />
            <HuemulField
              type="number"
              label={t('sections:form.formFields.maxValue')}
              value={jsonbToInputValue(maxValue)}
              onChange={(v) => onMaxValueChange(v === "" ? null : Number(v))}
              placeholder={t('sections:form.formFields.noLimit')}
              disabled={disabled}
            />
          </div>
          {errors.min_value && <p className="text-sm text-destructive">{errors.min_value}</p>}
        </div>
      )}

      {/* Escala lineal: rango desde/hasta + etiquetas de extremos. */}
      {questionType === QUESTION_TYPE.linearScale && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <HuemulField
              type="select"
              label={t('sections:form.formFields.minValue')}
              value={String(typeof minValue === 'number' ? minValue : 1)}
              onChange={(v) => onMinValueChange(Number(v))}
              options={[0, 1].map((n) => ({ value: String(n), label: String(n) }))}
              disabled={disabled}
            />
            <HuemulField
              type="select"
              label={t('sections:form.formFields.maxValue')}
              value={String(typeof maxValue === 'number' ? maxValue : 5)}
              onChange={(v) => onMaxValueChange(Number(v))}
              options={[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: String(n), label: String(n) }))}
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <HuemulField
              type="text"
              label={t('sections:form.formFields.startLabel')}
              placeholder={t('sections:form.formFields.startLabelPlaceholder')}
              value={config.min_label ?? ''}
              onChange={(v) => onConfigChange({ min_label: String(v) })}
              disabled={disabled}
            />
            <HuemulField
              type="text"
              label={t('sections:form.formFields.endLabel')}
              placeholder={t('sections:form.formFields.endLabelPlaceholder')}
              value={config.max_label ?? ''}
              onChange={(v) => onConfigChange({ max_label: String(v) })}
              disabled={disabled}
            />
          </div>
          {errors.min_value && <p className="text-sm text-destructive">{errors.min_value}</p>}
        </div>
      )}

      {/* Calificación: cantidad de estrellas (se persiste en max_value). */}
      {questionType === QUESTION_TYPE.rating && (
        <HuemulField
          type="select"
          label={t('sections:form.formFields.starCount')}
          value={String(typeof maxValue === 'number' ? maxValue : 5)}
          onChange={(v) => onMaxValueChange(Number(v))}
          options={[3, 4, 5, 10].map((n) => ({ value: String(n), label: String(n) }))}
          disabled={disabled}
        />
      )}

      {/* Carga de archivos: tipos permitidos + tamaño máximo. */}
      {questionType === QUESTION_TYPE.fileUpload && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('form.allowedTypesLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {FILE_TYPE_OPTIONS.map((type) => {
              const active = (config.allowed_types ?? []).includes(type)
              return (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const current = config.allowed_types ?? []
                    const next = active ? current.filter((x) => x !== type) : [...current, type]
                    onConfigChange({ allowed_types: next })
                  }}
                  className={`rounded border px-2 py-1 text-xs transition-colors ${
                    active
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {type}
                </button>
              )
            })}
          </div>
          <HuemulField
            type="select"
            label={t('sections:form.formFields.maxSize')}
            value={String(config.max_size_mb ?? 10)}
            onChange={(v) => onConfigChange({ max_size_mb: Number(v) })}
            options={[1, 5, 10, 25, 50].map((n) => ({ value: String(n), label: `${n} MB` }))}
            disabled={disabled}
          />
        </div>
      )}

      <CustomFieldPreview
        name={name}
        dataType={dataType}
        questionType={questionType}
        options={options}
        minValue={minValue}
        maxValue={maxValue}
      />

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
