"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Edit2, FileEdit } from "lucide-react"
import { useCustomFieldTemplateSources } from "@/hooks/useCustomFieldTemplates"
import { uploadCustomFieldTemplateValueBlob } from "@/services/custom-fields-templates"
import { useOrganization } from "@/contexts/organization-context"
import { CustomFieldValueField } from "@/components/custom-fields/custom-field-value-field"
import { CustomFieldInfoCard } from "@/components/custom-fields/custom-field-info-card"
import { validateCustomFieldValue } from "@/components/custom-fields/custom-field-value-validation"
import type { CustomFieldTemplate } from '@/types/custom-fields';
import type { EditCustomFieldTemplateDialogProps } from '@/types/templates';
export type { EditCustomFieldTemplateDialogProps } from '@/types/templates';

export function EditCustomFieldTemplateSheet({
  isOpen,
  onClose,
  customFieldTemplate,
  onUpdate,
  mode = "configuration",
}: EditCustomFieldTemplateDialogProps) {
  const { t } = useTranslation(['custom-fields', 'common'])
  const [selectedSource, setSelectedSource] = useState<string>("")
  const [isRequired, setIsRequired] = useState(false)
  const [prompt, setPrompt] = useState<string>("")
  const [value, setValue] = useState<string>("")
  const [, setSelectedFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { selectedOrganizationId } = useOrganization()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch custom field template sources
  const {
    data: sources = [],
    isLoading: isLoadingSources,
  } = useCustomFieldTemplateSources()

  // Reset form when sheet opens/closes or customFieldTemplate changes
  useEffect(() => {
    if (isOpen && customFieldTemplate) {
      setSelectedSource(customFieldTemplate.source || "")
      setIsRequired(customFieldTemplate.required || false)
      setPrompt(customFieldTemplate.prompt || "")
      setValue(getValueForDataType(customFieldTemplate))
      setSelectedFile(null)
      setFormErrors({})
    } else if (!isOpen) {
      // Reset form when sheet closes
      setSelectedSource("")
      setIsRequired(false)
      setPrompt("")
      setValue("")
      setSelectedFile(null)
      setFormErrors({})
    }
  }, [isOpen, customFieldTemplate])

  const handleValueChange = (v: string) => {
    setValue(v)
    if (formErrors.value) setFormErrors(prev => ({ ...prev, value: "" }))
  }

  const getValueForDataType = (template: CustomFieldTemplate) => {
    const dataType = template.data_type
    switch (dataType) {
      case "bool":
        return template.value_bool !== null ? template.value_bool.toString() : ""
      case "int":
        return template.value_number !== null ? template.value_number.toString() : ""
      case "decimal":
        return template.value_number !== null ? template.value_number.toString() : ""
      case "date":
        return template.value_date || ""
      case "time":
        return template.value_time || ""
      case "datetime":
        return template.value_datetime || ""
      case "url":
        return template.value_url || ""
      case "image":
        return "" // Images are handled separately via blob upload
      case "list":
        return template.value_identifier || template.value || ""
      default:
        return template.value_string || ""
    }
  }

  const validateForm = () => {
    if (!customFieldTemplate) return false

    const newErrors: Record<string, string> = {}

    // Only validate source in configuration mode
    if (mode === "configuration" && !selectedSource) {
      newErrors.source = t('editValueDialog.sourceRequired')
    }

    const valueVisible = mode === "content" || selectedSource !== "inferred"
    if (valueVisible) {
      const valueError = validateCustomFieldValue({
        dataType: customFieldTemplate.data_type,
        value,
        required: isRequired,
        t,
      })
      if (valueError) newErrors.value = valueError
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (file: File) => {
    if (!customFieldTemplate) return

    setIsUploadingImage(true)
    try {
      await uploadCustomFieldTemplateValueBlob(customFieldTemplate.id, file, selectedOrganizationId!)
    } catch (error) {
      console.error("Error uploading image:", error)
      setFormErrors(prev => ({ ...prev, value: t('addDialog.uploadFailed') }))
    } finally {
      setIsUploadingImage(false)
    }
  }

  const resetForm = () => {
    setSelectedSource("")
    setIsRequired(false)
    setPrompt("")
    setValue("")
    setSelectedFile(null)
    setFormErrors({})
  }

  const closeSheet = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!customFieldTemplate) return

    if (!validateForm()) {
      return
    }

    try {
      // Build template data based on mode
      const templateData = mode === "content"
        ? {
            // Only update the value in content mode
            ...getValuePayload(),
          }
        : {
            // Update full configuration in configuration mode
            source: selectedSource,
            required: isRequired,
            prompt: prompt.trim() || undefined,
            ...getValuePayload(),
          }

      onUpdate(customFieldTemplate.id, templateData)
      closeSheet()
    } catch (error) {
      console.error("Error updating custom field template:", error)
    }
  }

  const getValuePayload = () => {
    if (!customFieldTemplate || !value.trim()) return {}

    const dataType = customFieldTemplate.data_type
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

  const formatDataType = (dataType: string) => {
    return t(`dataTypes.${dataType}` as Parameters<typeof t>[0], { defaultValue: dataType })
  }

  const isValid = mode === "content" ? true : !!selectedSource

  if (!customFieldTemplate) {
    return null
  }

  // Dynamic sheet configuration based on mode
  const sheetConfig = mode === "content"
    ? {
        title: t('editValueDialog.titleContent'),
        description: t('editValueDialog.descriptionContent'),
        icon: FileEdit,
        submitLabel: t('editValueDialog.submitLabelContent'),
      }
    : {
        title: t('editValueDialog.titleTemplate'),
        description: t('editValueDialog.descriptionTemplate'),
        icon: Edit2,
        submitLabel: t('editValueDialog.submitLabelTemplate'),
      }

  return (
    <HuemulSheet
      open={isOpen}
      onOpenChange={(open) => { if (!open) closeSheet() }}
      title={sheetConfig.title}
      description={sheetConfig.description}
      icon={sheetConfig.icon}
      maxWidth="sm:max-w-lg"
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: sheetConfig.submitLabel,
        onClick: handleSubmit,
        disabled: !isValid,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-6">
        {/* Custom Field Info (Read-only) */}
        <CustomFieldInfoCard
          title={t('editValueDialog.infoCardTitle')}
          name={customFieldTemplate.name}
          dataType={customFieldTemplate.data_type}
          description={customFieldTemplate.description}
          formatDataType={formatDataType}
        />

        {/* Template Configuration - Only show in configuration mode */}
        {mode === "configuration" && (
          <div className="space-y-4">
            {/* Source */}
            <HuemulField
              type="radio"
              label={t('addDialog.valueSource')}
              required
              value={selectedSource}
              onChange={(v) => setSelectedSource(String(v))}
              disabled={isLoadingSources}
              options={sources.map((source) => ({
                label: source.charAt(0).toUpperCase() + source.slice(1),
                value: source,
              }))}
              error={formErrors.source}
            />

            {/* Prompt - only show when source is inferred */}
            {selectedSource === "inferred" && (
              <HuemulField
                type="textarea"
                label={t('addDialog.promptLabel')}
                placeholder={t('addDialog.promptPlaceholder')}
                rows={3}
                value={prompt}
                onChange={(v) => setPrompt(String(v))}
              />
            )}

            {/* Value - only show when source is not inferred */}
            {selectedSource !== "inferred" && (
              <CustomFieldValueField
                dataType={customFieldTemplate.data_type}
                label={t('editValueDialog.valueOptionalLabel')}
                value={value}
                onChange={handleValueChange}
                options={customFieldTemplate.options ?? []}
                error={formErrors.value}
                isUploadingImage={isUploadingImage}
                imageUploadDescription={t('addDialog.imageUploadDescTemplate')}
                onImageFile={(file) => { setSelectedFile(file); handleImageUpload(file) }}
                onImageValidationError={(message) => setFormErrors(prev => ({ ...prev, value: message }))}
              />
            )}

            {/* Required */}
            <HuemulField
              type="switch"
              label={t('addDialog.requiredField')}
              description={t('addDialog.requiredFieldDescTemplate')}
              value={isRequired}
              onChange={(v) => setIsRequired(Boolean(v))}
              labelFirst
            />
          </div>
        )}

        {/* Value Field - Only show in content mode */}
        {mode === "content" && (
          <div className="space-y-4">
            <CustomFieldValueField
              dataType={customFieldTemplate.data_type}
              label={t('addDialog.valueLabel')}
              value={value}
              onChange={handleValueChange}
              options={customFieldTemplate.options ?? []}
              error={formErrors.value}
              isUploadingImage={isUploadingImage}
              imageUploadDescription={t('addDialog.imageUploadDescTemplate')}
              onImageFile={(file) => { setSelectedFile(file); handleImageUpload(file) }}
              onImageValidationError={(message) => setFormErrors(prev => ({ ...prev, value: message }))}
            />
            <HuemulField
              type="switch"
              label={t('addDialog.requiredField')}
              description={t('addDialog.requiredFieldDescTemplate')}
              value={isRequired}
              onChange={(v) => setIsRequired(Boolean(v))}
              labelFirst
            />
          </div>
        )}
      </div>
    </HuemulSheet>
  )
}
