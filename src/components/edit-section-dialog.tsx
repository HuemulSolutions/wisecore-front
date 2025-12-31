"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Edit3, Sparkles, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { redactPrompt } from "@/services/generate"
import { useOrganization } from "@/contexts/organization-context"

interface Item {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
}

interface ItemForBackend {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: string[];
}

interface Section {
  id: string;
  name: string;
}

interface EditSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
  onSave: (updatedItem: ItemForBackend) => void
  existingSections?: Section[]
  onGeneratingChange?: (isGenerating: boolean) => void
}

export function EditSectionDialog({ 
  open, 
  onOpenChange, 
  item, 
  onSave, 
  existingSections = [],
  onGeneratingChange
}: EditSectionDialogProps) {
  const { selectedOrganizationId } = useOrganization()
  const [formData, setFormData] = useState<Item>({
    ...item,
    dependencies: [...item.dependencies]
  })
  const [selectValue, setSelectValue] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  React.useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        dependencies: [...item.dependencies]
      })
    }
  }, [item])

  // Notificar cambios en el estado de generación
  useEffect(() => {
    onGeneratingChange?.(isGenerating)
  }, [isGenerating, onGeneratingChange])

  const handleGeneratePrompt = async () => {
    if (!formData.name.trim()) return
    
    setIsGenerating(true)
    setFormData(prev => ({ ...prev, prompt: "" }))
    
    try {
      let accumulatedText = ""
      await redactPrompt({
        name: formData.name.trim(),
        organizationId: selectedOrganizationId!,
        onData: (text: string) => {
          accumulatedText += text
          const formattedText = accumulatedText.replace(/\\n/g, '\n')
          setFormData(prev => ({ ...prev, prompt: formattedText }))
        },
        onError: (error) => {
          console.error('Error generating prompt:', error)
        },
        onClose: () => {
          setIsGenerating(false)
        }
      })
    } catch (error) {
      console.error('Error in prompt generation:', error)
      setIsGenerating(false)
    }
  }

  const handleInputChange = (field: keyof Item, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addDependency = (sectionId: string) => {
    if (!formData.dependencies.some(dep => dep.id === sectionId)) {
      let sectionInfo = existingSections.find(section => section.id === sectionId)
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, { id: sectionId, name: sectionInfo?.name || `Section ${sectionId}` }]
      }))
    }
    setSelectValue("")
  }

  const removeDependency = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(dep => dep.id !== sectionId)
    }))
  }

  const availableSections = existingSections.filter(
    section => section.id !== item.id && !formData.dependencies.some(dep => dep.id === section.id)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updatedItem: ItemForBackend = {
      ...formData,
      dependencies: formData.dependencies.map(dep => dep.id)
    }
    
    onSave(updatedItem)
    onOpenChange(false)
  }

  const isFormValid = formData.name.trim().length > 0 && formData.prompt.trim().length > 0 && !isGenerating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <div className="px-6 pt-6 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Edit3 className="h-4 w-4 text-[#4464f7]" />
              Edit Section
            </DialogTitle>
            <DialogDescription className="text-xs">
              Make changes to the section information and content.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <form id="edit-section-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Section Name */}
            <div className="space-y-2">
              <Label htmlFor="section-name" className="text-xs font-medium text-gray-700">Section Name</Label>
              <Input
                id="section-name"
                placeholder="Enter section name (e.g., Purpose, Scope, Procedure)"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                autoComplete="off"
                className="text-sm"
              />
            </div>

            {/* Prompt Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700">Prompt Content</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGeneratePrompt}
                  disabled={!formData.name.trim() || isGenerating || !!formData.prompt.trim()}
                  className="hover:cursor-pointer h-7 text-xs border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1 h-3 w-3" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                placeholder="Enter the prompt content for this section or use AI generation"
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                disabled={isGenerating}
                rows={20}
                className="text-sm resize-none min-h-[250px] max-h-[250px]"
              />
              <div className="min-h-[20px]">
                {isGenerating && (
                  <div className="text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI is generating content based on the section name...
                  </div>
                )}
              </div>
            </div>

            {/* Dependencies */}
            <div className="space-y-2 w-full">
              <Label className="text-xs font-medium text-gray-700">Internal Dependencies</Label>
              {availableSections.length > 0 ? (
                <Select value={selectValue} onValueChange={addDependency}>
                  <SelectTrigger className="hover:cursor-pointer text-sm w-full">
                    <SelectValue placeholder="Select sections this depends on" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {availableSections.map(section => (
                      <SelectItem key={section.id} value={section.id} className="hover:cursor-pointer text-sm">
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  No sections available to add as dependencies
                </p>
              )}
              
              {formData.dependencies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 w-full">
                  {formData.dependencies.map(dep => {
                    const section = existingSections.find(s => s.id === dep.id)
                    return (
                      <span
                        key={dep.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs border border-orange-200"
                      >
                        {section?.name || `Section ${dep.id}`}
                        <button
                          type="button"
                          onClick={() => removeDependency(dep.id)}
                          className="text-orange-600 hover:text-orange-800 hover:cursor-pointer ml-1"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Validation Messages */}
            <div className="min-h-[32px]">
              {formData.name && !formData.prompt && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  💡 Consider using AI generation or add prompt content manually
                </div>
              )}
            </div>
          </form>
        </div>
        
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="hover:cursor-pointer"
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-section-form"
            className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            disabled={!isFormValid}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}