"use client"

import { useState, useEffect } from "react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useCustomFields, useCustomFieldDataTypes, useCustomFieldMutations } from "@/hooks/useCustomFields"
import { useOrganization } from "@/contexts/organization-context"
import type { CustomField, CustomFieldOption } from "@/types/custom-fields"
import CustomFieldFormFields from "@/components/custom-fields/custom-fields-form-fields"
import { CustomFieldValueField } from "@/components/custom-fields/custom-field-value-field"
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
  const [value, setValue] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { selectedOrganizationId } = useOrganization();
  const [newCustomFieldData, setNewCustomFieldData] = useState({
    name: "",
    description: "",
    data_type: "",
    masc: "",
  })
  const [newOptions, setNewOptions] = useState<CustomFieldOption[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch existing custom fields (lazy loading: only when sheet is open)
  const {
    data: customFieldsResponse,
    isLoading: isLoadingCustomFields,
  } = useCustomFields({ enabled: isOpen })

  const customFields = customFieldsResponse?.data || []

  // Fetch data types for new custom field creation (lazy loading: only when sheet is open)
  const { data: dataTypesResponse, isLoading: loadingDataTypes } = useCustomFieldDataTypes({ enabled: isOpen })
  const dataTypes = dataTypesResponse?.data || []

  // Custom field mutations for creating new custom fields
  const customFieldMutations = useCustomFieldMutations()
  const { t } = useTranslation(['custom-fields', 'common'])

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
        data_type: "",
        masc: "",
      })
      setNewOptions([])
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

  const getSelectedCustomField = () => {
    return customFields.find((field: CustomField) => field.id === selectedCustomFieldId)
  }

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

    if (!newCustomFieldData.data_type) {
      newErrors.data_type = t('form.dataTypeRequired')
    }

    if (newCustomFieldData.data_type === 'list') {
      if (newOptions.length === 0) {
        newErrors.options = t('form.optionsRequired')
      } else {
        newOptions.forEach((opt, i) => {
          if (!opt.id.trim()) newErrors[`option_${i}_id`] = t('form.optionIdRequired')
          if (!opt.label.trim()) newErrors[`option_${i}_name`] = t('form.optionNameRequired')
        })
      }
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNewCustomFieldInputChange = (field: string, value: string) => {
    setNewCustomFieldData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const formatDataType = (dataType: string) => {
    return t(`dataTypes.${dataType}` as Parameters<typeof t>[0], { defaultValue: dataType })
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
      data_type: "",
      masc: "",
    })
    setNewOptions([])
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

      const selectedField = getSelectedCustomField()
      const data = {
        [entityType === "document" ? "document_id" : "template_id"]: entityId,
        custom_field_id: selectedCustomFieldId,
        source: selectedSource,
        required: isRequired,
        prompt: prompt.trim() || undefined,
        ...getValuePayload(selectedField?.data_type || ""),
      }

      try {
        const createdEntity = await onAdd(data)

        // If it's an image and there's a file to upload, handle it after creation
        if (selectedField?.data_type === "image" && selectedFile) {
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
          data_type: newCustomFieldData.data_type,
          masc: newCustomFieldData.masc || "",
          ...(newCustomFieldData.data_type === 'list' && { default_value: newOptions }),
        })

        // Switch to existing mode and select the newly created field
        setFieldType("existing")
        setSelectedCustomFieldId(newCustomField.id)

        // Reset new custom field form
        setNewCustomFieldData({
          name: "",
          description: "",
          data_type: "",
          masc: "",
        })
        setFormErrors({})

        // Don't close the sheet - let user configure source, required, etc.
      } catch (error) {
        console.error("Error creating custom field:", error)
      }
    }
  }

  const isValid = fieldType === "existing"
    ? selectedCustomFieldId && selectedSource
    : newCustomFieldData.name && newCustomFieldData.data_type

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
            <HuemulField
              type="combobox"
              label={t('addDialog.selectCustomField')}
              name="custom-field"
              placeholder={t('addDialog.selectCustomFieldPlaceholder')}
              value={selectedCustomFieldId}
              onChange={(v) => setSelectedCustomFieldId(String(v))}
              disabled={isLoadingCustomFields}
              options={customFields.map((field: CustomField) => ({
                label: field.name,
                value: field.id,
                description: formatDataType(field.data_type),
              }))}
            />

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
                    dataType={getSelectedCustomField()?.data_type || ""}
                    label={t('addDialog.valueLabel')}
                    value={value}
                    onChange={setValue}
                    options={getSelectedCustomField()?.default_value ?? []}
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
              dataType={newCustomFieldData.data_type}
              masc={newCustomFieldData.masc}
              options={newOptions}
              onNameChange={(value) => handleNewCustomFieldInputChange("name", value)}
              onDescriptionChange={(value) => handleNewCustomFieldInputChange("description", value)}
              onDataTypeChange={(value) => {
                handleNewCustomFieldInputChange("data_type", value)
                if (value !== 'list') setNewOptions([])
              }}
              onMascChange={(value) => handleNewCustomFieldInputChange("masc", value)}
              onOptionsChange={setNewOptions}
              dataTypes={dataTypes}
              formatDataType={formatDataType}
              errors={formErrors}
              loadingDataTypes={loadingDataTypes}
            />
          </div>
        )}
      </div>
    </HuemulSheet>
  )
}
