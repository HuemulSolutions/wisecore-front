"use client"

import { useState, useEffect } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
import { useCustomFields, useCustomFieldDataTypes, useCustomFieldMutations } from "@/hooks/useCustomFields"
import { useOrganization } from "@/contexts/organization-context"
import type { CustomField } from "@/types/custom-fields"
import CustomFieldFormFields from "@/components/custom-fields/custom-fields-form-fields"

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
      setFormErrors(prev => ({ ...prev, value: "Failed to upload image" }))
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
      newErrors.name = "Name is required"
    } else if (newCustomFieldData.name.length > 255) {
      newErrors.name = "Name must be less than 255 characters"
    }

    if (newCustomFieldData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters"
    }

    if (!newCustomFieldData.data_type) {
      newErrors.data_type = "Data type is required"
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
          placeholder="Select a custom field or data type first"
          disabled
        />
      )
    }
    
    switch (dataType) {
      case "bool":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === "true" || value === "1"}
              onCheckedChange={(checked) => setValue(checked.toString())}
            />
            <Label className="text-sm">
              {(value === "true" || value === "1") ? "True" : "False"}
            </Label>
          </div>
        )
      case "int":
        return (
          <Input
            type="number"
            step="1"
            placeholder="Enter integer value"
            value={value}
            onChange={(e) => {
              const inputValue = e.target.value
              if (inputValue === '' || /^-?\d+$/.test(inputValue)) {
                setValue(inputValue)
              }
            }}
            onKeyPress={(e) => {
              if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                e.preventDefault()
              }
            }}
          />
        )
      case "decimal":
        return (
          <Input
            type="number"
            step="any"
            placeholder="Enter decimal value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      case "date":
        return (
          <Input
            type="date"
            placeholder="YYYY-MM-DD"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      case "time":
        return (
          <Input
            type="time"
            placeholder="HH:MM:SS"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      case "datetime":
        return (
          <Input
            type="datetime-local"
            placeholder="YYYY-MM-DDTHH:MM:SS"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      case "image":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              disabled={isUploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setSelectedFile(file)
                  setValue(file.name)
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Image will be uploaded after creating the custom field {entityType}
            </p>
            {isUploadingImage && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading image...</span>
              </div>
            )}
          </div>
        )
      default: // string, url
        return (
          <Input
            type={dataType === "url" ? "url" : "text"}
            placeholder={`Enter ${dataType} value`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
    }
  }

  const isValid = fieldType === "existing"
    ? selectedCustomFieldId && selectedSource
    : newCustomFieldData.name && newCustomFieldData.data_type

  const entityLabel = entityType === "document" ? "document" : "template"

  return (
    <ReusableDialog
      open={isOpen}
      onOpenChange={closeDialog}
      title="Add Custom Field"
      description={`Add an existing custom field to this ${entityLabel} or create a new one.`}
      icon={Plus}
      maxWidth="lg"
      maxHeight="80vh"
      footer={
        <>
          <Button 
            variant="outline"
            onClick={closeDialog}
            className="hover:cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
          >
            {fieldType === "new" ? "Create & Add Field" : "Add Custom Field"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Radio Group for Field Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Choose an option</Label>
          <RadioGroup 
            value={fieldType} 
            onValueChange={(value: "existing" | "new") => setFieldType(value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="hover:cursor-pointer">
                Use existing custom field
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="hover:cursor-pointer">
                Create new custom field
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Existing Custom Field Selection */}
        {fieldType === "existing" && (
          <div className="space-y-4">
            {/* Custom Field Selector */}
            <div className="space-y-2">
              <Label htmlFor="custom-field" className="text-sm font-medium">
                Select Custom Field
              </Label>
              {isLoadingCustomFields ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading custom fields...</span>
                </div>
              ) : (
                <Select 
                  value={selectedCustomFieldId} 
                  onValueChange={setSelectedCustomFieldId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a custom field" />
                  </SelectTrigger>
                  <SelectContent>
                    {customFields.map((field: CustomField) => (
                      <SelectItem key={field.id} value={field.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{field.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDataType(field.data_type)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Source Radio Group */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Value Source</Label>
              {isLoadingSources ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading sources...</span>
                </div>
              ) : (
                <RadioGroup 
                  value={selectedSource} 
                  onValueChange={setSelectedSource}
                  className="space-y-2"
                >
                  {sources.map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <RadioGroupItem value={source} id={`${source}`} />
                      <Label htmlFor={`${source}`} className="hover:cursor-pointer capitalize">
                        {source}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            {/* Required Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Required Field</Label>
                <p className="text-xs text-muted-foreground">
                  Make this field mandatory for this {entityLabel}
                </p>
              </div>
              <Switch
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
            </div>

            {/* Prompt - only show when source is inferred */}
            {selectedSource === "inferred" && (
              <div className="space-y-2">
                <Label htmlFor="existing-prompt">Prompt (Required for Inferred)</Label>
                <Textarea
                  id="existing-prompt"
                  placeholder="Enter prompt for this custom field"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            )}

            {/* Value */}
            {selectedSource !== "inferred" && (
              <div className="space-y-2">
                <Label htmlFor="existing-value">Value (Optional)</Label>
                {renderValueField()}
                {formErrors.value && (
                  <p className="text-sm text-destructive">{formErrors.value}</p>
                )}
              </div>
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
    </ReusableDialog>
  )
}
