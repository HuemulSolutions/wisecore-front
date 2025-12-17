import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDocumentTypeMutations } from "@/hooks/useDocumentTypes"
import { type DocumentType } from "@/services/document-types"
import { ColorPicker } from "@/components/color-picker"

interface CreateEditDocumentTypeDialogProps {
  documentType: DocumentType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateEditDocumentTypeDialog({ 
  documentType, 
  open, 
  onOpenChange 
}: CreateEditDocumentTypeDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280', // Default gray color
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createDocumentType } = useDocumentTypeMutations()

  // Reset form when documentType changes or dialog opens
  useEffect(() => {
    if (open) {
      if (documentType) {
        setFormData({
          name: documentType.name,
          color: documentType.color,
        })
      } else {
        setFormData({
          name: '',
          color: '#6B7280',
        })
      }
      setErrors({})
    }
  }, [documentType, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Asset type name is required'
    }

    if (!formData.color) {
      newErrors.color = 'Color is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const submissionData = {
      name: formData.name.trim(),
      color: formData.color,
    }

    if (documentType) {
      // TODO: Implement update functionality when endpoint is available
      console.log('Update asset type:', submissionData)
    } else {
      createDocumentType.mutate(submissionData, {
        onSuccess: () => {
          onOpenChange(false)
        }
      })
    }
  }

  const isLoading = createDocumentType.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {documentType ? 'Edit Asset Type' : 'Create Asset Type'}
          </DialogTitle>
          <DialogDescription>
            {documentType 
              ? 'Update the asset type information below.'
              : 'Add a new asset type to organize your assets.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Type Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter asset type name"
              className={errors.name ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className={isLoading ? 'pointer-events-none opacity-50' : ''}>
              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData(prev => ({ ...prev, color }))}
              />
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="hover:cursor-pointer"
            >
              {isLoading ? 'Saving...' : (documentType ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}