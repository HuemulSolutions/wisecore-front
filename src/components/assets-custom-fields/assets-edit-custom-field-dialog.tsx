"use client"

import { useState, useEffect } from "react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Label } from "@/components/ui/label"
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
            // Only update the value and required in content mode
            required: isRequired,
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

  const renderValueField = (label: string) => {
    if (!customFieldDocument) return null

    const dataType = customFieldDocument.data_type

    switch (dataType) {
      case "bool":
        return (
          <HuemulField
            type="switch"
            label={label}
            value={value === "true" || value === "1"}
            onChange={(v) => setValue(Boolean(v).toString())}
            error={formErrors.value}
            labelFirst
          />
        )
      case "int":
        return (
          <HuemulField
            type="number"
            label={label}
            placeholder="Enter integer value"
            value={value}
            step={1}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "decimal":
        return (
          <HuemulField
            type="number"
            label={label}
            placeholder="Enter decimal value"
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "date":
        return (
          <HuemulField
            type="date"
            label={label}
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "time":
        return (
          <HuemulField
            type="time"
            label={label}
            placeholder="HH:MM:SS"
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "datetime":
        return (
          <HuemulField
            type="datetime"
            label={label}
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "url":
        return (
          <HuemulField
            type="url"
            label={label}
            placeholder="Enter URL"
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
          />
        )
      case "image":
        return (
          <HuemulField
            type="file"
            label={label}
            accept="image/*"
            disabled={isUploadingImage}
            description="Image will be uploaded immediately after selection"
            onFileChange={(files) => {
              const file = files?.[0]
              if (file) {
                setSelectedFile(file)
                handleImageUpload(file)
              }
            }}
            error={formErrors.value}
          >
            {isUploadingImage && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading image...</span>
              </div>
            )}
          </HuemulField>
        )
      default:
        return (
          <HuemulField
            type="text"
            label={label}
            placeholder={`Enter ${dataType} value`}
            value={value}
            onChange={(v) => setValue(String(v))}
            error={formErrors.value}
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
    <HuemulDialog
      open={isOpen}
      onOpenChange={closeDialog}
      title={dialogConfig.title}
      description={dialogConfig.description}
      icon={dialogConfig.icon}
      maxWidth="sm:max-w-lg"
      maxHeight="max-h-[90vh]"
      saveAction={{
        label: dialogConfig.submitLabel,
        onClick: handleSubmit,
        disabled: !isValid,
        closeOnSuccess: false,
      }}
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

            {/* Source */}
            {isLoadingSources ? (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading sources...</span>
              </div>
            ) : (
              <HuemulField
                type="radio"
                label="Value Source"
                required
                value={selectedSource}
                onChange={(v) => setSelectedSource(String(v))}
                options={sources.map((source) => ({
                  label: source.charAt(0).toUpperCase() + source.slice(1),
                  value: source,
                }))}
                error={formErrors.source}
              />
            )}

            {/* Required */}
            <HuemulField
              type="switch"
              label="Required Field"
              description="Make this field mandatory for this document"
              value={isRequired}
              onChange={(v) => setIsRequired(Boolean(v))}
              labelFirst
            />

            {/* Prompt - only show when source is inferred */}
            {selectedSource === "inferred" && (
              <HuemulField
                type="textarea"
                label="Prompt (Required for Inferred)"
                placeholder="Enter prompt for this custom field"
                rows={3}
                value={prompt}
                onChange={(v) => setPrompt(String(v))}
              />
            )}

            {/* Value - only show when source is not inferred */}
            {selectedSource !== "inferred" && renderValueField("Value (Optional)")}
          </div>
        )}

        {/* Content mode */}
        {mode === "content" && (
          <>
            <HuemulField
              type="switch"
              label="Required Field"
              description="Make this field mandatory for this document"
              value={isRequired}
              onChange={(v) => setIsRequired(Boolean(v))}
              labelFirst
            />
            {renderValueField("Value")}
          </>
        )}
      </div>
    </HuemulDialog>
  )
}