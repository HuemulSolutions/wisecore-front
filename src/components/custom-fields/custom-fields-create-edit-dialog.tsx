"use client"

import { useState, useEffect } from "react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { PenLine, Plus } from "lucide-react"
import CustomFieldFormFields from "@/components/custom-fields/custom-fields-form-fields"
import { useTranslation } from "react-i18next"

import type { CustomField } from "@/types/custom-fields"
import type { useCustomFieldMutations } from "@/hooks/useCustomFields"
import { useCustomFieldDataTypes } from "@/hooks/useCustomFields"

interface CreateEditCustomFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customField: CustomField | null
  onSuccess: () => void
  customFieldMutations: ReturnType<typeof useCustomFieldMutations>
}

export function CreateEditCustomFieldDialog({
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
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!customField
  const { t } = useTranslation('custom-fields')

  // Fetch data types (lazy loading: only when dialog is open)
  const { data: dataTypesResponse, isLoading: loadingDataTypes } = useCustomFieldDataTypes({ enabled: open })
  const dataTypes = dataTypesResponse?.data || []

  // Reset form when dialog opens/closes or customField changes
  useEffect(() => {
    if (open) {
      if (customField) {
        setFormData({
          name: customField.name,
          description: customField.description,
          data_type: customField.data_type,
          masc: customField.masc || "",
        })
      } else {
        setFormData({
          name: "",
          description: "",
          data_type: "",
          masc: "",
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
          },
        })
      } else {
        await customFieldMutations.create.mutateAsync({
          name: formData.name,
          description: formData.description,
          data_type: formData.data_type,
          masc: formData.masc || "",
        })
      }
      onSuccess()
    } catch (error) {
      // Error is handled by the mutation
      console.error("Error submitting custom field:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const formatDataType = (dataType: string) => {
    return t(`dataTypes.${dataType}` as Parameters<typeof t>[0], { defaultValue: dataType })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? t('editDialog.title') : t('createDialog.title')}
      description={
        isEditing
          ? t('editDialog.description')
          : t('createDialog.description')
      }
      icon={isEditing ? PenLine : Plus}
      maxWidth="sm:max-w-[600px]"
      maxHeight="max-h-[90vh]"
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
          onNameChange={(value) => handleInputChange("name", value)}
          onDescriptionChange={(value) => handleInputChange("description", value)}
          onDataTypeChange={(value) => handleInputChange("data_type", value)}
          onMascChange={(value) => handleInputChange("masc", value)}
          dataTypes={dataTypes}
          formatDataType={formatDataType}
          errors={errors}
          disabled={isSubmitting}
          loadingDataTypes={loadingDataTypes}
        />
      </div>
    </HuemulDialog>
  )
}