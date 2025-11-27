import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface EditSectionSheetProps {
  item: Item;
  onCancel: () => void;
  onSave: (updatedItem: ItemForBackend) => void;
  existingSections?: Section[];
}

export default function EditSectionSheet({ item, onCancel, onSave, existingSections = [] }: EditSectionSheetProps) {
  const [formData, setFormData] = useState<Item>({
    ...item,
    dependencies: [...item.dependencies]
  });
  const [selectValue, setSelectValue] = useState<string>("");
  const editorRef = useRef<MDXEditorMethods>(null);

  const handleInputChange = (field: keyof Item, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDependency = (sectionId: string) => {
    if (!formData.dependencies.some(dep => dep.id === sectionId)) {
      let sectionInfo = existingSections.find(section => section.id === sectionId);
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, { id: sectionId, name: sectionInfo?.name || `Section ${sectionId}` }]
      }));
    }
    setSelectValue(""); // reset select
  };

  const removeDependency = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(dep => dep.id !== sectionId)
    }));
  };

  const availableSections = existingSections.filter(
    section => section.id !== item.id && !formData.dependencies.some(dep => dep.id === section.id)
  );

  const handleSave = () => {
    // order se mantiene sin edición
    // Enviar dependencies como array de strings (solo IDs) para compatibilidad con el backend
    const updatedItem: ItemForBackend = {
      ...formData,
      dependencies: formData.dependencies.map(dep => dep.id)
    };
    onSave(updatedItem);
  };

  return (
    <div className="w-full space-y-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Edit Section</h3>
        {/* Action Buttons moved to top */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="hover:cursor-pointer text-sm h-8"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs font-medium text-gray-700">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter section name"
          className="text-sm"
        />
      </div>

      {/* Prompt Field */}
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-xs font-medium text-gray-700">Prompt</Label>
        <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <MDXEditor
            ref={editorRef}
            markdown={formData.prompt}
            onChange={(value) => handleInputChange('prompt', value)}
            contentEditableClassName='mdxeditor-content min-h-[100px] prose dark:prose-invert focus:outline-none p-3 text-sm'
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
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Internal Dependencies</Label>
        {availableSections.length > 0 ? (
          <Select value={selectValue} onValueChange={addDependency}>
            <SelectTrigger className="hover:cursor-pointer text-sm">
              <SelectValue placeholder="Select a section to add as dependency" />
            </SelectTrigger>
            <SelectContent>
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
          <div className="mt-2 flex flex-wrap gap-1">
            {formData.dependencies.map(dep => {
              const section = existingSections.find(s => s.id === dep.id);
              return (
                <span
                  key={dep.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                >
                  {section?.name || `Section ${dep.id}`}
                  <button
                    type="button"
                    onClick={() => removeDependency(dep.id)}
                    className="text-blue-600 hover:text-blue-800 hover:cursor-pointer ml-1"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}