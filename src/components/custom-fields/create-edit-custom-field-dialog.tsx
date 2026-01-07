"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, PenLine, Plus } from "lucide-react"

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <PenLine className="h-5 w-5 text-primary"/> : <Plus className="h-5 w-5 text-primary"/>}
            {isEditing ? "Edit Custom Field" : "Create Custom Field"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the custom field details."
              : "Create a new custom field to extend your documents with additional data."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter custom field name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter custom field description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Data Type */}
          <div className="space-y-2">
            <Label htmlFor="data_type">Data Type</Label>
            <Select
              value={formData.data_type}
              onValueChange={(value) => handleInputChange("data_type", value)}
              disabled={isSubmitting || loadingDataTypes}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                {dataTypes.map((dataType) => (
                  <SelectItem key={dataType} value={dataType}>
                    {formatDataType(dataType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.data_type && (
              <p className="text-sm text-destructive">{errors.data_type}</p>
            )}
          </div>

          {/* Mask */}
          <div className="space-y-2">
            <Label htmlFor="masc">Mask (Optional)</Label>
            <Input
              id="masc"
              placeholder="Enter input mask (e.g., ###-##-####)"
              value={formData.masc}
              onChange={(e) => handleInputChange("masc", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loadingDataTypes}
              className="hover:cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update Custom Field" : "Create Custom Field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}