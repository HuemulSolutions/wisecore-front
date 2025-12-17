import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
    markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
    BlockTypeSelect, tablePlugin, InsertTable, codeBlockPlugin, codeMirrorPlugin,
    linkPlugin, linkDialogPlugin, CreateLink, imagePlugin, InsertImage, 
    CodeToggle, InsertCodeBlock, InsertThematicBreak, ListsToggle, Separator
 } from '@mdxeditor/editor';
import type { MDXEditorMethods } from '@mdxeditor/editor';
import { Sparkles, Loader2 } from "lucide-react";
import { redactPrompt } from "@/services/generate";
import { useOrganization } from "@/contexts/organization-context";

interface Section {
  id: string;
  name: string;
}

interface AddSectionFormProps {
  documentId: string;
  onSubmit: (values: { name: string; prompt: string; dependencies: string[]; document_id: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  existingSections?: Section[];
}

export function AddSectionForm({ documentId, onSubmit, onCancel, isPending, existingSections = [] }: AddSectionFormProps) {
  const { selectedOrganizationId } = useOrganization();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<MDXEditorMethods>(null);

  const handleGeneratePrompt = async () => {
    if (!name.trim()) return;
    
    setIsGenerating(true);
    setPrompt(""); // Clear existing prompt state
    editorRef.current?.setMarkdown(""); // Clear editor content
    
    try {
      let accumulatedText = "";
      await redactPrompt({
        name: name.trim(),
        organizationId: selectedOrganizationId!,
        onData: (text: string) => {
          accumulatedText += text;
          // Convert \n to actual line breaks for markdown
          const formattedText = accumulatedText.replace(/\\n/g, '\n');
          setPrompt(formattedText); // Update state for validation
          editorRef.current?.setMarkdown(formattedText); // Update editor
        },
        onError: (error: Event) => {
          console.error('Error generating prompt:', error);
          setIsGenerating(false);
        },
        onClose: () => {
          setIsGenerating(false);
        }
      });
    } catch (error) {
      console.error('Error generating prompt:', error);
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;
    onSubmit({ 
      name, 
      prompt, 
      dependencies: selectedDependencies, 
      document_id: documentId 
    });
  };

  const addDependency = (sectionId: string) => {
    const id = sectionId;
    console.log('Adding dependency:', id);
    if (!selectedDependencies.includes(id)) {
      setSelectedDependencies([...selectedDependencies, id]);
    }
    setSelectValue(""); // Reiniciar el valor del select
  };

  const removeDependency = (sectionId: string) => {
    setSelectedDependencies(selectedDependencies.filter(id => id !== sectionId));
  };

  const availableSections = existingSections.filter(
    section => !selectedDependencies.includes(section.id)
  );

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Add New Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="section-name" className="block text-sm font-medium mb-1">
              Section Name
            </label>
            <Input
              id="section-name"
              placeholder="Enter section name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              autoFocus
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between pb-2">
              <label htmlFor="section-prompt" className="block text-sm font-medium mb-1">
                Prompt
              </label>
              <Button
                type="button"
                size="sm"
                onClick={handleGeneratePrompt}
                disabled={!name.trim() || isGenerating || !!prompt.trim()}
                className="hover:cursor-pointer"
              >
                {isGenerating ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </div>
            <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <MDXEditor
                ref={editorRef}
                markdown={prompt}
                onChange={setPrompt}
                contentEditableClassName='mdxeditor-content min-h-[120px] prose dark:prose-invert focus:outline-none p-3'
                readOnly={isPending || isGenerating}
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

          <div>
            <label htmlFor="dependencies" className="block text-sm font-medium mb-1">
              Internal Dependencies
            </label>
            {availableSections.length > 0 ? (
              <Select value={selectValue} onValueChange={addDependency} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section to add as dependency" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
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
            
            {selectedDependencies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedDependencies.map(depId => {
                  const section = existingSections.find(s => s.id === depId);
                  console.log('Debug:', { depId, section, existingSections }); // Línea temporal para debug
                  return (
                    <span
                      key={depId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {section?.name || `Section ${depId}`}
                      <button
                        type="button"
                        onClick={() => removeDependency(depId)}
                        className="text-blue-600 hover:text-blue-800 hover:cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 py-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending} className="hover:cursor-pointer">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !name.trim() || !prompt.trim()} className="hover:cursor-pointer">
            {isPending ? "Adding..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}