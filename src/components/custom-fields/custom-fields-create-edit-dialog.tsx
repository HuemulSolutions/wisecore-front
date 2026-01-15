"use client"

import { useState, useEffect } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { PenLine, Plus } from "lucide-react"
import CustomFieldFormFields from "@/components/custom-fields/custom-fields-form-fields"

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

  // Fetch data types
  const { data: dataTypesResponse, isLoading: loadingDataTypes } = useCustomFieldDataTypes()
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
      newErrors.name = "Name is required"
    } else if (formData.name.length > 255) {
      newErrors.name = "Name must be less than 255 characters"
    }

    if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters"
    }

    if (!formData.data_type) {
      newErrors.data_type = "Data type is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
    switch (dataType) {
      case "string":
        return "Text"
      case "int":
        return "Integer"
      case "decimal":
        return "Decimal"
      case "date":
        return "Date"
      case "time":
        return "Time"
      case "datetime":
        return "Date Time"
      case "bool":
        return "Boolean"
      case "image":
        return "Image"
      case "url":
        return "URL"
      default:
        return dataType
    }
  }

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Custom Field" : "Create Custom Field"}
      description={
        isEditing
          ? "Update the custom field details."
          : "Create a new custom field to extend your documents with additional data."
      }
      icon={isEditing ? PenLine : Plus}
      maxWidth="lg"
      formId="custom-field-form"
      submitLabel={isEditing ? "Update Custom Field" : "Create Custom Field"}
      cancelLabel="Cancel"
      isSubmitting={isSubmitting}
      isValid={true}
      showDefaultFooter={true}
    >
      <form id="custom-field-form" onSubmit={handleSubmit} className="space-y-4">
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
      </form>
      </ReusableDialog>
  )
}