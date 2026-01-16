import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, X } from "lucide-react";
import { redactPrompt } from "@/services/generate";
import { useOrganization } from "@/contexts/organization-context";
import { FileTree } from "@/components/assets/content/assets-file-tree";
import { getLibraryContent } from "@/services/folders";
import { getExecutionsByDocumentId } from "@/services/executions";
import { getDocumentSections, getDocumentById } from "@/services/assets";
import { useQuery } from "@tanstack/react-query";
import type { FileNode } from "@/types/assets";
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
  markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
  BlockTypeSelect, tablePlugin, InsertTable, codeBlockPlugin, codeMirrorPlugin,
  linkPlugin, linkDialogPlugin, CreateLink, imagePlugin, InsertImage, 
  CodeToggle, InsertCodeBlock, InsertThematicBreak, ListsToggle, Separator
} from '@mdxeditor/editor';
import type { MDXEditorMethods } from '@mdxeditor/editor';

interface Section {
  id: string;
  name: string;
}

interface SectionItem {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
  referenced_document_id?: string;
}

interface SectionFormProps {
  mode: 'create' | 'edit';
  editorType?: 'simple' | 'rich'; // simple = Textarea, rich = MDXEditor
  formId?: string;
  documentId?: string;
  templateId?: string;
  item?: SectionItem; // Solo requerido en modo edit
  onSubmit: (values: any) => void;
  isPending?: boolean;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
}

export function SectionForm({ 
  mode,
  editorType = 'simple',
  formId = 'section-form',
  documentId, 
  templateId, 
  item,
  onSubmit, 
  isPending = false, 
  existingSections = [], 
  onValidationChange, 
  onGeneratingChange,
  hasTemplate = false,
  isTemplateSection = false 
}: SectionFormProps) {
  const { selectedOrganizationId } = useOrganization();
  const editorRef = useRef<MDXEditorMethods>(null);
  const manualEditorRef = useRef<MDXEditorMethods>(null);
  
  // Estado inicial basado en el modo
  const [name, setName] = useState(mode === 'edit' && item ? item.name : "");
  const [type, setType] = useState<"ai" | "manual" | "reference">(mode === 'edit' && item ? (item as any).type || "ai" : "ai");
  const [prompt, setPrompt] = useState(mode === 'edit' && item ? item.prompt : "");
  const [manualInput, setManualInput] = useState(mode === 'edit' && item ? (item as any).manual_input || "" : "");
  const [referenceSectionId, setReferenceSectionId] = useState(mode === 'edit' && item ? (item as any).reference_section_id || "" : "");
  const [referenceMode, setReferenceMode] = useState<"latest" | "specific">(mode === 'edit' && item ? (item as any).reference_mode || "latest" : "latest");
  const [referenceExecutionId, setReferenceExecutionId] = useState(mode === 'edit' && item ? (item as any).reference_execution_id || "" : "");
  const [selectedDependencies, setSelectedDependencies] = useState<Array<{id: string; name: string}>>(
    mode === 'edit' && item ? item.dependencies : []
  );
  const [selectValue, setSelectValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [propagateToTemplate, setPropagateToTemplate] = useState(false);
  const [propagatePrompt, setPropagatePrompt] = useState(false);
  
  // Estados para Reference Type con FileTree
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ id: string; name: string } | null>(null);

  // Query para obtener información del asset referenciado (solo en modo edit)
  const { data: referencedDocument } = useQuery({
    queryKey: ['referenced-document', selectedAsset?.id],
    queryFn: () => getDocumentById(selectedAsset!.id, selectedOrganizationId!),
    enabled: mode === 'edit' && type === 'reference' && !!selectedAsset?.id && !!selectedOrganizationId,
    staleTime: 30000,
  });

  // Query para obtener las secciones del asset seleccionado
  const { data: assetSections, isLoading: isLoadingSections } = useQuery({
    queryKey: ['asset-sections', selectedAsset?.id],
    queryFn: () => getDocumentSections(selectedAsset!.id, selectedOrganizationId!),
    enabled: type === 'reference' && !!selectedAsset?.id && !!selectedOrganizationId,
    staleTime: 30000,
  });

  // Query para obtener las ejecuciones del asset seleccionado (solo cuando sea modo specific)
  const { data: assetExecutions, isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['asset-executions', selectedAsset?.id],
    queryFn: () => getExecutionsByDocumentId(selectedAsset!.id, selectedOrganizationId!),
    enabled: type === 'reference' && referenceMode === 'specific' && !!selectedAsset?.id && !!selectedOrganizationId,
    staleTime: 30000,
  });

  // Actualizar nombre del asset cuando se cargue el documento (modo edit)
  useEffect(() => {
    if (mode === 'edit' && referencedDocument && selectedAsset) {
      const documentName = referencedDocument.name || referencedDocument.title;
      if (documentName && selectedAsset.name !== documentName) {
        setSelectedAsset({ id: selectedAsset.id, name: documentName });
      }
    }
  }, [referencedDocument, selectedAsset, mode]);

  // Actualizar nombre de la sección cuando se carguen las secciones del asset (modo edit)
  useEffect(() => {
    if (mode === 'edit' && assetSections && referenceSectionId && selectedSection) {
      const section = assetSections.find((s: any) => s.id === referenceSectionId);
      if (section && section.name) {
        setSelectedSection({ id: section.id, name: section.name });
      }
    }
  }, [assetSections, referenceSectionId, mode]);

  // Debug: log de los datos recibidos
  useEffect(() => {
    console.log('assetExecutions:', assetExecutions);
    console.log('assetSections:', assetSections);
    console.log('isLoadingExecutions:', isLoadingExecutions);
    console.log('isLoadingSections:', isLoadingSections);
    console.log('type:', type);
    console.log('referenceMode:', referenceMode);
    console.log('selectedAsset:', selectedAsset);
    console.log('referenceSectionId:', referenceSectionId);
  }, [assetExecutions, assetSections, isLoadingExecutions, isLoadingSections, type, referenceMode, selectedAsset, referenceSectionId]);

  // Lista de ejecuciones disponibles (todas las que tengan status completed o approved)
  const availableExecutions = useMemo(() => {
    console.log('useMemo ejecutándose. assetExecutions:', assetExecutions);
    console.log('assetExecutions?.data:', assetExecutions?.data);
    console.log('Array.isArray(assetExecutions):', Array.isArray(assetExecutions));
    console.log('Array.isArray(assetExecutions?.data):', Array.isArray(assetExecutions?.data));
    
    // Verificar si assetExecutions es directamente un array o tiene una propiedad data
    const executionsArray = Array.isArray(assetExecutions) 
      ? assetExecutions 
      : assetExecutions?.data;
    
    if (!executionsArray || !Array.isArray(executionsArray)) {
      console.log('No hay datos o no es un array');
      return [];
    }
    
    const filtered = executionsArray.filter((exec: any) => 
      exec.status === 'completed' || exec.status === 'approved'
    );
    console.log('Available executions filtered:', filtered);
    return filtered;
  }, [assetExecutions]);

  // Función para cargar contenido del árbol
  const handleLoadChildren = async (folderId: string | null): Promise<FileNode[]> => {
    if (!selectedOrganizationId) return [];
    
    try {
      const response = await getLibraryContent(selectedOrganizationId, folderId || undefined);
      
      return response.content.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type as "document" | "folder",
        document_type: item.document_type,
        access_levels: item.access_levels,
        hasChildren: item.type === "folder",
      }));
    } catch (error) {
      console.error('Error loading folder content:', error);
      return [];
    }
  };

  // Manejar selección de asset
  const handleAssetSelect = (node: FileNode) => {
    if (node.type === 'document') {
      setSelectedAsset({ id: node.id, name: node.name });
      // Resetear sección y execution ID cuando cambie el asset
      setSelectedSection(null);
      setReferenceSectionId("");
      setReferenceExecutionId("");
    }
  };

  // Sincronizar con item cuando cambie (modo edit)
  useEffect(() => {
    if (mode === 'edit' && item) {
      setName(item.name);
      setType((item as any).type || "ai");
      setPrompt(item.prompt);
      const manualInputValue = (item as any).manual_input || "";
      setManualInput(manualInputValue);
      const refSectionId = (item as any).reference_section_id || "";
      const refDocumentId = (item as any).referenced_document_id || "";
      setReferenceSectionId(refSectionId);
      setReferenceMode((item as any).reference_mode || "latest");
      setReferenceExecutionId((item as any).reference_execution_id || "");
      setSelectedDependencies([...item.dependencies]);
      
      // Si hay un reference_section_id y referenced_document_id, establecer selectedAsset y selectedSection
      if (refSectionId && refDocumentId && (item as any).type === 'reference') {
        // Establecer el asset seleccionado usando referenced_document_id
        setSelectedAsset({ id: refDocumentId, name: `Asset ${refDocumentId.slice(0, 8)}...` });
        // Establecer la sección seleccionada usando reference_section_id
        setSelectedSection({ id: refSectionId, name: `Section ${refSectionId.slice(0, 8)}...` });
      }
      
      if (editorType === 'rich' && editorRef.current) {
        editorRef.current.setMarkdown(item.prompt);
      }
      
      // Sincronizar el editor manual cuando el tipo sea manual
      if ((item as any).type === 'manual' && manualEditorRef.current) {
        manualEditorRef.current.setMarkdown(manualInputValue);
      }
    }
  }, [item, mode, editorType]);

  const handleGeneratePrompt = async () => {
    if (!name.trim()) return;
    
    setIsGenerating(true);
    setPrompt("");
    if (editorType === 'rich' && editorRef.current) {
      editorRef.current.setMarkdown("");
    }
    
    try {
      let accumulatedText = "";
      await redactPrompt({
        name: name.trim(),
        organizationId: selectedOrganizationId!,
        onData: (text: string) => {
          accumulatedText += text;
          const formattedText = accumulatedText.replace(/\\n/g, '\n');
          setPrompt(formattedText);
          if (editorType === 'rich' && editorRef.current) {
            editorRef.current.setMarkdown(formattedText);
          }
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
    if (!selectedDependencies.some(dep => dep.id === sectionId)) {
      const sectionInfo = existingSections.find(section => section.id === sectionId);
      setSelectedDependencies(prev => [
        ...prev, 
        { id: sectionId, name: sectionInfo?.name || `Section ${sectionId}` }
      ]);
    }
    setSelectValue("");
  };

  const removeDependency = (sectionId: string) => {
    setSelectedDependencies(prev => prev.filter(dep => dep.id !== sectionId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar según el tipo
    if (!name.trim()) return;
    
    // Validaciones específicas por tipo
    if (type === "ai" && !prompt.trim()) return;
    if (type === "reference") {
      if (!referenceSectionId || !referenceMode) return;
      if (referenceMode === "specific" && !referenceExecutionId) return;
    }
    
    if (mode === 'create') {
      const submitData: any = {
        name: name.trim(),
        type: type
      };

      // Agregar campos según el tipo
      if (type === "ai") {
        submitData.prompt = prompt.trim();
        submitData.dependencies = selectedDependencies.map(dep => dep.id);
      } else if (type === "manual") {
        if (manualInput.trim()) {
          submitData.manual_input = manualInput.trim();
        }
      } else if (type === "reference") {
        submitData.reference_section_id = referenceSectionId;
        submitData.reference_mode = referenceMode;
        if (referenceMode === "specific") {
          submitData.reference_execution_id = referenceExecutionId;
        }
      }

      if (templateId) {
        submitData.template_id = templateId;
      } else if (documentId) {
        submitData.document_id = documentId;
      }
      
      onSubmit(submitData);
    } else {
      // Modo edit
      const submitData: any = {
        id: item!.id,
        name: name.trim(),
        type: type,
        order: item!.order
      };
      
      // Agregar campos según el tipo
      if (type === "ai") {
        submitData.prompt = prompt.trim();
        submitData.dependencies = selectedDependencies.map(dep => dep.id);
      } else if (type === "manual") {
        if (manualInput.trim()) {
          submitData.manual_input = manualInput.trim();
        }
      } else if (type === "reference") {
        submitData.reference_section_id = referenceSectionId;
        submitData.reference_mode = referenceMode;
        if (referenceMode === "specific") {
          submitData.reference_execution_id = referenceExecutionId;
        }
      }
      
      if (hasTemplate) {
        submitData.propagate_to_template = propagateToTemplate;
      }
      
      if (isTemplateSection) {
        submitData.propagate_to_sections = propagatePrompt;
      }
      
      onSubmit(submitData);
    }
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
  };

  // Filtrar secciones disponibles
  const availableSections = existingSections.filter(section => {
    // En modo edit, excluir la sección actual
    if (mode === 'edit' && item && section.id === item.id) {
      return false;
    }
    // Excluir dependencias ya seleccionadas
    return !selectedDependencies.some(dep => dep.id === section.id);
  });

  // Notificar cambios en la validación
  const isFormValid = (() => {
    if (!name.trim() || isGenerating) return false;
    
    if (type === "ai") {
      return prompt.trim().length > 0;
    } else if (type === "manual") {
      return true; // manual_input es opcional
    } else if (type === "reference") {
      if (!referenceSectionId || !referenceMode) return false;
      if (referenceMode === "specific" && !referenceExecutionId) return false;
      return true;
    }
    
    return false;
  })();
  
  useEffect(() => {
    onValidationChange?.(isFormValid);
  }, [isFormValid, onValidationChange]);

  // Notificar cambios en el estado de generación
  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {/* Section Name */}
      <div className="space-y-2">
        <Label htmlFor="section-name" className="text-xs font-medium text-gray-700">
          Section Name
        </Label>
        <Input
          id="section-name"
          placeholder="Enter section name (e.g., Purpose, Scope, Procedure)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          autoFocus={mode === 'create'}
          autoComplete="off"
          className="text-sm"
        />
      </div>

      {/* Section Type */}
      <div className="space-y-2">
        <Label htmlFor="section-type" className="text-xs font-medium text-gray-700">
          Section Type
        </Label>
        <Select value={type} onValueChange={(value: "ai" | "manual" | "reference") => setType(value)} disabled={isPending}>
          <SelectTrigger className="hover:cursor-pointer text-sm w-full">
            <SelectValue placeholder="Select section type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ai" className="hover:cursor-pointer text-sm">
              AI Generated
            </SelectItem>
            <SelectItem value="manual" className="hover:cursor-pointer text-sm">
              Manual Input
            </SelectItem>
            <SelectItem value="reference" className="hover:cursor-pointer text-sm">
              Reference to Another Section
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          {type === "ai" && "Content will be generated by AI using the prompt below"}
          {type === "manual" && "Content will be entered manually"}
          {type === "reference" && "Content will reference another section's output"}
        </p>
      </div>

      {/* Campos específicos para tipo AI */}
      {type === "ai" && (
        <>
          {/* Prompt Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">
                Prompt Content <span className="text-red-500">*</span>
              </Label>
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

            {editorType === 'simple' ? (
              <Textarea
                placeholder="Enter the prompt content for this section or use AI generation"
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                disabled={isPending || isGenerating}
                rows={20}
                className="text-sm resize-none min-h-[250px] max-h-[250px]"
              />
            ) : (
              <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#4464f7] focus-within:border-transparent">
                <MDXEditor
                  ref={editorRef}
                  markdown={prompt}
                  onChange={handlePromptChange}
                  contentEditableClassName='mdxeditor-content min-h-[250px] prose dark:prose-invert focus:outline-none p-3'
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
            )}

            <div className="min-h-[20px]">
              {isGenerating && (
                <div className="text-xs text-blue-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI is generating content based on the section name...
                </div>
              )}
            </div>
          </div>

          {/* Dependencies - Solo para tipo AI */}
          <div className="space-y-2 w-full">
            <Label className="text-xs font-medium text-gray-700">
              Internal Dependencies
            </Label>
            {availableSections.length > 0 ? (
              <Select value={selectValue} onValueChange={addDependency} disabled={isPending}>
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
            
            {selectedDependencies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 w-full">
                {selectedDependencies.map(dep => {
                  const section = existingSections.find(s => s.id === dep.id);
                  return (
                    <span
                      key={dep.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs border border-orange-200"
                    >
                      {section?.name || dep.name}
                      <button
                        type="button"
                        onClick={() => removeDependency(dep.id)}
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
        </>
      )}

      {/* Campos específicos para tipo Manual */}
      {type === "manual" && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">
            Manual Input (Optional)
          </Label>
          <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#4464f7] focus-within:border-transparent">
            <MDXEditor
              ref={manualEditorRef}
              markdown={manualInput}
              onChange={(value) => setManualInput(value)}
              contentEditableClassName='mdxeditor-content min-h-[200px] prose dark:prose-invert focus:outline-none p-3'
              readOnly={isPending}
              placeholder="Enter initial content for this section (optional)"
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
                  },
                }),
              ]}
            />
          </div>
          <p className="text-xs text-gray-500">
            This content can be edited later when working with the document
          </p>
        </div>
      )}

      {/* Campos específicos para tipo Reference */}
      {type === "reference" && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              Select Asset <span className="text-red-500">*</span>
            </Label>
            
            {selectedAsset ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedAsset.name}</p>
                  <p className="text-xs text-gray-500">Selected asset</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(null);
                    setSelectedSection(null);
                    setReferenceSectionId("");
                    setReferenceExecutionId("");
                  }}
                  className="hover:cursor-pointer"
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-white">
                <FileTree
                  onLoadChildren={handleLoadChildren}
                  onFileClick={handleAssetSelect}
                  showCreateButtons={false}
                  showDefaultActions={{ create: false, delete: false, share: false }}
                  showBorder={false}
                  minHeight="300px"
                />
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              Select an asset to reference
            </p>
          </div>

          {/* Selector de Sección */}
          {selectedAsset && (
            <div className="space-y-2">
              <Label htmlFor="section-reference" className="text-xs font-medium text-gray-700">
                Select Section to Reference <span className="text-red-500">*</span>
              </Label>
              
              {isLoadingSections ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading sections...</span>
                </div>
              ) : assetSections && assetSections.length > 0 ? (
                <Select 
                  value={referenceSectionId} 
                  onValueChange={(value) => {
                    setReferenceSectionId(value);
                    const section = assetSections.find((s: any) => s.id === value);
                    if (section) {
                      setSelectedSection({ id: section.id, name: section.name });
                    }
                  }} 
                  disabled={isPending}
                >
                  <SelectTrigger className="hover:cursor-pointer text-sm w-full">
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetSections.map((section: any) => (
                      <SelectItem 
                        key={section.id} 
                        value={section.id} 
                        className="hover:cursor-pointer"
                      >
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-md">
                  <p className="text-sm text-amber-800">
                    No sections found for this asset. Please select a different asset.
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Select a section from the asset to reference
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reference-mode" className="text-xs font-medium text-gray-700">
              Reference Mode <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={referenceMode} 
              onValueChange={(value: "latest" | "specific") => {
                setReferenceMode(value);
                // Resetear execution ID cuando cambie el modo
                if (value === "latest") {
                  setReferenceExecutionId("");
                }
              }} 
              disabled={isPending || !selectedAsset || !referenceSectionId}
            >
              <SelectTrigger className="hover:cursor-pointer text-sm w-full">
                <SelectValue placeholder="Select reference mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest" className="hover:cursor-pointer text-sm">
                  Latest Execution
                </SelectItem>
                <SelectItem value="specific" className="hover:cursor-pointer text-sm">
                  Specific Execution
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {referenceMode === "latest" && "Always use the most recent execution of the referenced asset"}
              {referenceMode === "specific" && "Use a specific execution of the referenced asset"}
            </p>
          </div>

          {referenceMode === "specific" && selectedAsset && (
            <div className="space-y-2">
              <Label htmlFor="reference-execution" className="text-xs font-medium text-gray-700">
                Execution <span className="text-red-500">*</span>
              </Label>
              
              {isLoadingExecutions ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading executions...</span>
                </div>
              ) : availableExecutions.length > 0 ? (
                <Select 
                  value={referenceExecutionId} 
                  onValueChange={setReferenceExecutionId} 
                  disabled={isPending}
                >
                  <SelectTrigger className="hover:cursor-pointer text-sm w-full">
                    <SelectValue placeholder="Select an execution" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExecutions.map((execution: any) => (
                      <SelectItem 
                        key={execution.id} 
                        value={execution.id} 
                        className="hover:cursor-pointer"
                      >
                        {execution.name || 'Unnamed Execution'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-md">
                  <p className="text-sm text-amber-800">
                    No completed executions found for this asset. Please select a different asset or use "Latest Execution" mode.
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Select a specific execution to reference from the selected asset
              </p>
            </div>
          )}
        </>
      )}

      {/* Propagate to Template - Solo mostrar en modo edit cuando hasTemplate es true */}
      {mode === 'edit' && hasTemplate && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="propagate-to-template"
            checked={propagateToTemplate}
            onCheckedChange={(checked) => setPropagateToTemplate(checked as boolean)}
            disabled={isPending}
          />
          <Label
            htmlFor="propagate-to-template"
            className="text-xs font-medium text-gray-700 hover:cursor-pointer"
          >
            Propagate changes to template
          </Label>
        </div>
      )}

      {/* Propagate Prompt - Solo mostrar en modo edit cuando isTemplateSection es true */}
      {mode === 'edit' && isTemplateSection && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="propagate-prompt"
            checked={propagatePrompt}
            onCheckedChange={(checked) => setPropagatePrompt(checked as boolean)}
            disabled={isPending}
          />
          <Label
            htmlFor="propagate-prompt"
            className="text-xs font-medium text-gray-700 hover:cursor-pointer"
          >
            Apply changes to all assets using this template
          </Label>
        </div>
      )}

      {/* Validation Messages */}
      <div className="min-h-[32px]">
        {type === "ai" && name && !prompt && !isGenerating && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            💡 Consider using AI generation or add prompt content manually
          </div>
        )}
        {type === "reference" && !selectedAsset && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠️ Please select an asset to reference
          </div>
        )}
        {type === "reference" && selectedAsset && !referenceSectionId && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠️ Please select a section to reference
          </div>
        )}
        {type === "reference" && referenceMode === "specific" && selectedAsset && !referenceExecutionId && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠️ Please select an execution for specific reference mode
          </div>
        )}
      </div>
    </form>
  );
}
