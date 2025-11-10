import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
    markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
    BlockTypeSelect, tablePlugin, InsertTable
 } from '@mdxeditor/editor';
import type { MDXEditorMethods } from '@mdxeditor/editor';
import { Sparkles, Loader2 } from "lucide-react";
import { redactPrompt } from "@/services/generate";

interface Section {
  id: string;
  name: string;
}

interface AddSectionFormSheetProps {
  documentId: string;
  onSubmit: (values: { name: string; prompt: string; dependencies: string[]; document_id: string }) => void;
  isPending: boolean;
  existingSections?: Section[];
}

export function AddSectionFormSheet({ documentId, onSubmit, isPending, existingSections = [] }: AddSectionFormSheetProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<MDXEditorMethods>(null);

  const handleGeneratePrompt = async () => {
    if (!name.trim()) return;
    
    setIsGenerating(true);
    setPrompt("");
    editorRef.current?.setMarkdown("");
    
    try {
      let accumulatedText = "";
      await redactPrompt({
        name: name.trim(),
        onData: (text: string) => {
          accumulatedText += text;
          const formattedText = accumulatedText.replace(/\\n/g, '\n');
          setPrompt(formattedText);
          editorRef.current?.setMarkdown(formattedText);
        },
        onError: (error) => {
          console.error('Error generating prompt:', error);
        },
        onClose: () => {
          setIsGenerating(false);
        }
      });
    } catch (error) {
      console.error('Error in prompt generation:', error);
      setIsGenerating(false);
    }
  };

  const addDependency = (sectionId: string) => {
    if (!selectedDependencies.includes(sectionId)) {
      setSelectedDependencies(prev => [...prev, sectionId]);
    }
    setSelectValue("");
  };

  const removeDependency = (sectionId: string) => {
    setSelectedDependencies(prev => prev.filter(id => id !== sectionId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !prompt.trim()) return;
    
    onSubmit({
      name: name.trim(),
      prompt: prompt.trim(),
      dependencies: selectedDependencies,
      document_id: documentId
    });
  };

  const availableSections = existingSections.filter(
    section => !selectedDependencies.includes(section.id)
  );

  return (
    <form id="add-section-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Section Name */}
      <div className="space-y-2">
        <Label htmlFor="section-name" className="text-xs font-medium text-gray-700">Section Name</Label>
        <Input
          id="section-name"
          placeholder="Enter section name (e.g., Purpose, Scope, Procedure)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          autoFocus
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
            disabled={!name.trim() || isGenerating || !!prompt.trim() || isPending}
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
        <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#4464f7] focus-within:border-[#4464f7]">
          <MDXEditor
            ref={editorRef}
            markdown={prompt}
            onChange={setPrompt}
            contentEditableClassName='mdxeditor-content min-h-[100px] prose dark:prose-invert focus:outline-none p-3 text-sm'
            readOnly={isPending || isGenerating}
            placeholder="Enter the prompt content for this section or use AI generation"
            spellCheck={false}
            plugins={[
              headingsPlugin(), 
              listsPlugin(), 
              quotePlugin(), 
              tablePlugin(),
              thematicBreakPlugin(), 
              markdownShortcutPlugin(),
              toolbarPlugin({
                toolbarContents() {
                  return (
                    <>  
                      <BlockTypeSelect />
                      <BoldItalicUnderlineToggles />
                      <InsertTable />
                      <UndoRedo />
                    </>
                  )
                },
              }),
            ]}
          />
        </div>
        {isGenerating && (
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            AI is generating content based on the section name...
          </div>
        )}
      </div>

      {/* Dependencies */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Internal Dependencies</Label>
        {availableSections.length > 0 ? (
          <Select value={selectValue} onValueChange={addDependency} disabled={isPending}>
            <SelectTrigger className="hover:cursor-pointer text-sm">
              <SelectValue placeholder="Select sections this depends on" />
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
        
        {selectedDependencies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedDependencies.map(depId => {
              const section = existingSections.find(s => s.id === depId);
              return (
                <span
                  key={depId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs border border-orange-200"
                >
                  {section?.name || `Section ${depId}`}
                  <button
                    type="button"
                    onClick={() => removeDependency(depId)}
                    className="text-orange-600 hover:text-orange-800 hover:cursor-pointer ml-1"
                    disabled={isPending}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {name && !prompt && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          💡 Consider using AI generation or add prompt content manually
        </div>
      )}
    </form>
  );
}