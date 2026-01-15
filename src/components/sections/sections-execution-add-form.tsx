import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
    markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
    BlockTypeSelect, tablePlugin, InsertTable, codeBlockPlugin, codeMirrorPlugin,
    linkPlugin, linkDialogPlugin, CreateLink, imagePlugin, InsertImage, 
    CodeToggle, InsertCodeBlock, InsertThematicBreak, ListsToggle, Separator
 } from '@mdxeditor/editor';
import type { MDXEditorMethods } from '@mdxeditor/editor';

interface AddSectionExecutionFormProps {
  onSubmit: (values: { name: string; output: string; after_from?: string }) => void;
  isPending: boolean;
  afterFromId?: string; // ID de la section_execution que estará antes (opcional para insertar al principio)
  onValidationChange?: (isValid: boolean) => void;
}

export function AddSectionExecutionForm({ 
  onSubmit, 
  isPending, 
  afterFromId,
  onValidationChange 
}: AddSectionExecutionFormProps) {
  const [name, setName] = useState("");
  const [output, setOutput] = useState("");
  const editorRef = useRef<MDXEditorMethods>(null);

  // Validación del formulario
  const isFormValid = name.trim().length > 0 && output.trim().length > 0;

  // Notificar cambios de validación
  useEffect(() => {
    onValidationChange?.(isFormValid);
  }, [isFormValid, onValidationChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const submitData: { name: string; output: string; after_from?: string } = {
      name: name.trim(),
      output: output.trim()
    };

    // Solo agregar after_from si tenemos un ID válido
    if (afterFromId) {
      submitData.after_from = afterFromId;
    }

    onSubmit(submitData);
  };

  const handleOutputChange = (markdown: string) => {
    setOutput(markdown);
  };

  return (
    <form id="add-section-execution-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre de la sección */}
      <div className="space-y-2">
        <Label htmlFor="section-name" className="text-sm font-medium text-gray-900">
          Section Name *
        </Label>
        <Input
          id="section-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter section name..."
          className="w-full"
          disabled={isPending}
          required
        />
      </div>

      {/* Contenido de la sección */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-900">
          Section Content *
        </Label>
        <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#4464f7] focus-within:border-transparent">
          <MDXEditor
            ref={editorRef}
            markdown={output}
            onChange={handleOutputChange}
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
              tablePlugin(),
              codeBlockPlugin(),
              codeMirrorPlugin(),
              linkPlugin(),
              linkDialogPlugin(),
              imagePlugin(),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <Separator />
                    <BoldItalicUnderlineToggles />
                    <CodeToggle />
                    <Separator />
                    <BlockTypeSelect />
                    <Separator />
                    <ListsToggle />
                    <Separator />
                    <CreateLink />
                    <InsertImage />
                    <Separator />
                    <InsertTable />
                    <InsertCodeBlock />
                    <InsertThematicBreak />
                  </>
                )
              })
            ]}
            placeholder="Write the content for this section..."
            className="min-h-[200px] prose prose-sm max-w-none focus:outline-none"
            contentEditableClassName="min-h-[200px] p-4 focus:outline-none"
          />
        </div>
        <p className="text-xs text-gray-500">
          Write the content that will be displayed in this section. You can use Markdown formatting.
        </p>
      </div>

      {/* Hidden submit button - the form will be submitted by the dialog's action button */}
      <button type="submit" className="hidden" disabled={!isFormValid || isPending}>
        Submit
      </button>
    </form>
  );
}