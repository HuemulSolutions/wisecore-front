"use client"

import { useState, useEffect } from "react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Input } from "@/components/ui/input"
import { Loader2, Plus } from "lucide-react"
import { useCustomFields, useCustomFieldDataTypes, useCustomFieldMutations } from "@/hooks/useCustomFields"
import { useOrganization } from "@/contexts/organization-context"
import type { CustomField } from "@/types/custom-fields"
import CustomFieldFormFields from "@/components/custom-fields/custom-fields-form-fields"
import { useTranslation } from "react-i18next"

interface AddCustomFieldDialogProps {
  isOpen: boolean
  onClose: () => void
  entityId: string
  entityType: "document" | "template"
  onAdd: (data: any) => Promise<any>
  uploadImageFn: (entityCustomFieldId: string, file: File, organizationId: string) => Promise<void>
  sources: string[]
  isLoadingSources: boolean
  onImageUploadStart?: (fieldId: string) => void
  onImageUploadComplete?: () => void
}

export function AddCustomFieldDialog({
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch existing custom fields (lazy loading: only when dialog is open)
  const {
    data: customFieldsResponse,
    isLoading: isLoadingCustomFields,
  } = useCustomFields({ enabled: isOpen })

  const customFields = customFieldsResponse?.data || []

  // Fetch data types for new custom field creation (lazy loading: only when dialog is open)
  const { data: dataTypesResponse, isLoading: loadingDataTypes } = useCustomFieldDataTypes({ enabled: isOpen })
  const dataTypes = dataTypesResponse?.data || []

  // Custom field mutations for creating new custom fields
  const customFieldMutations = useCustomFieldMutations()
  const { t } = useTranslation('custom-fields')

  // Reset form when dialog opens
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
    console.log(`Starting image upload for ${entityType} field ID:`, entityCustomFieldId, "file:", file.name)
    setIsUploadingImage(true)
    onImageUploadStart?.(entityCustomFieldId)
    try {
      await uploadImageFn(entityCustomFieldId, file, selectedOrganizationId!)
      console.log("Image uploaded successfully")
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
    setFormErrors({})
  }

  const closeDialog = () => {
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
        console.log(`Creating custom field ${entityType} with data:`, data)
        const createdEntity = await onAdd(data)
        console.log(`Created ${entityType}:`, createdEntity)
        
        // If it's an image and there's a file to upload, handle it after creation
        if (selectedField?.data_type === "image" && selectedFile) {
          console.log(`Uploading image for ${entityType} field ID:`, createdEntity?.id)
          if (createdEntity?.id) {
            await handleImageUpload(createdEntity.id, selectedFile)
          } else {
            console.error(`No ${entityType} field ID returned from onAdd`)
          }
        }
        
        closeDialog()
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
        })

        console.log("Created new custom field:", newCustomField)
        
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
        
        // Don't close the dialog - let user configure source, required, etc.
      } catch (error) {
        console.error("Error creating custom field:", error)
      }
    }
  }

  const renderValueField = () => {
    let dataType = ""
    
    if (fieldType === "existing") {
      const selectedField = getSelectedCustomField()
      dataType = selectedField?.data_type || ""
    } else {
      dataType = newCustomFieldData.data_type
    }
    
    if (!dataType) {
      return (
        <Input
          placeholder={t('addDialog.selectFirstPlaceholder')}
          disabled
        />
      )
    }
    
    switch (dataType) {
      case "bool":
        return (
          <HuemulField
            type="switch"
            label={t('addDialog.valueLabel')}
            value={value === "true" || value === "1"}
            onChange={(v) => setValue(v.toString())}
            checkLabel={(value === "true" || value === "1") ? "True" : "False"}
          />
        )
      case "int":
        return (
          <HuemulField
            type="number"
            label={t('addDialog.valueLabel')}
            placeholder={t('addDialog.valuePlaceholderInt')}
            value={value}
            step={1}
            onChange={(v) => {
              const strVal = String(v)
              if (strVal === '' || /^-?\d+$/.test(strVal)) setValue(strVal)
            }}
            error={formErrors.value}
          />
        )
      case "decimal":
        return (
          <HuemulField
            type="number"
            label={t('addDialog.valueLabel')}
            placeholder={t('addDialog.valuePlaceholderDecimal')}
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "date":
        return (
          <HuemulField
            type="date"
            label={t('addDialog.valueLabel')}
            placeholder={t('addDialog.valuePlaceholderDate')}
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "time":
        return (
          <HuemulField
            type="time"
            label={t('addDialog.valueLabel')}
            placeholder={t('addDialog.valuePlaceholderTime')}
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "datetime":
        return (
          <HuemulField
            type="datetime"
            label={t('addDialog.valueLabel')}
            placeholder={t('addDialog.valuePlaceholderDatetime')}
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "image":
        return (
          <HuemulField
            type="file"
            label={t('addDialog.imageLabel')}
            accept="image/*"
            disabled={isUploadingImage}
            onFileChange={(files) => {
              const file = files?.[0]
              if (file) {
                setSelectedFile(file)
                setValue(file.name)
              }
            }}
            description={!isUploadingImage
              ? t(entityType === "document" ? 'addDialog.imageUploadDescDocument' : 'addDialog.imageUploadDescTemplate')
              : undefined}
            error={formErrors.value}
          >
            {isUploadingImage && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('addDialog.uploadingImage')}</span>
              </div>
            )}
          </HuemulField>
        )
      default: // string, url
        return (
          <HuemulField
            type={dataType === "url" ? "url" : "text"}
            label={t('addDialog.valueLabel')}
            placeholder={t('addDialog.valuePlaceholderGeneric')}
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
    }
  }

  const isValid = fieldType === "existing"
    ? selectedCustomFieldId && selectedSource
    : newCustomFieldData.name && newCustomFieldData.data_type

  return (
    <HuemulDialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) closeDialog() }}
      title={t('addDialog.title')}
      description={entityType === "document"
        ? t('addDialog.descriptionDocument')
        : t('addDialog.descriptionTemplate')}
      icon={Plus}
      maxWidth="sm:max-w-[600px]"
      maxHeight="max-h-[90vh]"
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
            {selectedSource !== "inferred" && renderValueField()}
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
              onNameChange={(value) => handleNewCustomFieldInputChange("name", value)}
              onDescriptionChange={(value) => handleNewCustomFieldInputChange("description", value)}
              onDataTypeChange={(value) => handleNewCustomFieldInputChange("data_type", value)}
              onMascChange={(value) => handleNewCustomFieldInputChange("masc", value)}
              dataTypes={dataTypes}
              formatDataType={formatDataType}
              errors={formErrors}
              loadingDataTypes={loadingDataTypes}
            />
          </div>
        )}
      </div>
    </HuemulDialog>
  )
}
