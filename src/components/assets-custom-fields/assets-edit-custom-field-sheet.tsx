"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Edit2, FileEdit } from "lucide-react"
import { getCustomFieldDocumentSources, uploadCustomFieldDocumentValueBlob } from "@/services/custom-fieldds-documents"
import { useOrganization } from "@/contexts/organization-context"
import { useQuery } from "@tanstack/react-query"
import { CustomFieldValueField } from "@/components/custom-fields/custom-field-value-field"
import { CustomFieldInfoCard } from "@/components/custom-fields/custom-field-info-card"
import type { CustomFieldDocument } from '@/types/custom-fields'
import type { EditCustomFieldAssetDialogProps } from '@/types/assets'
export type { EditCustomFieldAssetDialogProps } from '@/types/assets'

export function EditCustomFieldAssetSheet({
  isOpen,
  onClose,
  customFieldDocument,
  onUpdate,
  mode = "configuration",
}: EditCustomFieldAssetDialogProps) {
  const { t } = useTranslation(['custom-fields', 'common'])
  const [selectedSource, setSelectedSource] = useState<string>("")
  const [isRequired, setIsRequired] = useState(false)
  const [prompt, setPrompt] = useState<string>("")
  const [value, setValue] = useState<string>("")
  const [, setSelectedFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { selectedOrganizationId } = useOrganization()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch custom field document sources
  const { data: sources = [], isLoading: isLoadingSources } = useQuery({
    queryKey: ['custom-field-document-sources'],
    queryFn: async () => {
      const response = await getCustomFieldDocumentSources();
      return response.data;
    }
  });

  // Reset form when sheet opens/closes or customFieldDocument changes
  useEffect(() => {
    if (isOpen && customFieldDocument) {
      setSelectedSource(customFieldDocument.source || "")
      setIsRequired(customFieldDocument.required || false)
      setPrompt(customFieldDocument.prompt || "")
      setValue(getValueForDataType(customFieldDocument))
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
  }, [isOpen, customFieldDocument])

  const getValueForDataType = (document: CustomFieldDocument) => {
    const dataType = document.data_type
    switch (dataType) {
      case "bool":
        return document.value_bool !== null ? document.value_bool.toString() : ""
      case "int":
        return document.value_number !== null ? document.value_number.toString() : ""
      case "decimal":
        return document.value_number !== null ? document.value_number.toString() : ""
      case "date":
        return document.value_date || ""
      case "time":
        return document.value_time || ""
      case "datetime":
        return document.value_datetime || ""
      case "url":
        return document.value_url || ""
      case "image":
        return "" // Images are handled separately via blob upload
      case "list":
        return document.value_identifier || ""
      default:
        return document.value || ""
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Only validate source in configuration mode
    if (mode === "configuration" && !selectedSource) {
      newErrors.source = t('editValueDialog.sourceRequired')
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (file: File) => {
    if (!customFieldDocument) return

    setIsUploadingImage(true)
    try {
      await uploadCustomFieldDocumentValueBlob(customFieldDocument.id, file, selectedOrganizationId!)
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
    if (!customFieldDocument) return

    if (!validateForm()) {
      return
    }

    try {
      // Build document data based on mode
      const documentData = mode === "content"
        ? {
            // Only update the value and required in content mode
            required: isRequired,
            ...getValuePayload(),
          }
        : {
            // Update full configuration in configuration mode
            source: selectedSource,
            required: isRequired,
            prompt: prompt.trim() || undefined,
            ...getValuePayload(),
          }

      onUpdate(customFieldDocument.id, documentData)
      closeSheet()
    } catch (error) {
      console.error("Error updating custom field document:", error)
    }
  }

  const getValuePayload = () => {
    if (!customFieldDocument || !value.trim()) return {}

    const dataType = customFieldDocument.data_type
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

  if (!customFieldDocument) {
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
        title: t('editValueDialog.titleDocument'),
        description: t('editValueDialog.descriptionDocument'),
        icon: Edit2,
        submitLabel: t('editValueDialog.submitLabelDocument'),
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
          name={customFieldDocument.name}
          dataType={customFieldDocument.data_type}
          description={customFieldDocument.description}
          formatDataType={formatDataType}
        />

        {/* Custom Field Configuration - Only show in configuration mode */}
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
                dataType={customFieldDocument.data_type}
                label={t('editValueDialog.valueOptionalLabel')}
                value={value}
                onChange={setValue}
                options={customFieldDocument.options ?? []}
                error={formErrors.value}
                isUploadingImage={isUploadingImage}
                imageUploadDescription={t('addDialog.imageUploadDescDocument')}
                onImageFile={(file) => { setSelectedFile(file); handleImageUpload(file) }}
                onImageValidationError={(message) => setFormErrors(prev => ({ ...prev, value: message }))}
              />
            )}

            {/* Required */}
            <HuemulField
              type="switch"
              label={t('addDialog.requiredField')}
              description={t('addDialog.requiredFieldDescDocument')}
              value={isRequired}
              onChange={(v) => setIsRequired(Boolean(v))}
              labelFirst
            />
          </div>
        )}

        {/* Content mode */}
        {mode === "content" && (
          <div className="space-y-4">
            <CustomFieldValueField
              dataType={customFieldDocument.data_type}
              label={t('addDialog.valueLabel')}
              value={value}
              onChange={setValue}
              options={customFieldDocument.options ?? []}
              error={formErrors.value}
              isUploadingImage={isUploadingImage}
              imageUploadDescription={t('addDialog.imageUploadDescDocument')}
              onImageFile={(file) => { setSelectedFile(file); handleImageUpload(file) }}
              onImageValidationError={(message) => setFormErrors(prev => ({ ...prev, value: message }))}
            />
            <HuemulField
              type="switch"
              label={t('addDialog.requiredField')}
              description={t('addDialog.requiredFieldDescDocument')}
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
