"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Edit3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
    markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
    BlockTypeSelect, tablePlugin, InsertTable, codeBlockPlugin, codeMirrorPlugin,
    linkPlugin, linkDialogPlugin, CreateLink, imagePlugin, InsertImage, 
    CodeToggle, InsertCodeBlock, InsertThematicBreak, ListsToggle, Separator
} from '@mdxeditor/editor';
import type { MDXEditorMethods } from '@mdxeditor/editor';

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
}

export function EditSectionDialog({ 
  open, 
  onOpenChange, 
  item, 
  onSave, 
  existingSections = [] 
}: EditSectionDialogProps) {
  const [formData, setFormData] = useState<Item>({
    ...item,
    dependencies: [...item.dependencies]
  })
  const [selectValue, setSelectValue] = useState<string>("")
  const editorRef = useRef<MDXEditorMethods>(null)

  React.useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        dependencies: [...item.dependencies]
      })
    }
  }, [item])

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
    setSelectValue("") // reset select
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
    
    // Enviar dependencies como array de strings (solo IDs) para compatibilidad con el backend
    const updatedItem: ItemForBackend = {
      ...formData,
      dependencies: formData.dependencies.map(dep => dep.id)
    }
    
    onSave(updatedItem)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Edit3 className="h-4 w-4 text-primary" />
            Edit Section
          </DialogTitle>
          <DialogDescription className="text-sm">
            Make changes to the section information and content.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div className="grid gap-4 w-full">
            {/* Name Field */}
            <div className="grid gap-2 w-full">
              <Label htmlFor="sectionName">Section Name *</Label>
              <Input
                id="sectionName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter section name"
                className="w-full"
                required
              />
            </div>

            {/* Prompt Field */}
            <div className="grid gap-2 w-full">
              <Label htmlFor="sectionPrompt">Prompt *</Label>
              <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 w-full overflow-hidden">
                <MDXEditor
                  ref={editorRef}
                  markdown={formData.prompt}
                  onChange={(value) => handleInputChange('prompt', value)}
                  contentEditableClassName='mdxeditor-content min-h-[120px] prose dark:prose-invert focus:outline-none p-2 text-sm'
                  placeholder="Enter the prompt for this section"
                  spellCheck={false}
                  plugins={[
                    headingsPlugin(), 
                    listsPlugin(), 
                    quotePlugin(), 
                    tablePlugin(),
                    thematicBreakPlugin(), 
                    linkPlugin(),
                    linkDialogPlugin(),
                    imagePlugin({
                      imageUploadHandler: async () => {
                        return Promise.resolve('https://via.placeholder.com/400x300');
                      }
                    }),
                    codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
                    codeMirrorPlugin({ codeBlockLanguages: { 
                      js: 'JavaScript', 
                      jsx: 'JavaScript (React)', 
                      ts: 'TypeScript', 
                      tsx: 'TypeScript (React)', 
                      css: 'CSS', 
                      html: 'HTML', 
                      json: 'JSON',
                      bash: 'Bash',
                      sh: 'Shell',
                      yaml: 'YAML',
                      yml: 'YAML',
                      xml: 'XML',
                      sql: 'SQL',
                      python: 'Python',
                      go: 'Go',
                      rust: 'Rust',
                      java: 'Java',
                      c: 'C',
                      cpp: 'C++',
                      php: 'PHP',
                      ruby: 'Ruby',
                      '': 'Plain text'
                    }}),
                    markdownShortcutPlugin(),
                    toolbarPlugin({
                      toolbarContents() {
                        return (
                          <>  
                            <UndoRedo />
                            <Separator />
                            <BoldItalicUnderlineToggles />
                            <CodeToggle />
                            <Separator />
                            <ListsToggle />
                            <Separator />
                            <BlockTypeSelect />
                            <Separator />
                            <CreateLink />
                            <InsertImage />
                            <Separator />
                            <InsertTable />
                            <InsertCodeBlock />
                            <InsertThematicBreak />
                          </>
                        )
                      },
                    }),
                  ]}
                />
              </div>
            </div>

            {/* Dependencies Field */}
            <div className="grid gap-2 w-full">
              <Label className="text-sm font-medium text-gray-700">Internal Dependencies</Label>
              {availableSections.length > 0 ? (
                <Select value={selectValue} onValueChange={addDependency}>
                  <SelectTrigger className="hover:cursor-pointer w-full">
                    <SelectValue placeholder="Select a section to add as dependency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map(section => (
                      <SelectItem key={section.id} value={section.id} className="hover:cursor-pointer">
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No sections available to add as dependencies
                </p>
              )}
              {formData.dependencies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.dependencies.map(dep => {
                    const section = existingSections.find(s => s.id === dep.id)
                    return (
                      <span
                        key={dep.id}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {section?.name || `Section ${dep.id}`}
                        <button
                          type="button"
                          onClick={() => removeDependency(dep.id)}
                          className="text-blue-600 hover:text-blue-800 hover:cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-4 gap-2 flex-row justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="hover:cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit"
              size="sm"
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}