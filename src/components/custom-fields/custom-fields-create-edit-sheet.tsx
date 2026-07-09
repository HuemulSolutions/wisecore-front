"use client"

import { useState, useEffect } from "react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { PenLine, Plus } from "lucide-react"
import CustomFieldFormFields from "@/components/custom-fields/custom-fields-form-fields"
import { useTranslation } from "react-i18next"

import { useCustomFieldDataTypes } from "@/hooks/useCustomFields"
import type { CreateEditCustomFieldDialogProps, CustomFieldOption } from '@/types/custom-fields'

export type { CreateEditCustomFieldDialogProps } from '@/types/custom-fields'

export function CreateEditCustomFieldSheet({
  open,
  onOpenChange,
  customField,
  onSuccess,
  customFieldMutations,
}: CreateEditCustomFieldDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    data_type: "",
    masc: "",
    options: [] as CustomFieldOption[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!customField
  const { t } = useTranslation('custom-fields')

  // Fetch data types (lazy loading: only when sheet is open)
  const { data: dataTypesResponse, isLoading: loadingDataTypes } = useCustomFieldDataTypes({ enabled: open })
  const dataTypes = dataTypesResponse?.data || []

  // Reset form when sheet opens/closes or customField changes
  useEffect(() => {
    if (open) {
      if (customField) {
        setFormData({
          name: customField.name,
          description: customField.description,
          data_type: customField.data_type,
          masc: customField.masc || "",
          options: customField.data_type === 'list' ? (customField.default_value ?? []) : [],
        })
      } else {
        setFormData({
          name: "",
          description: "",
          data_type: "",
          masc: "",
          options: [],
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

    if (!formData.data_type) {
      newErrors.data_type = t('form.dataTypeRequired')
    }

    if (formData.data_type === 'list') {
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
            data_type: formData.data_type,
            masc: formData.masc || undefined,
            ...(formData.data_type === 'list' && { default_value: formData.options }),
          },
        })
        onSuccess()
      } else {
        const created = await customFieldMutations.create.mutateAsync({
          name: formData.name,
          description: formData.description,
          data_type: formData.data_type,
          masc: formData.masc || "",
          ...(formData.data_type === 'list' && { default_value: formData.options }),
        })
        onSuccess(created)
      }
    } catch (error) {
      console.error("Error submitting custom field:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'data_type' && value !== 'list' ? { options: [] } : {}),
    }))
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

  const formatDataType = (dataType: string) => {
    return t(`dataTypes.${dataType}` as Parameters<typeof t>[0], { defaultValue: dataType })
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? t('editDialog.title') : t('createDialog.title')}
      description={
        isEditing
          ? t('editDialog.description')
          : t('createDialog.description')
      }
      icon={isEditing ? PenLine : Plus}
      maxWidth="sm:max-w-lg"
      cancelLabel={t('common:cancel', 'Cancel')}
      saveAction={{
        label: isEditing ? t('editDialog.saveLabel') : t('createDialog.saveLabel'),
        onClick: handleSave,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-4">
        <CustomFieldFormFields
          name={formData.name}
          description={formData.description}
          dataType={formData.data_type}
          masc={formData.masc}
          options={formData.options}
          onNameChange={(value) => handleInputChange("name", value)}
          onDescriptionChange={(value) => handleInputChange("description", value)}
          onDataTypeChange={(value) => handleInputChange("data_type", value)}
          onMascChange={(value) => handleInputChange("masc", value)}
          onOptionsChange={handleOptionsChange}
          dataTypes={dataTypes}
          formatDataType={formatDataType}
          errors={errors}
          disabled={isSubmitting}
          loadingDataTypes={loadingDataTypes}
        />
      </div>
    </HuemulSheet>
  )
}
