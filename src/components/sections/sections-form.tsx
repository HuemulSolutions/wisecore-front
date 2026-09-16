import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulOptionCardGroup } from "@/huemul/components/huemul-option-card-group";
import { HuemulTintedFieldset } from "@/huemul/components/huemul-tinted-fieldset";
import { Label } from "@/components/ui/label";
import { redactPrompt } from "@/services/generate";
import { useOrganization } from "@/contexts/organization-context";
import { getExecutionsByDocumentId } from "@/services/executions";
import { getDocumentSections, getDocumentById } from "@/services/assets";
import { getSectionContent } from "@/services/section";
import { SectionFormFieldsBuilder } from "./section-form-fields-builder";
import { SectionDependencyEditor } from "./section-dependency-editor";
import { SectionAiBlock } from "./section-ai-block";
import { SectionManualBlock } from "./section-manual-block";
import { SectionReferenceBlock } from "./section-reference-block";
import { SectionPropagationFields } from "./section-propagation-fields";
import { SECTION_TYPE_META, sectionTypeCards } from "./section-type-meta";
import { CUSTOM_FIELD_QUESTION_TYPE, QUESTION_TYPE, isCalculatedField, withFieldKey, stripFieldKey, sanitizeFieldDependsOn, type FormFieldDraft } from "./question-type-meta";
import { formFieldsHaveValidDependencies, sectionHasValidDependencies } from "./validate-form-field-dependencies";
import { formFieldsHaveValidCalculations } from "./validate-calculation-config";
import type { FieldDependencyCondition, SectionType } from "@/types/sections/core";
import type { SectionContextOption } from "@/types/sections/blocks";
import type { SectionPlateEditorRef } from "@/components/plate-editor/section-plate-editor";
import { useEditWithAi } from "@/hooks/useEditWithAi";
import { handleApiError } from "@/lib/error-utils";
import { logger } from "@/lib/logger";
import type { SectionFormProps } from '@/types/sections';
export type { SectionFormProps } from '@/types/sections';

export function SectionForm({
  mode,
  editorType = 'rich',
  formId = 'section-form',
  documentId,
  templateId,
  executionId,
  item,
  onSubmit, 
  isPending = false, 
  existingSections = [], 
  onValidationChange,
  onGeneratingChange,
  onDirtyChange,
  hasTemplate = false,
  isTemplateSection = false,
  defaultType,
  defaultManualInput,
}: SectionFormProps) {
  const { t } = useTranslation(['sections', 'templates']);
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const promptEditorRef = useRef<SectionPlateEditorRef>(null);
  const manualEditorRef = useRef<SectionPlateEditorRef>(null);
  const isInitialSyncDone = useRef(false);

  const markDirty = useCallback(() => {
    if (isInitialSyncDone.current) {
      onDirtyChange?.(true);
    }
  }, [onDirtyChange]);

  // Attach files uploaded from the section editor to the template or document.
  const mediaUploadTarget = useMemo(
    () =>
      templateId
        ? { level: 'template' as const, parentId: templateId }
        : documentId
          ? { level: 'document' as const, parentId: documentId }
          : null,
    [templateId, documentId],
  );
  
  // Estado inicial basado en el modo
  const [name, setName] = useState(mode === 'edit' && item ? item.name : "");
  const [type, setType] = useState<"ai" | "manual" | "reference" | "form">(mode === 'edit' && item ? (item as any).type || "ai" : (defaultType || "ai"));
  const [formFields, setFormFields] = useState<FormFieldDraft[]>(mode === 'edit' && item ? (item.form_fields || []).map(withFieldKey) : []);
  const [prompt, setPrompt] = useState(mode === 'edit' && item ? (item.prompt ?? "") : "");
  // Key para forzar el render del editor cuando cambia el prompt generado
  const [editorKey, setEditorKey] = useState(0);
  const [manualInput, setManualInput] = useState(mode === 'edit' && item ? (item as any).manual_input || "" : (defaultManualInput || ""));
  const [referenceSectionId, setReferenceSectionId] = useState(mode === 'edit' && item ? (item as any).reference_section_id || "" : "");
  const [referenceMode, setReferenceMode] = useState<"latest" | "specific">(mode === 'edit' && item ? (item as any).reference_mode || "latest" : "latest");
  const [referenceExecutionId, setReferenceExecutionId] = useState(mode === 'edit' && item ? (item as any).reference_execution_id || "" : "");
  // Dependencia condicional de la SECCIÓN (aplica a los 4 tipos), ver
  // "ia context/dependencias-condicionales-formularios-guide.md" §3.2.
  const [sectionDependsOn, setSectionDependsOn] = useState<FieldDependencyCondition[]>(
    mode === 'edit' && item ? (item.depends_on ?? []) : []
  );
  const [sectionShowWhenInactive, setSectionShowWhenInactive] = useState(
    mode === 'edit' && item ? (item.show_when_inactive ?? false) : false
  );
  // `GET /templates/{id}` no devuelve depends_on/show_when_inactive en sus secciones, así
  // que en modo edit el estado arranca vacío aunque la sección SÍ tenga una condición
  // guardada. Si se enviara igual, editar cualquier otra cosa de la sección la borraría en
  // silencio. Solo se envían si el usuario tocó el editor, o si el item trajo el valor.
  const [sectionDependencyTouched, setSectionDependencyTouched] = useState(false);
  const [selectedDependencies, setSelectedDependencies] = useState<Array<{id: string; name: string}>>(
    mode === 'edit' && item ? item.dependencies : []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiEditOpen, setIsAiEditOpen] = useState(false);
  const [promptBeforeAiEdit, setPromptBeforeAiEdit] = useState<string | null>(null);
  const editWithAiMutation = useEditWithAi();
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

  // Lista de ejecuciones disponibles (todas las que tengan status completed o approved)
  const availableExecutions = useMemo(() => {
    // Verificar si assetExecutions es directamente un array o tiene una propiedad data
    const executionsArray = Array.isArray(assetExecutions)
      ? assetExecutions
      : assetExecutions?.data;

    if (!executionsArray || !Array.isArray(executionsArray)) {
      return [];
    }

    return executionsArray.filter((exec: any) =>
      exec.status === 'completed' || exec.status === 'approved'
    );
  }, [assetExecutions]);

  // Selección de asset vía HuemulAssetTreePickerDialog (mode="document") —
  // ver ia context/arbol-biblioteca-activos-guide.md, ya no un árbol inline.
  const handleAssetPick = (id: string, label: string) => {
    setSelectedAsset({ id, name: label });
    // Resetear sección y execution ID cuando cambie el asset
    setSelectedSection(null);
    setReferenceSectionId("");
    setReferenceExecutionId("");
    markDirty();
  };

  const handleClearAsset = () => {
    setSelectedAsset(null);
    setSelectedSection(null);
    setReferenceSectionId("");
    setReferenceExecutionId("");
    markDirty();
  };

  const handleReferenceSectionChange = (sectionId: string, sectionName: string) => {
    setReferenceSectionId(sectionId);
    setSelectedSection({ id: sectionId, name: sectionName });
    markDirty();
  };

  const handleReferenceModeChange = (nextMode: "latest" | "specific") => {
    setReferenceMode(nextMode);
    if (nextMode === "latest") setReferenceExecutionId("");
    markDirty();
  };

  const handleReferenceExecutionChange = (executionId: string) => {
    setReferenceExecutionId(executionId);
    markDirty();
  };

  const handleRefreshPreview = () => {
    queryClient.invalidateQueries({
      queryKey: ['section-preview', referenceSectionId, referenceExecutionId, referenceMode],
    });
  };

  // Sincronizar con item cuando cambie (modo edit)
  useEffect(() => {
    if (mode !== 'edit' || !item) return;

    isInitialSyncDone.current = false;
    setName(item.name);
    setType((item as any).type || "ai");
    setPrompt(item.prompt ?? "");
    setPromptBeforeAiEdit(null);
    const manualInputValue = (item as any).manual_input || "";
    setManualInput(manualInputValue);
    const refSectionId = (item as any).reference_section_id || "";
    const refDocumentId = (item as any).referenced_document_id || "";
    setReferenceSectionId(refSectionId);
    setReferenceMode((item as any).reference_mode || "latest");
    setReferenceExecutionId((item as any).reference_execution_id || "");
    setSelectedDependencies([...item.dependencies]);
    setFormFields((item.form_fields || []).map(withFieldKey));
    setSectionDependsOn(item.depends_on ?? []);
    setSectionShowWhenInactive(item.show_when_inactive ?? false);
    setSectionDependencyTouched(false);

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

    // Plate fires onChange during initial normalization — delay the flag so those
    // initialization events don't incorrectly mark the form as dirty.
    const timer = setTimeout(() => {
      isInitialSyncDone.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, [item, mode, editorType]);

  const handleGeneratePrompt = async () => {
    if (!name.trim()) return;
    markDirty();
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
          logger.error('Error generating prompt:', error);
        },
        onClose: () => {
          setIsGenerating(false);
          // Forzar render del editor cambiando la key
          setEditorKey(prev => prev + 1);
        }
      });
    } catch (error) {
      logger.error('Error in prompt generation:', error);
      setIsGenerating(false);
      setEditorKey(prev => prev + 1);
    }
  };

  const handleEditPromptWithAi = async (instruction: string) => {
    markDirty();
    const previousPrompt = prompt;
    try {
      const edited = await editWithAiMutation.mutateAsync({
        text: prompt,
        prompt: instruction,
        sectionId: item?.id,
        templateId,
        executionId,
        organizationId: selectedOrganizationId!,
      });
      setPromptBeforeAiEdit(previousPrompt);
      setPrompt(edited);
      setEditorKey(prev => prev + 1);
      setIsAiEditOpen(false);
    } catch (error) {
      handleApiError(error, { fallbackMessage: t('form.prompt.editError') });
    }
  };

  const handleUndoAiEdit = () => {
    if (promptBeforeAiEdit === null) return;
    setPrompt(promptBeforeAiEdit);
    setEditorKey(prev => prev + 1);
    setPromptBeforeAiEdit(null);
    markDirty();
  };

  const handleDependenciesChange = (ids: string[]) => {
    setSelectedDependencies(
      ids.map(id => {
        const section = existingSections.find(s => s.id === id);
        return { id, name: section?.name || `Section ${id}` };
      })
    );
    markDirty();
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        // Rasterize + upload any changed Mermaid diagram before reading markdown, so
        // the diagram references a real snapshot instead of getting lost (this form
        // only persists markdown, not plate_content).
        await manualEditorRef.current?.ensureMermaidSnapshots?.();
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
      } else if (type === "form") {
        submitData.form_fields = formFields.map((f, idx) => ({ ...sanitizeFieldDependsOn(stripFieldKey(f)), order: idx + 1 }));
      }

      // Dependencia condicional de la sección — se envía siempre (también vacía): el
      // backend conserva el valor previo si estas claves no viajan, así que omitirlas
      // en modo edit haría imposible borrar una dependencia ya guardada.
      submitData.depends_on = sectionDependsOn.filter(c => c.field_id.trim());
      submitData.show_when_inactive = sectionShowWhenInactive;

      if (templateId) {
        submitData.template_id = templateId;
        if (propagateToAssets) {
          submitData.propagate_to_documents = true;
        }
      } else if (documentId) {
        submitData.document_id = documentId;
      }

      onDirtyChange?.(false);
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
        // Rasterize + upload any changed Mermaid diagram before reading markdown, so
        // the diagram references a real snapshot instead of getting lost (this form
        // only persists markdown, not plate_content).
        await manualEditorRef.current?.ensureMermaidSnapshots?.();
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
      } else if (type === "form") {
        submitData.form_fields = formFields.map((f, idx) => ({ ...sanitizeFieldDependsOn(stripFieldKey(f)), order: idx + 1 }));
      }

      // Dependencia condicional de la sección — se envía siempre que el estado local sea
      // confiable (el usuario tocó el editor, o el item trajo el valor del backend),
      // también vacía: el backend conserva el valor previo si estas claves no viajan, así
      // que omitirlas cuando el usuario sí editó haría imposible borrar una dependencia
      // ya guardada. Al revés, enviarlas cuando el GET nunca entregó el valor borraría en
      // silencio la condición existente.
      if (sectionDependencyTouched || item?.depends_on !== undefined) {
        submitData.depends_on = sectionDependsOn.filter(c => c.field_id.trim());
        submitData.show_when_inactive = sectionShowWhenInactive;
      }

      if (hasTemplate) {
        submitData.propagate_to_template = propagateToTemplate;
      }
      
      if (isTemplateSection) {
        submitData.propagate_to_sections = propagatePrompt;
      }

      onDirtyChange?.(false);
      onSubmit(submitData);
    }
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    markDirty();
  };

  // Preguntas de secciones anteriores (order menor a la actual), disponibles para
  // depends_on cross-sección en el builder de form_fields. No requiere fetch adicional:
  // existingSections ya trae form_fields completos (ver ia context/dependencias-condicionales-formularios-guide.md).
  const currentSectionOrder = mode === 'edit' && item ? item.order : existingSections.length + 1;
  const earlierSectionsFormFields = existingSections
    .filter(section => section.type === 'form' && (section.order ?? 0) < currentSectionOrder)
    .flatMap(section => section.form_fields ?? []);

  // Mismos targets que earlierSectionsFormFields, sin las preguntas puramente visuales
  // (etiqueta/separador no tiene valor sobre el cual condicionar) — usados por la
  // dependencia de la SECCIÓN, que aplica a los 4 tipos de sección.
  const sectionDependencyFields = earlierSectionsFormFields.filter(
    f => f.question_type !== QUESTION_TYPE.label
  );

  // Posición 1-based de cada sección en la lista actual — mismo criterio que
  // dependencyContextLabel (src/lib/template-section-summary.ts): el número
  // que ve el usuario en el círculo de orden de esa fila, no el `order` crudo.
  const sectionIndexById = new Map(existingSections.map((s, i) => [s.id, i + 1]));

  // Contexto de la sección IA: solo secciones anteriores a esta — una sección
  // no puede leer contenido que todavía no se generó.
  const earlierSectionOptions: SectionContextOption[] = existingSections
    .filter(section => (section.order ?? 0) < currentSectionOrder)
    .map(section => ({
      id: section.id,
      name: section.name,
      type: (section.type ?? "ai") as SectionType,
      position: sectionIndexById.get(section.id) ?? 0,
    }));

  // Compatibilidad: una dependencia ya guardada hacia una sección posterior
  // (configuración vieja) se sigue listando, marcada, solo para desmarcar —
  // no se puede crear una nueva así.
  const laterSelectedOptions: SectionContextOption[] = selectedDependencies
    .filter(dep => !earlierSectionOptions.some(o => o.id === dep.id))
    .map(dep => {
      const section = existingSections.find(s => s.id === dep.id);
      return {
        id: dep.id,
        name: dep.name,
        type: (section?.type ?? "ai") as SectionType,
        position: sectionIndexById.get(dep.id) ?? 0,
        isLaterSection: true,
      };
    });

  const contextOptions: SectionContextOption[] = [...earlierSectionOptions, ...laterSelectedOptions];

  // Notificar cambios en la validación
  const sectionDependenciesOk = sectionHasValidDependencies(sectionDependsOn, sectionDependencyFields);
  const isFormValid = (() => {
    if (!name.trim() || isGenerating) return false;
    if (!sectionDependenciesOk) return false;

    if (type === "ai") {
      return prompt.trim().length > 0;
    } else if (type === "manual") {
      return true;
    } else if (type === "reference") {
      if (!referenceSectionId || !referenceMode) return false;
      if (referenceMode === "specific" && !referenceExecutionId) return false;
      return true;
    } else if (type === "form") {
      if (formFields.length === 0) return false;
      const allFilled = formFields.every(f => f.field_id.trim() && f.field_name.trim() && f.question_type);
      const ids = formFields.map(f => f.field_id.trim());
      const unique = new Set(ids).size === ids.length;
      const customOk = formFields.every(
        f => f.question_type !== CUSTOM_FIELD_QUESTION_TYPE || !!f.custom_field_id
      );
      const dependenciesOk = formFieldsHaveValidDependencies(formFields, earlierSectionsFormFields);
      const calculatedOk = formFields.every(f => !isCalculatedField(f) || !!f.calculation_config);
      const calculationsOk = formFieldsHaveValidCalculations(formFields, earlierSectionsFormFields);
      return allFilled && unique && customOk && dependenciesOk && calculatedOk && calculationsOk;
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
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5.5">
      <HuemulField
        type="text"
        label={t('form.sectionName.label')}
        name="section-name"
        placeholder={t('form.sectionName.placeholder')}
        value={name}
        onChange={(val) => { setName(val as string); markDirty(); }}
        disabled={isPending || isFromTemplate}
        autoFocus={mode === 'create'}
        autoComplete="off"
        required
        description={isFromTemplate ? t('form.sectionName.descriptionFromTemplate') : undefined}
      />

      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-medium text-[#334155]">{t('form.sectionType.question')}</Label>
        <p className="text-xs text-[#64748b]">{t('form.sectionType.help')}</p>
        <HuemulOptionCardGroup
          value={type}
          onChange={(next) => { setType(next); markDirty(); }}
          options={sectionTypeCards(t)}
          disabled={isPending}
        />
      </div>

      {/* Bloque de configuración del tipo elegido — uno solo visible a la vez */}
      {type === "form" && (
        <HuemulTintedFieldset
          title={t('form.blocks.formTitle')}
          accent={SECTION_TYPE_META.form.color}
          borderColor="#e2e8f0"
          background="#fbfcfd"
        >
          <SectionFormFieldsBuilder
            value={formFields}
            onChange={(next) => { setFormFields(next); markDirty(); }}
            earlierSectionsFields={earlierSectionsFormFields}
            isPending={isPending}
          />
        </HuemulTintedFieldset>
      )}

      {type === "ai" && (
        <SectionAiBlock
          editorType={editorType}
          editorKey={editorKey}
          promptEditorRef={promptEditorRef}
          prompt={prompt}
          onPromptChange={handlePromptChange}
          isPending={isPending}
          isGenerating={isGenerating}
          canGeneratePrompt={!!name.trim()}
          onGeneratePrompt={handleGeneratePrompt}
          canEditWithAi={true}
          isEditingWithAi={editWithAiMutation.isPending}
          onOpenAiEdit={() => setIsAiEditOpen(true)}
          isAiEditOpen={isAiEditOpen}
          onAiEditOpenChange={setIsAiEditOpen}
          onSendAiEdit={handleEditPromptWithAi}
          promptBeforeAiEdit={promptBeforeAiEdit}
          onUndoAiEdit={handleUndoAiEdit}
          organizationId={selectedOrganizationId ?? undefined}
          documentId={documentId}
          mediaUploadTarget={mediaUploadTarget}
          contextOptions={contextOptions}
          selectedContextIds={selectedDependencies.map(dep => dep.id)}
          onContextChange={handleDependenciesChange}
        />
      )}

      {type === "manual" && (
        <SectionManualBlock
          editorKey={editorKey}
          manualEditorRef={manualEditorRef}
          manualInput={manualInput}
          sectionId={item?.id ?? 'new'}
          organizationId={selectedOrganizationId ?? undefined}
          documentId={documentId}
          mediaUploadTarget={mediaUploadTarget}
          onChange={markDirty}
        />
      )}

      {type === "reference" && (
        <SectionReferenceBlock
          isPending={isPending}
          organizationId={selectedOrganizationId ?? ""}
          selectedAsset={selectedAsset}
          onAssetPick={handleAssetPick}
          onClearAsset={handleClearAsset}
          assetSections={(assetSections ?? []).map((s: any) => ({ id: s.id, name: s.name }))}
          isLoadingSections={isLoadingSections}
          referenceSectionId={referenceSectionId}
          onReferenceSectionChange={handleReferenceSectionChange}
          referenceMode={referenceMode}
          onReferenceModeChange={handleReferenceModeChange}
          availableExecutions={availableExecutions.map((exec: any) => ({
            id: exec.id,
            name: exec.name || t('form.reference.unnamedExecution'),
          }))}
          isLoadingExecutions={isLoadingExecutions}
          referenceExecutionId={referenceExecutionId}
          onReferenceExecutionChange={handleReferenceExecutionChange}
          previewContent={sectionPreview?.content}
          isLoadingPreview={isLoadingPreview}
          onRefreshPreview={handleRefreshPreview}
        />
      )}

      {/* Dependencia condicional de la sección — aplica a los 4 tipos, no solo form */}
      <SectionDependencyEditor
        sectionKey={mode === 'edit' && item ? item.id : 'new'}
        conditions={sectionDependsOn}
        showWhenInactive={sectionShowWhenInactive}
        availableFields={sectionDependencyFields}
        onChange={(conditions, showWhenInactive) => {
          setSectionDependsOn(conditions);
          setSectionShowWhenInactive(showWhenInactive);
          setSectionDependencyTouched(true);
          markDirty();
        }}
        disabled={isPending}
      />

      <SectionPropagationFields
        showToDocuments={mode === 'create' && !!templateId}
        propagateToDocuments={propagateToAssets}
        onPropagateToDocumentsChange={(checked) => { setPropagateToAssets(checked); markDirty(); }}
        showToSections={mode === 'edit' && isTemplateSection}
        propagateToSections={propagatePrompt}
        onPropagateToSectionsChange={(checked) => { setPropagatePrompt(checked); markDirty(); }}
        showToTemplate={mode === 'edit' && hasTemplate}
        propagateToTemplate={propagateToTemplate}
        onPropagateToTemplateChange={(checked) => { setPropagateToTemplate(checked); markDirty(); }}
        disabled={isPending}
      />
    </form>
  );
}
