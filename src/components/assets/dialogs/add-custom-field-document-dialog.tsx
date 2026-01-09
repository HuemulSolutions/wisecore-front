"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
import { useCustomFields, useCustomFieldDataTypes, useCustomFieldMutations } from "@/hooks/useCustomFields"
import { getCustomFieldDocumentSources, uploadCustomFieldDocumentValueBlob } from "@/services/custom-fieldds-documents"
import { useOrganization } from "@/contexts/organization-context"
import { useQuery } from "@tanstack/react-query"
import type { CustomField } from "@/types/custom-fields"

interface AddCustomFieldDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  onAdd: (data: any) => Promise<any>
}

export function AddCustomFieldDocumentDialog({
  isOpen,
  onClose,
  documentId,
  onAdd,
}: AddCustomFieldDocumentDialogProps) {
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

  // Fetch custom field document sources
  const { data: sources = [], isLoading: isLoadingSources } = useQuery({
    queryKey: ['custom-field-document-sources'],
    queryFn: async () => {
      const response = await getCustomFieldDocumentSources();
      return response.data;
    }
  });

  // Fetch existing custom fields
  const {
    data: customFieldsResponse,
    isLoading: isLoadingCustomFields,
  } = useCustomFields()

  const customFields = customFieldsResponse?.data || []

  // Fetch data types for new custom field creation
  const { data: dataTypesResponse, isLoading: loadingDataTypes } = useCustomFieldDataTypes()
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

  const handleImageUpload = async (customFieldDocumentId: string, file: File) => {
    console.log("Starting image upload for document field ID:", customFieldDocumentId, "file:", file.name)
    setIsUploadingImage(true)
    try {
      console.log("Calling uploadCustomFieldDocumentValueBlob...")
      await uploadCustomFieldDocumentValueBlob(customFieldDocumentId, file, selectedOrganizationId!)
      console.log("Image uploaded successfully")
      // Image uploaded successfully
    } catch (error) {
      console.error("Error uploading image:", error)
      setFormErrors(prev => ({ ...prev, value: "Failed to upload image" }))
    } finally {
      setIsUploadingImage(false)
    }
  }

  const getValuePayloadForExisting = (selectedField: CustomField | undefined) => {
    if (!selectedField || !value.trim()) return {}
    
    const dataType = selectedField.data_type
    return getValuePayload(dataType)
  }

  const getValuePayloadForNew = (newField: any) => {
    if (!value.trim()) return {}
    
    const dataType = newField.data_type
    return getValuePayload(dataType)
  }

  const getValuePayload = (dataType: string) => {
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
        return { value: value }
      case "time":
        return { value: value }
      case "datetime":
        return { value: value }
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

  const handleSubmit = async () => {
    if (fieldType === "existing") {
      if (!selectedCustomFieldId || !selectedSource) {
        return // Validation
      }

      const selectedField = getSelectedCustomField()
      const data = {
        document_id: documentId,
        custom_field_id: selectedCustomFieldId,
        source: selectedSource,
        required: isRequired,
        prompt: prompt.trim() || undefined,
        ...getValuePayloadForExisting(selectedField),
      }

      try {
        console.log("Creating custom field document with data:", data)
        const createdDocument = await onAdd(data)
        console.log("Created document:", createdDocument)
        
        // If it's an image and there's a file to upload, handle it after creation
        if (selectedField?.data_type === "image" && selectedFile) {
          console.log("Uploading image for document field ID:", createdDocument?.id)
          if (createdDocument?.id) {
            await handleImageUpload(createdDocument.id, selectedFile)
          } else {
            console.error("No document field ID returned from onAdd")
          }
        }
      } catch (error) {
        console.error("Error adding custom field document:", error)
      }
    } else {
      // Create new custom field first, then add it to document
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

        // Then add it to the document with default source "manual"
        const data = {
          document_id: documentId,
          custom_field_id: newCustomField.id,
          source: "manual", // Default to manual for new custom fields
          required: isRequired,
          prompt: prompt.trim() || undefined,
          ...getValuePayloadForNew(newCustomField),
        }

        console.log("Creating new custom field and document association...")
        const createdDocument = await onAdd(data)
        console.log("Created document association for new field:", createdDocument)
        
        // If it's an image and there's a file to upload, handle it after creation
        if (newCustomField.data_type === "image" && selectedFile) {
          console.log("Uploading image for new field document ID:", createdDocument?.id)
          if (createdDocument?.id) {
            await handleImageUpload(createdDocument.id, selectedFile)
          } else {
            console.error("No document field ID returned from onAdd for new field")
          }
        }
      } catch (error) {
        console.error("Error creating custom field:", error)
      }
    }
  }

  const handleClose = () => {
    // Reset form
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
    onClose()
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
              // Solo permitir números enteros (sin decimales)
              const inputValue = e.target.value
              if (inputValue === '' || /^-?\d+$/.test(inputValue)) {
                setValue(inputValue)
              }
            }}
            onKeyPress={(e) => {
              // Prevenir entrada de puntos decimales y otros caracteres no enteros
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
                  setValue(file.name) // Store filename for reference
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Image will be uploaded after creating the custom field document
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
        <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add Custom Field
            </DialogTitle>
            <DialogDescription>
                Add an existing custom field to this document or create a new one.
            </DialogDescription>
        </DialogHeader>

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
                    Make this field mandatory for this document
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
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  placeholder="Enter custom field name"
                  value={newCustomFieldData.name}
                  onChange={(e) => handleNewCustomFieldInputChange("name", e.target.value)}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  placeholder="Enter custom field description"
                  rows={3}
                  value={newCustomFieldData.description}
                  onChange={(e) => handleNewCustomFieldInputChange("description", e.target.value)}
                />
                {formErrors.description && (
                  <p className="text-sm text-destructive">{formErrors.description}</p>
                )}
              </div>

              {/* Data Type */}
              <div className="space-y-2">
                <Label htmlFor="new-data-type">Data Type</Label>
                {loadingDataTypes ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading data types...</span>
                  </div>
                ) : (
                  <Select 
                    value={newCustomFieldData.data_type} 
                    onValueChange={(value) => handleNewCustomFieldInputChange("data_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map((dataType: string) => (
                        <SelectItem key={dataType} value={dataType}>
                          {formatDataType(dataType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.data_type && (
                  <p className="text-sm text-destructive">{formErrors.data_type}</p>
                )}
              </div>

              {/* Mask */}
              <div className="space-y-2">
                <Label htmlFor="new-masc">Mask (Optional)</Label>
                <Input
                  id="new-masc"
                  placeholder="Enter input mask (e.g., ###-##-####)"
                  value={newCustomFieldData.masc}
                  onChange={(e) => handleNewCustomFieldInputChange("masc", e.target.value)}
                />
              </div>

              {/* Required Switch */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Required Field</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this field mandatory for this document
                  </p>
                </div>
                <Switch
                  checked={isRequired}
                  onCheckedChange={setIsRequired}
                />
              </div>

              {/* Prompt - only show when source would be inferred */}
              <div className="space-y-2">
                <Label htmlFor="new-prompt">Prompt (Optional)</Label>
                <Textarea
                  id="new-prompt"
                  placeholder="Enter prompt for this custom field"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used if the source is set to 'inferred'
                </p>
              </div>

              {/* Value */}
              <div className="space-y-2">
                <Label htmlFor="new-value">Value (Optional)</Label>
                {renderValueField()}
                {formErrors.value && (
                  <p className="text-sm text-destructive">{formErrors.value}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="hover:cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isValid}
            className="hover:cursor-pointer"
          >
            {fieldType === "new" ? "Create & Add Field" : "Add Custom Field"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}