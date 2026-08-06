"use client"

import { useState, useEffect, useMemo } from "react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import CustomFieldFormFields from "@/components/custom-fields/custom-fields-form-fields"
import { useTranslation } from "react-i18next"

import { useCustomFieldQuestionTypes } from "@/hooks/useCustomFields"
import {
  questionTypeLabel,
  readFieldConfig,
  QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
} from "@/components/sections/question-type-meta"
import type { CreateEditCustomFieldDialogProps, CustomFieldOption } from '@/types/custom-fields'
import { logger } from "@/lib/logger"
import type { FormFieldConfig } from '@/types/sections/core'

export type { CreateEditCustomFieldDialogProps } from '@/types/custom-fields'

export function CreateEditCustomFieldSheet({
  open,
  onOpenChange,
  customField,
  onSuccess,
  customFieldMutations,
}: CreateEditCustomFieldDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    masc: "",
    question_type: "",
    options: [] as CustomFieldOption[],
    min_value: null as number | null,
    max_value: null as number | null,
    config: {} as FormFieldConfig,
    required: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!customField
  const { t } = useTranslation('custom-fields')
  const { t: tSections } = useTranslation('sections')

  // Fetch question types (lazy loading: only when sheet is open). data_type is derived from this catalog.
  // "etiqueta" es un separador visual exclusivo de form fields de sección — no se puede crear
  // como custom field suelto, se excluye del catálogo ofrecido acá.
  const { data: questionTypesResponse, isLoading: loadingQuestionTypes } = useCustomFieldQuestionTypes({ enabled: open })
  const questionTypes = useMemo(
    () => (questionTypesResponse?.data ?? []).filter((qt) => qt.question_type !== QUESTION_TYPE.label),
    [questionTypesResponse],
  )
  const questionTypeDataMap = useMemo(
    () => new Map(questionTypes.map((qt) => [qt.question_type, qt.data_type])),
    [questionTypes],
  )
  // Legacy custom fields created before this change may have question_type: null —
  // fall back to the stored data_type so their conditional UI (options/mask) still works.
  const dataType = questionTypeDataMap.get(formData.question_type) ?? customField?.data_type ?? ""

  // Reset form when sheet opens/closes or customField changes
  useEffect(() => {
    if (open) {
      if (customField) {
        setFormData({
          name: customField.name,
          description: customField.description,
          masc: customField.masc || "",
          question_type: customField.question_type || "",
          options: customField.data_type === 'list' ? ((customField.default_value as CustomFieldOption[]) ?? []) : [],
          min_value: typeof customField.min_value === 'number' ? customField.min_value : null,
          max_value: typeof customField.max_value === 'number' ? customField.max_value : null,
          config: readFieldConfig(customField),
          required: customField.required,
        })
      } else {
        setFormData({
          name: "",
          description: "",
          masc: "",
          question_type: "",
          options: [],
          min_value: null,
          max_value: null,
          config: {},
          required: false,
        })
      }
      setErrors({})
    }
  }, [open, customField])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('form.nameRequired')
    } else if (formData.name.length > 255) {
      newErrors.name = t('form.nameTooLong')
    }

    if (formData.description.length > 1000) {
      newErrors.description = t('form.descriptionTooLong')
    }

    // question_type is only mandatory when creating; legacy fields (question_type: null)
    // can still be edited without picking one — the stored data_type is preserved.
    if (!isEditing && !formData.question_type) {
      newErrors.question_type = t('form.questionTypeRequired')
    }

    if (dataType === 'list') {
      if (formData.options.length === 0) {
        newErrors.options = t('form.optionsRequired')
      } else {
        formData.options.forEach((opt, i) => {
          if (!opt.id.trim()) {
            newErrors[`option_${i}_id`] = t('form.optionIdRequired')
          }
          if (!opt.label.trim()) {
            newErrors[`option_${i}_name`] = t('form.optionNameRequired')
          }
        })
      }
    }

    // Numeric range (respuesta_numerica/decimal) and linear scale share min_value/max_value —
    // only flag when both bounds are set and inverted.
    const usesMinMax = NUMERIC_DATA_TYPES.includes(dataType) || formData.question_type === QUESTION_TYPE.linearScale
    if (formData.question_type === QUESTION_TYPE.linearScale && (formData.min_value === null || formData.max_value === null)) {
      newErrors.min_value = t('form.minMaxInvalid')
    } else if (usesMinMax && formData.min_value !== null && formData.max_value !== null && formData.min_value > formData.max_value) {
      newErrors.min_value = t('form.minMaxInvalid')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Config específica por question_type — mismo modelo de datos que los form fields de sección:
  // numérico → min/max; escala lineal → min/max + etiquetas en default_value; calificación →
  // estrellas en max_value; carga de archivos → allowed_types/max_size_mb en default_value;
  // lista → opciones en default_value (ya existía).
  const getTypeSpecificPayload = () => {
    if (dataType === 'list') {
      return { default_value: formData.options }
    }
    if (formData.question_type === QUESTION_TYPE.linearScale) {
      return {
        min_value: formData.min_value,
        max_value: formData.max_value,
        default_value: { min_label: formData.config.min_label, max_label: formData.config.max_label },
      }
    }
    if (formData.question_type === QUESTION_TYPE.rating) {
      return { max_value: formData.max_value }
    }
    if (formData.question_type === QUESTION_TYPE.fileUpload) {
      return {
        default_value: {
          allowed_types: formData.config.allowed_types ?? [],
          max_size_mb: formData.config.max_size_mb ?? 10,
        },
      }
    }
    if (NUMERIC_DATA_TYPES.includes(dataType)) {
      return { min_value: formData.min_value, max_value: formData.max_value }
    }
    return {}
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && customField) {
        await customFieldMutations.update.mutateAsync({
          id: customField.id,
          data: {
            name: formData.name,
            description: formData.description,
            masc: formData.masc || undefined,
            required: formData.required,
            // Partial PATCH: only send question_type if the user picked one, so legacy
            // fields (question_type: null) keep their existing data_type untouched.
            ...(formData.question_type && { question_type: formData.question_type }),
            ...getTypeSpecificPayload(),
          },
        })
        onSuccess()
      } else {
        const created = await customFieldMutations.create.mutateAsync({
          name: formData.name,
          description: formData.description,
          masc: formData.masc || "",
          question_type: formData.question_type,
          required: formData.required,
          ...getTypeSpecificPayload(),
        })
        onSuccess(created)
      }
    } catch (error) {
      logger.error("Error submitting custom field:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'question_type') {
        const newDataType = questionTypeDataMap.get(value) ?? customField?.data_type ?? ""
        // Drop config that no longer applies to the newly chosen type — same pattern for
        // options/min-max/config, mirrors the form-fields section builder's type-switch reset.
        if (newDataType !== 'list') {
          next.options = []
        }
        if (!NUMERIC_DATA_TYPES.includes(newDataType) && value !== QUESTION_TYPE.linearScale) {
          next.min_value = null
          next.max_value = null
        }
        // La escala lineal y la calificación por estrellas muestran un default en el
        // select (1/5), pero ese default es solo visual — si no se inicializa el estado
        // real, el payload sale con min_value/max_value null y el backend lo rechaza.
        if (value === QUESTION_TYPE.linearScale) {
          if (next.min_value === null) next.min_value = 1
          if (next.max_value === null) next.max_value = 5
        }
        if (value === QUESTION_TYPE.rating && next.max_value === null) {
          next.max_value = 5
        }
        if (value !== QUESTION_TYPE.linearScale && value !== QUESTION_TYPE.fileUpload) {
          next.config = {}
        }
      }
      return next
    })
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleOptionsChange = (options: CustomFieldOption[]) => {
    setFormData(prev => ({ ...prev, options }))
    if (errors.options) {
      setErrors(prev => ({ ...prev, options: "" }))
    }
  }

  const handleNumericChange = (field: 'min_value' | 'max_value', value: number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors.min_value) {
      setErrors(prev => ({ ...prev, min_value: "" }))
    }
  }

  const handleConfigChange = (patch: Partial<FormFieldConfig>) => {
    setFormData(prev => ({ ...prev, config: { ...prev.config, ...patch } }))
  }

  const handleRequiredChange = (value: boolean) => {
    setFormData(prev => ({ ...prev, required: value }))
  }

  const formatQuestionType = (questionType: string) => questionTypeLabel(questionType, tSections)

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEditing && customField ? customField.name : t('createDialog.title')}
        eyebrow={t('form.eyebrow')}
        description={isEditing ? undefined : t('createDialog.description')}
        maxWidth="sm:max-w-xl"
        cancelLabel={t('common:cancel', 'Cancel')}
        saveAction={{
          label: isEditing ? t('editDialog.saveLabel') : t('createDialog.saveLabel'),
          icon: isEditing ? undefined : Plus,
          onClick: handleSave,
          closeOnSuccess: false,
        }}
        footerLeft={isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {t('actions.deleteCustomField')}
          </Button>
        ) : undefined}
      >
        <div className="space-y-4">
          <CustomFieldFormFields
            name={formData.name}
            description={formData.description}
            dataType={dataType}
            masc={formData.masc}
            questionType={formData.question_type}
            options={formData.options}
            minValue={formData.min_value}
            maxValue={formData.max_value}
            config={formData.config}
            required={formData.required}
            onNameChange={(value) => handleInputChange("name", value)}
            onDescriptionChange={(value) => handleInputChange("description", value)}
            onMascChange={(value) => handleInputChange("masc", value)}
            onQuestionTypeChange={(value) => handleInputChange("question_type", value)}
            onOptionsChange={handleOptionsChange}
            onMinValueChange={(value) => handleNumericChange('min_value', value)}
            onMaxValueChange={(value) => handleNumericChange('max_value', value)}
            onConfigChange={handleConfigChange}
            onRequiredChange={handleRequiredChange}
            questionTypes={questionTypes}
            formatQuestionType={formatQuestionType}
            errors={errors}
            disabled={isSubmitting}
            loadingQuestionTypes={loadingQuestionTypes}
          />
        </div>
      </HuemulSheet>

      {isEditing && (
        <HuemulAlertDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('deleteDialog.title')}
          description={t('deleteDialog.description')}
          actionLabel={t('actions.deleteCustomField')}
          actionIcon={Trash2}
          onAction={async () => {
            await customFieldMutations.delete.mutateAsync(customField!.id)
            onOpenChange(false)
          }}
        />
      )}
    </>
  )
}
