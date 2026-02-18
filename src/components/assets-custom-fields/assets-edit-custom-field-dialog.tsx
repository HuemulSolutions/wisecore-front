"use client"

import { useState, useEffect } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Loader2, Edit2, FileEdit } from "lucide-react"
import { getCustomFieldDocumentSources, uploadCustomFieldDocumentValueBlob } from "@/services/custom-fieldds-documents"
import { useOrganization } from "@/contexts/organization-context"
import { useQuery } from "@tanstack/react-query"
import type { CustomFieldDocument } from "@/types/custom-fields-documents"

interface EditCustomFieldAssetDialogProps {
  isOpen: boolean
  onClose: () => void
  customFieldDocument: CustomFieldDocument | null
  onUpdate: (id: string, data: any) => void
  mode?: "content" | "configuration" // "content" solo muestra el valor, "configuration" muestra todo
}

export function EditCustomFieldAssetDialog({
  isOpen,
  onClose,
  customFieldDocument,
  onUpdate,
  mode = "configuration",
}: EditCustomFieldAssetDialogProps) {
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

  // Reset form when dialog opens/closes or customFieldDocument changes
  useEffect(() => {
    if (isOpen && customFieldDocument) {
      setSelectedSource(customFieldDocument.source || "")
      setIsRequired(customFieldDocument.required || false)
      setPrompt(customFieldDocument.prompt || "")
      setValue(getValueForDataType(customFieldDocument))
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
      default:
        return document.value || ""
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Only validate source in configuration mode
    if (mode === "configuration" && !selectedSource) {
      newErrors.source = "Source is required"
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (file: File) => {
    if (!customFieldDocument) return
    
    setIsUploadingImage(true)
    try {
      await uploadCustomFieldDocumentValueBlob(customFieldDocument.id, file, selectedOrganizationId!)
      // Image uploaded successfully
    } catch (error) {
      console.error("Error uploading image:", error)
      setFormErrors(prev => ({ ...prev, value: "Failed to upload image" }))
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

  const closeDialog = () => {
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
            // Only update the value in content mode
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
      closeDialog()
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

  const renderValueField = () => {
    if (!customFieldDocument) return null
    
    const dataType = customFieldDocument.data_type
    
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

  const isValid = mode === "content" ? true : !!selectedSource

  if (!customFieldDocument) {
    return null
  }

  // Dynamic dialog configuration based on mode
  const dialogConfig = mode === "content"
    ? {
        title: "Edit Content",
        description: "Update the value for this custom field.",
        icon: FileEdit,
        submitLabel: "Update Content"
      }
    : {
        title: "Edit Custom Field",
        description: "Update the configuration for this custom field.",
        icon: Edit2,
        submitLabel: "Update Custom Field"
      }

  return (
    <ReusableDialog
      open={isOpen}
      onOpenChange={closeDialog}
      title={dialogConfig.title}
      description={dialogConfig.description}
      icon={dialogConfig.icon}
      maxWidth="lg"
      maxHeight="90vh"
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
            {dialogConfig.submitLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Custom Field Info (Read-only) */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h3 className="font-medium text-foreground">Custom Field Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">{customFieldDocument.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{customFieldDocument.data_type}</p>
              </div>
              {customFieldDocument.description && (
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="font-medium">{customFieldDocument.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Field Configuration - Only show in configuration mode */}
          {mode === "configuration" && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Custom Field Configuration</h3>

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
                        <Label htmlFor={`edit-${source}`} className="hover:cursor-pointer capitalize font-normal">
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

              {/* Value - only show when source is not inferred */}
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
          )}

          {/* Value Field - Only show in content mode */}
          {mode === "content" && (
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              {renderValueField()}
              {formErrors.value && (
                <p className="text-sm text-destructive">{formErrors.value}</p>
              )}
            </div>
          )}
        </div>
    </ReusableDialog>
  )
}