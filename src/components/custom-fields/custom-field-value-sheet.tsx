"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Edit2, FileEdit } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useCustomField } from "@/hooks/useCustomFields"
import { CustomFieldValueField } from "@/components/custom-fields/custom-field-value-field"
import { CustomFieldInfoCard } from "@/components/custom-fields/custom-field-info-card"
import { validateCustomFieldValue } from "@/components/custom-fields/custom-field-value-validation"
import { QUESTION_TYPE } from "@/components/sections/question-type-meta"
import { logger } from "@/lib/logger"
import type { CustomFieldTemplate, CustomFieldDocument, CustomFieldOption } from "@/types/custom-fields"

type CustomFieldValueEntity = CustomFieldTemplate | CustomFieldDocument

export interface CustomFieldValueSheetProps {
  isOpen: boolean
  onClose: () => void
  entity: CustomFieldValueEntity | null
  entityType: "template" | "document"
  onUpdate: (id: string, data: unknown) => void
  mode?: "content" | "configuration"
  sources: string[]
  isLoadingSources: boolean
  uploadImageFn: (entityCustomFieldId: string, file: File, organizationId: string) => Promise<void>
}

// Sheet de edición de valor de custom field, compartido entre templates y assets
// (documents). Ambas entidades comparten la misma forma de valor tipado por
// data_type — solo difieren los textos i18n (Template/Document) y el endpoint de
// blob de imagen, resueltos vía `entityType`. Mismo patrón que
// custom-fields/add-custom-field-sheet.tsx (entityType + uploadImageFn + sources).
export function CustomFieldValueSheet({
  isOpen,
  onClose,
  entity,
  entityType,
  onUpdate,
  mode = "configuration",
  sources,
  isLoadingSources,
  uploadImageFn,
}: CustomFieldValueSheetProps) {
  const { t } = useTranslation(['custom-fields', 'common'])
  const [selectedSource, setSelectedSource] = useState<string>("")
  const [isRequired, setIsRequired] = useState(false)
  const [prompt, setPrompt] = useState<string>("")
  const [value, setValue] = useState<string | string[]>("")
  const [, setSelectedFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { selectedOrganizationId } = useOrganization()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // La entity que entrega la lista (por template/asset) no trae question_type/
  // min_value/max_value/options poblados — esos solo vienen del detalle del custom
  // field. Sin esto, el sheet cae al fallback por data_type (ej. rating se ve como
  // caja numérica en vez de estrellas). Mismo dato que consume add-custom-field-sheet.tsx.
  const { data: customFieldDetail } = useCustomField(
    entity?.custom_field_id ?? "",
    isOpen && !!entity?.custom_field_id,
  )
  const effectiveQuestionType = customFieldDetail?.question_type ?? entity?.question_type
  const effectiveMinValue = typeof customFieldDetail?.min_value === "number"
    ? customFieldDetail.min_value
    : entity?.min_value
  const effectiveMaxValue = typeof customFieldDetail?.max_value === "number"
    ? customFieldDetail.max_value
    : entity?.max_value
  const effectiveOptions = entity?.data_type === "list"
    ? ((customFieldDetail?.default_value as CustomFieldOption[] | null) ?? entity?.options ?? [])
    : (entity?.options ?? [])
  const scaleLabels = effectiveQuestionType === QUESTION_TYPE.linearScale
    ? (customFieldDetail?.default_value as { min_label?: string; max_label?: string } | null)
    : null

  const getValueForDataType = (entity: CustomFieldValueEntity): string | string[] => {
    const dataType = entity.data_type
    if (dataType === "list" && entity.question_type === QUESTION_TYPE.dropdownMultiple) {
      return entity.value_list ?? []
    }
    switch (dataType) {
      case "bool":
        return entity.value_bool !== null ? entity.value_bool.toString() : ""
      case "int":
      case "decimal":
        return entity.value_number !== null ? entity.value_number.toString() : ""
      case "date":
        // El backend a veces devuelve fecha+hora; el input/payload de fecha solo
        // acepta YYYY-MM-DD.
        return (entity.value_date || "").split("T")[0]
      case "time":
        return entity.value_time || ""
      case "datetime":
        return entity.value_datetime || ""
      case "url":
        return entity.value_url || ""
      case "image":
        return "" // Las imágenes se gestionan aparte vía blob upload
      case "list":
        return entity.value_identifier || entity.value || ""
      default:
        return entity.value_string || entity.value || ""
    }
  }

  // Reset form when sheet opens/closes or entity changes
  useEffect(() => {
    if (isOpen && entity) {
      setSelectedSource(entity.source || "")
      setIsRequired(entity.required || false)
      setPrompt(entity.prompt || "")
      setValue(getValueForDataType(entity))
      setSelectedFile(null)
      setFormErrors({})
    } else if (!isOpen) {
      setSelectedSource("")
      setIsRequired(false)
      setPrompt("")
      setValue("")
      setSelectedFile(null)
      setFormErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entity])

  const handleValueChange = (v: string | string[]) => {
    setValue(v)
    if (formErrors.value) setFormErrors(prev => ({ ...prev, value: "" }))
  }

  const validateForm = () => {
    if (!entity) return false

    const newErrors: Record<string, string> = {}

    // Only validate source in configuration mode
    if (mode === "configuration" && !selectedSource) {
      newErrors.source = t('editValueDialog.sourceRequired')
    }

    const valueVisible = mode === "content" || selectedSource !== "inferred"
    if (valueVisible) {
      const valueError = validateCustomFieldValue({
        dataType: entity.data_type,
        questionType: effectiveQuestionType,
        value,
        required: isRequired,
        minValue: effectiveMinValue,
        maxValue: effectiveMaxValue,
        t,
      })
      if (valueError) newErrors.value = valueError
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (file: File) => {
    if (!entity) return

    setIsUploadingImage(true)
    try {
      await uploadImageFn(entity.id, file, selectedOrganizationId!)
    } catch (error) {
      logger.error("Error uploading image:", error)
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

  const getValuePayload = () => {
    if (!entity) return {}
    if (Array.isArray(value)) {
      return value.length === 0 ? {} : { value }
    }
    if (!value.trim()) return {}

    switch (entity.data_type) {
      case "bool":
        return { value: value === "true" || value === "1" }
      case "int": {
        const intValue = parseInt(value)
        return isNaN(intValue) ? {} : { value: intValue }
      }
      case "decimal": {
        const decimalValue = parseFloat(value)
        return isNaN(decimalValue) ? {} : { value: decimalValue }
      }
      case "date":
        // El backend exige YYYY-MM-DD estricto; recortar cualquier componente de hora.
        return { value: value.split("T")[0] }
      case "image":
        return {} // Las imágenes se gestionan vía blob upload
      default:
        return { value }
    }
  }

  const handleSubmit = async () => {
    if (!entity) return

    if (!validateForm()) {
      return
    }

    try {
      const entityData = mode === "content"
        ? {
            // En modo contenido solo se actualiza el valor (+ required, que también
            // se muestra ahí).
            required: isRequired,
            ...getValuePayload(),
          }
        : {
            // Modo configuración: actualiza la configuración completa.
            source: selectedSource,
            required: isRequired,
            prompt: prompt.trim() || undefined,
            ...getValuePayload(),
          }

      onUpdate(entity.id, entityData)
      closeSheet()
    } catch (error) {
      logger.error(`Error updating custom field ${entityType}:`, error)
    }
  }

  const formatDataType = (dataType: string) => {
    return t(`dataTypes.${dataType}` as Parameters<typeof t>[0], { defaultValue: dataType })
  }

  const isValid = mode === "content" ? true : !!selectedSource

  if (!entity) {
    return null
  }

  const sheetConfig = mode === "content"
    ? {
        title: t('editValueDialog.titleContent'),
        description: t('editValueDialog.descriptionContent'),
        icon: FileEdit,
        submitLabel: t('editValueDialog.submitLabelContent'),
      }
    : {
        title: entityType === "document" ? t('editValueDialog.titleDocument') : t('editValueDialog.titleTemplate'),
        description: entityType === "document" ? t('editValueDialog.descriptionDocument') : t('editValueDialog.descriptionTemplate'),
        icon: Edit2,
        submitLabel: entityType === "document" ? t('editValueDialog.submitLabelDocument') : t('editValueDialog.submitLabelTemplate'),
      }

  const imageUploadDescription = entityType === "document"
    ? t('addDialog.imageUploadDescDocument')
    : t('addDialog.imageUploadDescTemplate')
  const requiredFieldDescription = entityType === "document"
    ? t('addDialog.requiredFieldDescDocument')
    : t('addDialog.requiredFieldDescTemplate')

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
          name={entity.name}
          dataType={entity.data_type}
          description={entity.description}
          formatDataType={formatDataType}
        />

        {/* Configuration - Only shown in configuration mode */}
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
                label: t(`sources.${source}`, { defaultValue: source }),
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
                dataType={entity.data_type}
                questionType={effectiveQuestionType}
                label={t('editValueDialog.valueOptionalLabel')}
                value={value}
                onChange={handleValueChange}
                options={effectiveOptions}
                minValue={effectiveMinValue}
                maxValue={effectiveMaxValue}
                minLabel={scaleLabels?.min_label}
                maxLabel={scaleLabels?.max_label}
                error={formErrors.value}
                isUploadingImage={isUploadingImage}
                imageUploadDescription={imageUploadDescription}
                onImageFile={(file) => { setSelectedFile(file); handleImageUpload(file) }}
                onImageValidationError={(message) => setFormErrors(prev => ({ ...prev, value: message }))}
              />
            )}

            {/* Required */}
            <HuemulField
              type="switch"
              label={t('addDialog.requiredField')}
              description={requiredFieldDescription}
              value={isRequired}
              onChange={(v) => setIsRequired(Boolean(v))}
              labelFirst
            />
          </div>
        )}

        {/* Value Field - Only shown in content mode */}
        {mode === "content" && (
          <div className="space-y-4">
            <CustomFieldValueField
              dataType={entity.data_type}
              questionType={effectiveQuestionType}
              label={t('addDialog.valueLabel')}
              value={value}
              onChange={handleValueChange}
              options={effectiveOptions}
              minValue={effectiveMinValue}
              maxValue={effectiveMaxValue}
              minLabel={scaleLabels?.min_label}
              maxLabel={scaleLabels?.max_label}
              error={formErrors.value}
              isUploadingImage={isUploadingImage}
              imageUploadDescription={imageUploadDescription}
              onImageFile={(file) => { setSelectedFile(file); handleImageUpload(file) }}
              onImageValidationError={(message) => setFormErrors(prev => ({ ...prev, value: message }))}
            />
            <HuemulField
              type="switch"
              label={t('addDialog.requiredField')}
              description={requiredFieldDescription}
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
