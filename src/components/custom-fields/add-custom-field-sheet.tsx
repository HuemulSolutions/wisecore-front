"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulCombobox } from "@/huemul/components/huemul-combobox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useCustomField, useCustomFieldQuestionTypes, useCustomFieldMutations } from "@/hooks/useCustomFields"
import { getCustomFields } from "@/services/custom-fields"
import { useOrganization } from "@/contexts/organization-context"
import { questionTypeLabel, QUESTION_TYPE, NUMERIC_DATA_TYPES } from "@/components/sections/question-type-meta"
import type { CustomFieldOption } from "@/types/custom-fields"
import type { FormFieldConfig } from "@/types/sections/core"
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul/field"
import CustomFieldFormFields from "@/components/custom-fields/custom-fields-form-fields"
import { CustomFieldValueField } from "@/components/custom-fields/custom-field-value-field"
import { validateCustomFieldValue } from "@/components/custom-fields/custom-field-value-validation"
import { useTranslation } from "react-i18next"
import type { AddCustomFieldDialogProps } from "@/types/add-custom-field-dialog"

export type { AddCustomFieldDialogProps } from "@/types/add-custom-field-dialog"

export function AddCustomFieldSheet({
  isOpen,
  onClose,
  entityId,
  entityType,
  onAdd,
  uploadImageFn,
  sources,
  isLoadingSources,
  onImageUploadStart,
  onImageUploadComplete,
}: AddCustomFieldDialogProps) {
  const [fieldType, setFieldType] = useState<"existing" | "new">("existing")
  const [selectedCustomFieldId, setSelectedCustomFieldId] = useState<string>("")
  const [selectedSource, setSelectedSource] = useState<string>("")
  const [isRequired, setIsRequired] = useState(false)
  const [prompt, setPrompt] = useState<string>("")
  const [value, setValue] = useState<string | string[]>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { selectedOrganizationId } = useOrganization();
  const [newCustomFieldData, setNewCustomFieldData] = useState({
    name: "",
    description: "",
    masc: "",
    question_type: "",
  })
  const [newOptions, setNewOptions] = useState<CustomFieldOption[]>([])
  const [newMinValue, setNewMinValue] = useState<number | null>(null)
  const [newMaxValue, setNewMaxValue] = useState<number | null>(null)
  const [newConfig, setNewConfig] = useState<FormFieldConfig>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { t } = useTranslation(['custom-fields', 'common'])
  const { t: tSections } = useTranslation('sections')

  const formatDataType = useCallback(
    (dataType: string) => t(`dataTypes.${dataType}` as Parameters<typeof t>[0], { defaultValue: dataType }),
    [t],
  )

  const formatQuestionType = useCallback(
    (questionType: string) => questionTypeLabel(questionType, tSections),
    [tSections],
  )

  // Fetch full details of the selected existing custom field (needed for its data_type/default_value)
  const { data: selectedCustomField } = useCustomField(selectedCustomFieldId, !!selectedCustomFieldId)

  // Async, server-side search for the existing custom field selector
  const fetchCustomFieldOptions = useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getCustomFields({ search: search || undefined, page, page_size: pageSize })
      return {
        options: res.data.map((field) => ({
          value: field.id,
          label: field.name,
          description: formatDataType(field.data_type),
        })),
        hasMore: res.has_next,
      }
    },
    [formatDataType],
  )

  // Fetch question types for new custom field creation (lazy loading: only when sheet is open).
  // data_type is derived from this catalog, not chosen directly.
  const { data: questionTypesResponse, isLoading: loadingQuestionTypes } = useCustomFieldQuestionTypes({ enabled: isOpen })
  const questionTypes = useMemo(() => questionTypesResponse?.data ?? [], [questionTypesResponse])
  const questionTypeDataMap = useMemo(
    () => new Map(questionTypes.map((qt) => [qt.question_type, qt.data_type])),
    [questionTypes],
  )
  const newCustomFieldDataType = questionTypeDataMap.get(newCustomFieldData.question_type) ?? ""

  // Custom field mutations for creating new custom fields
  const customFieldMutations = useCustomFieldMutations()

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setFieldType("existing")
      setSelectedCustomFieldId("")
      setSelectedSource("")
      setIsRequired(false)
      setPrompt("")
      setValue("")
      setSelectedFile(null)
      setNewCustomFieldData({
        name: "",
        description: "",
        masc: "",
        question_type: "",
      })
      setNewOptions([])
      setNewMinValue(null)
      setNewMaxValue(null)
      setNewConfig({})
      setFormErrors({})
    }
  }, [isOpen])

  // Reset related fields when changing custom field selection
  useEffect(() => {
    if (fieldType === "existing" && selectedCustomFieldId) {
      setSelectedSource("")
      setIsRequired(false)
      setPrompt("")
      setValue("")
      setSelectedFile(null)
      setFormErrors({})
    }
  }, [selectedCustomFieldId, fieldType])

  const handleImageUpload = async (entityCustomFieldId: string, file: File) => {
    setIsUploadingImage(true)
    onImageUploadStart?.(entityCustomFieldId)
    try {
      await uploadImageFn(entityCustomFieldId, file, selectedOrganizationId!)
      onImageUploadComplete?.()
    } catch (error) {
      console.error("Error uploading image:", error)
      setFormErrors(prev => ({ ...prev, value: t('addDialog.uploadFailed') }))
      onImageUploadComplete?.()
    } finally {
      setIsUploadingImage(false)
    }
  }

  const getValuePayload = (dataType: string) => {
    if (Array.isArray(value)) {
      return value.length === 0 ? {} : { value }
    }
    if (!value.trim()) return {}

    switch (dataType) {
      case "bool":
        const boolValue = value === "true" || value === "1"
        return { value: boolValue }
      case "int":
        const intValue = parseInt(value)
        return isNaN(intValue) ? {} : { value: intValue }
      case "decimal":
        const decimalValue = parseFloat(value)
        return isNaN(decimalValue) ? {} : { value: decimalValue }
      case "date":
        // El backend exige YYYY-MM-DD estricto; recortar cualquier componente de hora.
        return { value: value.split("T")[0] }
      case "time":
      case "datetime":
      case "url":
        return { value: value }
      case "image":
        return {} // Images are handled via blob upload
      case "list":
        return { value: value }
      default:
        return { value: value }
    }
  }

  const validateExistingValueForm = () => {
    if (!selectedSource || selectedSource === "inferred") return true

    const error = validateCustomFieldValue({
      dataType: selectedCustomField?.data_type || "",
      questionType: selectedCustomField?.question_type,
      value,
      required: isRequired,
      minValue: selectedCustomField?.min_value,
      maxValue: selectedCustomField?.max_value,
      t,
    })
    setFormErrors(prev => ({ ...prev, value: error || "" }))
    return !error
  }

  const validateNewCustomFieldForm = () => {
    const newErrors: Record<string, string> = {}

    if (!newCustomFieldData.name.trim()) {
      newErrors.name = t('form.nameRequired')
    } else if (newCustomFieldData.name.length > 255) {
      newErrors.name = t('form.nameTooLong')
    }

    if (newCustomFieldData.description.length > 1000) {
      newErrors.description = t('form.descriptionTooLong')
    }

    if (!newCustomFieldData.question_type) {
      newErrors.question_type = t('form.questionTypeRequired')
    }

    if (newCustomFieldDataType === 'list') {
      if (newOptions.length === 0) {
        newErrors.options = t('form.optionsRequired')
      } else {
        newOptions.forEach((opt, i) => {
          if (!opt.id.trim()) newErrors[`option_${i}_id`] = t('form.optionIdRequired')
          if (!opt.label.trim()) newErrors[`option_${i}_name`] = t('form.optionNameRequired')
        })
      }
    }

    // Numeric range (respuesta_numerica/decimal) and linear scale share min_value/max_value —
    // only flag when both bounds are set and inverted.
    const usesMinMax = NUMERIC_DATA_TYPES.includes(newCustomFieldDataType) || newCustomFieldData.question_type === QUESTION_TYPE.linearScale
    if (newCustomFieldData.question_type === QUESTION_TYPE.linearScale && (newMinValue === null || newMaxValue === null)) {
      newErrors.min_value = t('form.minMaxInvalid')
    } else if (usesMinMax && newMinValue !== null && newMaxValue !== null && newMinValue > newMaxValue) {
      newErrors.min_value = t('form.minMaxInvalid')
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Config específica por question_type — mismo modelo que custom-fields-create-edit-sheet.tsx.
  const getNewCustomFieldTypePayload = () => {
    if (newCustomFieldDataType === 'list') {
      return { default_value: newOptions }
    }
    if (newCustomFieldData.question_type === QUESTION_TYPE.linearScale) {
      return {
        min_value: newMinValue,
        max_value: newMaxValue,
        default_value: { min_label: newConfig.min_label, max_label: newConfig.max_label },
      }
    }
    if (newCustomFieldData.question_type === QUESTION_TYPE.rating) {
      return { max_value: newMaxValue }
    }
    if (newCustomFieldData.question_type === QUESTION_TYPE.fileUpload) {
      return {
        default_value: {
          allowed_types: newConfig.allowed_types ?? [],
          max_size_mb: newConfig.max_size_mb ?? 10,
        },
      }
    }
    if (NUMERIC_DATA_TYPES.includes(newCustomFieldDataType)) {
      return { min_value: newMinValue, max_value: newMaxValue }
    }
    return {}
  }

  const handleNewCustomFieldInputChange = (field: string, value: string) => {
    setNewCustomFieldData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const resetForm = () => {
    setFieldType("existing")
    setSelectedCustomFieldId("")
    setSelectedSource("")
    setIsRequired(false)
    setPrompt("")
    setValue("")
    setSelectedFile(null)
    setNewCustomFieldData({
      name: "",
      description: "",
      masc: "",
      question_type: "",
    })
    setNewOptions([])
    setNewMinValue(null)
    setNewMaxValue(null)
    setNewConfig({})
    setFormErrors({})
  }

  const closeSheet = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (fieldType === "existing") {
      if (!selectedCustomFieldId || !selectedSource) {
        return // Validation
      }

      if (!validateExistingValueForm()) {
        return
      }

      const data = {
        [entityType === "document" ? "document_id" : "template_id"]: entityId,
        custom_field_id: selectedCustomFieldId,
        source: selectedSource,
        required: isRequired,
        prompt: prompt.trim() || undefined,
        ...getValuePayload(selectedCustomField?.data_type || ""),
      }

      try {
        const createdEntity = await onAdd(data)

        // If it's an image and there's a file to upload, handle it after creation
        if (selectedCustomField?.data_type === "image" && selectedFile) {
          if (createdEntity?.id) {
            await handleImageUpload(createdEntity.id, selectedFile)
          } else {
            console.error(`No ${entityType} field ID returned from onAdd`)
          }
        }

        closeSheet()
      } catch (error) {
        console.error(`Error adding custom field ${entityType}:`, error)
      }
    } else {
      // Create new custom field only, don't add it to entity yet
      if (!validateNewCustomFieldForm()) {
        return
      }

      try {
        // Create the custom field
        const newCustomField = await customFieldMutations.create.mutateAsync({
          name: newCustomFieldData.name,
          description: newCustomFieldData.description,
          masc: newCustomFieldData.masc || "",
          question_type: newCustomFieldData.question_type,
          ...getNewCustomFieldTypePayload(),
        })

        // Switch to existing mode and select the newly created field
        setFieldType("existing")
        setSelectedCustomFieldId(newCustomField.id)

        // Reset new custom field form
        setNewCustomFieldData({
          name: "",
          description: "",
          masc: "",
          question_type: "",
        })
        setNewOptions([])
        setNewMinValue(null)
        setNewMaxValue(null)
        setNewConfig({})
        setFormErrors({})

        // Don't close the sheet - let user configure source, required, etc.
      } catch (error) {
        console.error("Error creating custom field:", error)
      }
    }
  }

  const isValid = fieldType === "existing"
    ? selectedCustomFieldId && selectedSource
    : newCustomFieldData.name && newCustomFieldData.question_type

  return (
    <HuemulSheet
      open={isOpen}
      onOpenChange={(open) => { if (!open) closeSheet() }}
      title={t('addDialog.title')}
      description={entityType === "document"
        ? t('addDialog.descriptionDocument')
        : t('addDialog.descriptionTemplate')}
      icon={Plus}
      maxWidth="sm:max-w-lg"
      cancelLabel={t('common:cancel', 'Cancel')}
      saveAction={{
        label: fieldType === "new" ? t('addDialog.saveNew') : t('addDialog.saveExisting'),
        onClick: handleSubmit,
        disabled: !isValid,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-6">
        {/* Radio Group for Field Type */}
        <HuemulField
          type="radio"
          label={t('addDialog.chooseOption')}
          name="field-type"
          value={fieldType}
          onChange={(v) => setFieldType(v as "existing" | "new")}
          options={[
            { label: t('addDialog.useExisting'), value: "existing" },
            { label: t('addDialog.createNew'), value: "new" },
          ]}
          inputClassName="flex-col gap-2"
        />

        {/* Existing Custom Field Selection */}
        {fieldType === "existing" && (
          <div className="space-y-4">
            {/* Custom Field Selector */}
            <div className="flex w-full flex-col gap-1.5">
              <Label htmlFor="custom-field" className="text-sm font-medium leading-snug">
                {t('addDialog.selectCustomField')}
              </Label>
              <HuemulCombobox
                id="custom-field"
                value={selectedCustomFieldId}
                onValueChange={(v) => setSelectedCustomFieldId(v as string)}
                fetchOptions={fetchCustomFieldOptions}
                pageSize={20}
                selectedOptions={selectedCustomField
                  ? [{
                      value: selectedCustomField.id,
                      label: selectedCustomField.name,
                      description: formatDataType(selectedCustomField.data_type),
                    }]
                  : []}
                placeholder={t('addDialog.selectCustomFieldPlaceholder')}
              />
            </div>

            {selectedCustomFieldId && (
              <>
                {/* Source Radio Group */}
                <HuemulField
                  type="radio"
                  label={t('addDialog.valueSource')}
                  name="source"
                  value={selectedSource}
                  onChange={(v) => setSelectedSource(String(v))}
                  disabled={isLoadingSources}
                  options={sources.map((source) => ({
                    label: source.charAt(0).toUpperCase() + source.slice(1),
                    value: source,
                  }))}
                  inputClassName="flex-col gap-2"
                />

                {/* Prompt - only show when source is inferred */}
                {selectedSource === "inferred" && (
                  <HuemulField
                    type="textarea"
                    label={t('addDialog.promptLabel')}
                    name="existing-prompt"
                    placeholder={t('addDialog.promptPlaceholder')}
                    rows={3}
                    value={prompt}
                    onChange={(v) => setPrompt(String(v))}
                  />
                )}

                {/* Value */}
                {selectedSource && selectedSource !== "inferred" && (
                  <CustomFieldValueField
                    dataType={selectedCustomField?.data_type || ""}
                    questionType={selectedCustomField?.question_type}
                    label={t('addDialog.valueLabel')}
                    value={value}
                    onChange={(v) => {
                      setValue(v)
                      if (formErrors.value) setFormErrors(prev => ({ ...prev, value: "" }))
                    }}
                    options={(selectedCustomField?.default_value as CustomFieldOption[] | null) ?? []}
                    minValue={selectedCustomField?.min_value}
                    maxValue={selectedCustomField?.max_value}
                    error={formErrors.value}
                    disabled={isUploadingImage}
                    isUploadingImage={isUploadingImage}
                    imageUploadDescription={entityType === "document"
                      ? t('addDialog.imageUploadDescDocument')
                      : t('addDialog.imageUploadDescTemplate')}
                    onImageFile={(file) => setSelectedFile(file)}
                    onImageValidationError={(message) => setFormErrors(prev => ({ ...prev, value: message }))}
                  />
                )}

                {!selectedSource && (
                  <Input
                    placeholder={t('addDialog.selectFirstPlaceholder')}
                    disabled
                  />
                )}

                {/* Required Switch */}
                <HuemulField
                  type="switch"
                  label={t('addDialog.requiredField')}
                  description={entityType === "document"
                    ? t('addDialog.requiredFieldDescDocument')
                    : t('addDialog.requiredFieldDescTemplate')}
                  value={isRequired}
                  onChange={(v) => setIsRequired(Boolean(v))}
                />
              </>
            )}
          </div>
        )}

        {/* Create New Custom Field */}
        {fieldType === "new" && (
          <div className="space-y-4">
            <CustomFieldFormFields
              name={newCustomFieldData.name}
              description={newCustomFieldData.description}
              dataType={newCustomFieldDataType}
              masc={newCustomFieldData.masc}
              questionType={newCustomFieldData.question_type}
              options={newOptions}
              minValue={newMinValue}
              maxValue={newMaxValue}
              config={newConfig}
              onNameChange={(value) => handleNewCustomFieldInputChange("name", value)}
              onDescriptionChange={(value) => handleNewCustomFieldInputChange("description", value)}
              onMascChange={(value) => handleNewCustomFieldInputChange("masc", value)}
              onQuestionTypeChange={(value) => {
                handleNewCustomFieldInputChange("question_type", value)
                // Drop config that no longer applies to the newly chosen type — same pattern
                // as custom-fields-create-edit-sheet.tsx.
                const newDataType = questionTypeDataMap.get(value) ?? ""
                if (newDataType !== 'list') {
                  setNewOptions([])
                }
                if (!NUMERIC_DATA_TYPES.includes(newDataType) && value !== QUESTION_TYPE.linearScale) {
                  setNewMinValue(null)
                  setNewMaxValue(null)
                }
                // Escala lineal / calificación muestran un default en el select (1/5) que es
                // solo visual — sin esto el estado real queda null y el backend lo rechaza.
                if (value === QUESTION_TYPE.linearScale) {
                  setNewMinValue(prev => prev ?? 1)
                  setNewMaxValue(prev => prev ?? 5)
                }
                if (value === QUESTION_TYPE.rating) {
                  setNewMaxValue(prev => prev ?? 5)
                }
                if (value !== QUESTION_TYPE.linearScale && value !== QUESTION_TYPE.fileUpload) {
                  setNewConfig({})
                }
              }}
              onOptionsChange={setNewOptions}
              onMinValueChange={setNewMinValue}
              onMaxValueChange={setNewMaxValue}
              onConfigChange={(patch) => setNewConfig(prev => ({ ...prev, ...patch }))}
              questionTypes={questionTypes}
              formatQuestionType={formatQuestionType}
              errors={formErrors}
              loadingQuestionTypes={loadingQuestionTypes}
            />
          </div>
        )}
      </div>
    </HuemulSheet>
  )
}
