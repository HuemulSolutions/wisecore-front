"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Loader2, Edit2 } from "lucide-react"
import { useCustomFieldTemplateSources } from "@/hooks/useCustomFieldTemplates"
import { uploadCustomFieldTemplateValueBlob } from "@/services/custom-fields-templates"
import { useOrganization } from "@/contexts/organization-context"
import type { CustomFieldTemplate } from "@/types/custom-fields-templates"

interface EditCustomFieldTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  customFieldTemplate: CustomFieldTemplate | null
  onUpdate: (id: string, data: any) => void
}

export function EditCustomFieldTemplateDialog({
  isOpen,
  onClose,
  customFieldTemplate,
  onUpdate,
}: EditCustomFieldTemplateDialogProps) {
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

  // Reset form when dialog opens/closes or customFieldTemplate changes
  useEffect(() => {
    if (isOpen && customFieldTemplate) {
      setSelectedSource(customFieldTemplate.source || "")
      setIsRequired(customFieldTemplate.required || false)
      setPrompt(customFieldTemplate.prompt || "")
      setValue(getValueForDataType(customFieldTemplate))
      setSelectedFile(null)
      setFormErrors({})
    } else if (!isOpen) {
      // Reset form when dialog closes
      setSelectedSource("")
      setIsRequired(false)
      setPrompt("")
      setValue("")
      setSelectedFile(null)
      setFormErrors({})
    }
  }, [isOpen, customFieldTemplate])

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
      default:
        return template.value_string || ""
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedSource) {
      newErrors.source = "Source is required"
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (file: File) => {
    if (!customFieldTemplate) return
    
    setIsUploadingImage(true)
    try {
      await uploadCustomFieldTemplateValueBlob(customFieldTemplate.id, file, selectedOrganizationId!)
      // Image uploaded successfully
    } catch (error) {
      console.error("Error uploading image:", error)
      setFormErrors(prev => ({ ...prev, value: "Failed to upload image" }))
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (!customFieldTemplate) return

    if (!validateForm()) {
      return
    }

    try {
      // Only update the custom field template, not the custom field itself
      const templateData = {
        source: selectedSource,
        required: isRequired,
        prompt: prompt.trim() || undefined,
        ...getValuePayload(),
      }

      onUpdate(customFieldTemplate.id, templateData)
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
        return { value_bool: boolValue }
      case "int":
        const intValue = parseInt(value)
        return isNaN(intValue) ? {} : { value_number: intValue }
      case "decimal":
        const decimalValue = parseFloat(value)
        return isNaN(decimalValue) ? {} : { value_number: decimalValue }
      case "date":
        return { value_date: value }
      case "time":
        return { value_time: value }
      case "datetime":
        return { value_datetime: value }
      case "url":
        return { value_url: value }
      case "image":
        return {} // Images are handled via blob upload
      default:
        return { value_string: value }
    }
  }

  const renderValueField = () => {
    if (!customFieldTemplate) return null
    
    const dataType = customFieldTemplate.data_type
    
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
                  handleImageUpload(file)
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Image will be uploaded immediately after selection
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

  const handleClose = () => {
    // Reset form
    setSelectedSource("")
    setIsRequired(false)
    setPrompt("")
    setValue("")
    setSelectedFile(null)
    setFormErrors({})
    onClose()
  }

  const isValid = !!selectedSource

  if (!customFieldTemplate) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Edit Custom Field Template
          </DialogTitle>
          <DialogDescription>
            Update the configuration for this custom field template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Custom Field Info (Read-only) */}
          <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
            <h3 className="text-sm font-medium text-foreground">Custom Field Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">{customFieldTemplate.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{customFieldTemplate.data_type}</p>
              </div>
              {customFieldTemplate.description && (
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="font-medium">{customFieldTemplate.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Template Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Template Configuration</h3>

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
                      <RadioGroupItem value={source} id={`edit-${source}`} />
                      <Label htmlFor={`edit-${source}`} className="hover:cursor-pointer capitalize">
                        {source}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {formErrors.source && (
                <p className="text-sm text-destructive">{formErrors.source}</p>
              )}
            </div>

            {/* Required Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Required Field</Label>
                <p className="text-xs text-muted-foreground">
                  Make this field mandatory for documents using this template
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
                <Label htmlFor="prompt">Prompt (Required for Inferred)</Label>
                <Textarea
                  id="prompt"
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
                <Label htmlFor="value">Value (Optional)</Label>
                {renderValueField()}
                {formErrors.value && (
                  <p className="text-sm text-destructive">{formErrors.value}</p>
                )}
              </div>
            )}
          </div>
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
            Update Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}