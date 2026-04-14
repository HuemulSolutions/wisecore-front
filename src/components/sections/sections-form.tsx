import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X } from "lucide-react";
import { redactPrompt } from "@/services/generate";
import { useOrganization } from "@/contexts/organization-context";
import { FileTree } from "@/components/assets/content/assets-file-tree";
import { getLibraryContent } from "@/services/folders";
import { getExecutionsByDocumentId } from "@/services/executions";
import { getDocumentSections, getDocumentById } from "@/services/assets";
import { getSectionContent } from "@/services/section";
import { useQuery } from "@tanstack/react-query";
import type { FileNode } from "@/types/assets";
import Markdown from "@/components/ui/markdown";
import SectionPlateEditor, { type SectionPlateEditorRef } from "@/components/plate-editor/section-plate-editor";

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
  template_section_id?: string;
}

interface SectionFormProps {
  mode: 'create' | 'edit';
  editorType?: 'simple' | 'rich'; // simple = Textarea, rich = PlateEditor
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
  /** Default section type for create mode */
  defaultType?: 'ai' | 'manual' | 'reference';
  /** Default manual content for create mode */
  defaultManualInput?: string;
}

export function SectionForm({ 
  mode,
  editorType = 'rich',
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
  isTemplateSection = false,
  defaultType,
  defaultManualInput,
}: SectionFormProps) {
  const { t } = useTranslation('sections');
  const { selectedOrganizationId } = useOrganization();
  const promptEditorRef = useRef<SectionPlateEditorRef>(null);
  const manualEditorRef = useRef<SectionPlateEditorRef>(null);
  
  // Estado inicial basado en el modo
  const [name, setName] = useState(mode === 'edit' && item ? item.name : "");
  const [type, setType] = useState<"ai" | "manual" | "reference">(mode === 'edit' && item ? (item as any).type || "ai" : (defaultType || "ai"));
  const [prompt, setPrompt] = useState(mode === 'edit' && item ? item.prompt : "");
  // Key para forzar el render del editor cuando cambia el prompt generado
  const [editorKey, setEditorKey] = useState(0);
  const [manualInput, setManualInput] = useState(mode === 'edit' && item ? (item as any).manual_input || "" : (defaultManualInput || ""));
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
  const [propagateToAssets, setPropagateToAssets] = useState(false);
  
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

  // Query para obtener el preview del contenido de la sección referenced
  const { data: sectionPreview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['section-preview', referenceSectionId, referenceExecutionId, referenceMode],
    queryFn: () => getSectionContent(
      referenceSectionId, 
      selectedOrganizationId!,
      referenceMode === 'specific' ? referenceExecutionId : undefined
    ),
    enabled: type === 'reference' && !!referenceSectionId && !!selectedOrganizationId && (referenceMode === 'latest' || !!referenceExecutionId),
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
      
      // PlateRichEditor se re-inicializa con key={editorKey} + initialMarkdown
      if (editorType === 'rich') {
        setEditorKey(prev => prev + 1);
      }
    }
  }, [item, mode, editorType]);

  const handleGeneratePrompt = async () => {
    if (!name.trim()) return;
    
    setIsGenerating(true);
    let accumulatedText = "";
    try {
      await redactPrompt({
        name: name.trim(),
        organizationId: selectedOrganizationId!,
        onData: (text: string) => {
          accumulatedText += text;
          const formattedText = accumulatedText.replace(/\\n/g, '\n');
          setPrompt(formattedText);
        },
        onError: (error) => {
          console.error('Error generating prompt:', error);
        },
        onClose: () => {
          setIsGenerating(false);
          // Forzar render del editor cambiando la key
          setEditorKey(prev => prev + 1);
        }
      });
    } catch (error) {
      console.error('Error in prompt generation:', error);
      setIsGenerating(false);
      setEditorKey(prev => prev + 1);
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
        const md = manualEditorRef.current?.getMarkdown?.() || "";
        if (md.trim()) {
          if (templateId) {
            submitData.manual_input = md.trim();
          } else {
            submitData.output = md.trim();
          }
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
        if (propagateToAssets) {
          submitData.propagate_to_documents = true;
        }
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
        const md = manualEditorRef.current?.getMarkdown?.() || "";
        if (md.trim()) {
          if (isTemplateSection) {
            submitData.manual_input = md.trim();
          } else {
            submitData.output = md.trim();
          }
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
      return true;
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

  // Detectar si la sección viene de un template
  const isFromTemplate = mode === 'edit' && item && !!item.template_section_id;

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {/* Section Name */}
      <HuemulField
        type="text"
        label={t('form.sectionName.label')}
        name="section-name"
        placeholder={t('form.sectionName.placeholder')}
        value={name}
        onChange={(val) => setName(val as string)}
        disabled={isPending || isFromTemplate}
        autoFocus={mode === 'create'}
        autoComplete="off"
        required
        description={isFromTemplate ? t('form.sectionName.descriptionFromTemplate') : undefined}
      />

      {/* Section Type */}
      <HuemulField
        type="select"
        label={t('form.sectionType.label')}
        name="section-type"
        options={[
          { value: "ai", label: t('form.sectionType.optionAi') },
          { value: "manual", label: t('form.sectionType.optionManual') },
          { value: "reference", label: t('form.sectionType.optionReference') },
        ]}
        value={type}
        onChange={(val) => setType(val as "ai" | "manual" | "reference")}
        disabled={isPending}
        placeholder={t('form.sectionType.placeholder')}
        description={
          type === "ai" ? t('form.sectionType.descriptionAi') :
          type === "manual" ? t('form.sectionType.descriptionManual') :
          t('form.sectionType.descriptionReference')
        }
      />

      {/* Campos específicos para tipo AI */}
      {type === "ai" && (
        <>
          {/* Prompt Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">
                {t('form.prompt.label')} <span className="text-red-500">*</span>
              </Label>
              <HuemulButton
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGeneratePrompt}
                disabled={!name.trim() || isGenerating || !!prompt.trim() || isPending}
                className="h-7 text-xs border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    {t('form.prompt.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    {t('form.prompt.generate')}
                  </>
                )}
              </HuemulButton>
            </div>

            {editorType === 'simple' ? (
              <Textarea
                placeholder={t('form.prompt.placeholder')}
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                disabled={isPending || isGenerating}
                rows={20}
                className="text-sm resize-none min-h-[250px] max-h-[250px]"
              />
            ) : (
              <SectionPlateEditor
                key={editorKey}
                ref={promptEditorRef}
                content={prompt}
                isEditing={true}
                hideActions={true}
                enableComments={false}
                enableCreateSection={false}
                onValueChange={() => {
                  const md = promptEditorRef.current?.getMarkdown?.() || "";
                  handlePromptChange(md);
                }}
              />
            )}

            <div className="min-h-[20px]">
              {isGenerating && (
                <div className="text-xs text-blue-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('form.prompt.generatingHint')}
                </div>
              )}
            </div>
          </div>

          {/* Dependencies - Solo para tipo AI */}
          <HuemulField
            type="select"
            label={t('form.dependencies.label')}
            options={availableSections.map(s => ({ value: s.id, label: s.name }))}
            value={selectValue}
            onChange={(val) => addDependency(val as string)}
            disabled={isPending || availableSections.length === 0}
            placeholder={availableSections.length === 0 ? t('form.dependencies.placeholderEmpty') : t('form.dependencies.placeholder')}
            description={availableSections.length === 0 ? t('form.dependencies.descriptionEmpty') : undefined}
          >
            {selectedDependencies.length > 0 && (
              <div className="flex flex-wrap gap-1 w-full">
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
          </HuemulField>
        </>
      )}

      {/* Campos específicos para tipo Manual */}
      {type === "manual" && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">
            {t('form.manualInput.label')}
          </Label>
          <SectionPlateEditor
            key={`manual-${editorKey}`}
            ref={manualEditorRef}
            sectionId={item?.id ?? 'new'}
            content={manualInput}
            isEditing={true}
            hideActions={true}
            enableComments={false}
            enableCreateSection={false}
          />
          <p className="text-xs text-gray-500">
            {t('form.manualInput.description')}
          </p>
        </div>
      )}

      {/* Campos específicos para tipo Reference */}
      {type === "reference" && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              {t('form.reference.selectAssetLabel')} <span className="text-red-500">*</span>
            </Label>
            
            {selectedAsset ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedAsset.name}</p>
                  <p className="text-xs text-gray-500">{t('form.reference.selectedAsset')}</p>
                </div>
                <HuemulButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(null);
                    setSelectedSection(null);
                    setReferenceSectionId("");
                    setReferenceExecutionId("");
                  }}
                  disabled={isPending}
                  icon={X}
                />
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
              {t('form.reference.selectAssetHint')}
            </p>
          </div>

          {/* Selector de Sección y Reference Mode en la misma línea */}
          {selectedAsset && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector de Sección */}
              <HuemulField
                type="select"
                label={t('form.reference.sectionLabel')}
                required
                options={(assetSections || []).map((s: any) => ({ value: s.id, label: s.name }))}
                value={referenceSectionId}
                onChange={(val) => {
                  const sectionId = val as string;
                  setReferenceSectionId(sectionId);
                  const section = assetSections?.find((s: any) => s.id === sectionId);
                  if (section) setSelectedSection({ id: section.id, name: section.name });
                }}
                disabled={isPending || isLoadingSections}
                placeholder={isLoadingSections ? t('form.reference.sectionPlaceholderLoading') : t('form.reference.sectionPlaceholder')}
                description={t('form.reference.sectionDescription')}
                error={!isLoadingSections && assetSections && assetSections.length === 0 ? t('form.reference.sectionErrorEmpty') : undefined}
              />
              {/* Reference Mode */}
              <HuemulField
                type="select"
                label={t('form.reference.modeLabel')}
                required
                options={[
                  { value: "latest", label: t('form.reference.modeLatest') },
                  { value: "specific", label: t('form.reference.modeSpecific') },
                ]}
                value={referenceMode}
                onChange={(val) => {
                  const mode = val as "latest" | "specific";
                  setReferenceMode(mode);
                  if (mode === "latest") setReferenceExecutionId("");
                }}
                disabled={isPending || !selectedAsset || !referenceSectionId}
                placeholder={t('form.reference.modePlaceholder')}
                description={
                  referenceMode === "latest" ? t('form.reference.modeDescriptionLatest') :
                  t('form.reference.modeDescriptionSpecific')
                }
              />
            </div>
          )}

          {/* Preview del contenido de la sección */}
          {referenceSectionId && (referenceMode === 'latest' || (referenceMode === 'specific' && referenceExecutionId)) && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">
                {t('form.reference.previewLabel')}
              </Label>
              
              {isLoadingPreview ? (
                <div className="flex items-center justify-center p-4 border rounded-md bg-gray-50">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">{t('form.reference.previewLoading')}</span>
                </div>
              ) : sectionPreview?.content ? (
                <div className="border rounded-md p-4 bg-white max-h-[400px] overflow-y-auto">
                  <Markdown>{sectionPreview.content}</Markdown>
                </div>
              ) : (
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    {t('form.reference.previewEmpty')}
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                {t('form.reference.previewHint')}
              </p>
            </div>
          )}

          {referenceMode === "specific" && selectedAsset && (
            <HuemulField
              type="select"
              label={t('form.reference.executionLabel')}
              required
              options={availableExecutions.map((exec: any) => ({ value: exec.id, label: exec.name || "Unnamed Execution" }))}
              value={referenceExecutionId}
              onChange={(val) => setReferenceExecutionId(val as string)}
              disabled={isPending || isLoadingExecutions}
              placeholder={isLoadingExecutions ? t('form.reference.executionPlaceholderLoading') : t('form.reference.executionPlaceholder')}
              description={t('form.reference.executionDescription')}
              error={!isLoadingExecutions && availableExecutions.length === 0 ? t('form.reference.executionErrorEmpty') : undefined}
            />
          )}
        </>
      )}

      {/* Propagate to Template - Solo mostrar en modo edit cuando hasTemplate es true */}
      {mode === 'edit' && hasTemplate && (
        <HuemulField
          type="checkbox"
          label={t('form.propagate.toTemplate')}
          value={propagateToTemplate}
          onChange={(val) => setPropagateToTemplate(val as boolean)}
          disabled={isPending}
        />
      )}

      {/* Propagate to Assets - Solo mostrar en modo create cuando es template */}
      {mode === 'create' && templateId && (
        <HuemulField
          type="checkbox"
          label={t('form.propagate.toAssets')}
          value={propagateToAssets}
          onChange={(val) => setPropagateToAssets(val as boolean)}
          disabled={isPending}
        />
      )}

      {/* Propagate Prompt - Solo mostrar en modo edit cuando isTemplateSection es true */}
      {mode === 'edit' && isTemplateSection && (
        <HuemulField
          type="checkbox"
          label={t('form.propagate.toAssetsSections')}
          value={propagatePrompt}
          onChange={(val) => setPropagatePrompt(val as boolean)}
          disabled={isPending}
        />
      )}

      {/* Validation Messages */}
      <div className="min-h-[32px]">
        {type === "ai" && name && !prompt && !isGenerating && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            💡 {t('form.validation.aiHint')}
          </div>
        )}
        {type === "reference" && !selectedAsset && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠️ {t('form.validation.selectAsset')}
          </div>
        )}
        {type === "reference" && selectedAsset && !referenceSectionId && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠️ {t('form.validation.selectSection')}
          </div>
        )}
        {type === "reference" && referenceMode === "specific" && selectedAsset && !referenceExecutionId && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠️ {t('form.validation.selectExecution')}
          </div>
        )}
      </div>
    </form>
  );
}
