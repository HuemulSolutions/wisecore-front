import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Play, 
  Loader2, 
  CircleX,
  Plus 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { 
  getExecutionById, 
  executeDocument 
} from "@/services/executions";
import { getLLMs, getDefaultLLM } from "@/services/llms";
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";
import { handleApiError } from "@/lib/error-utils";

interface ExecuteSheetProps {
  selectedFile: {
    id: string;
    name: string;
    type: "folder" | "document";
    access_levels?: string[];
  } | null;
  fullDocument?: any;
  isLoadingFullDocument?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionSheetOpen: () => void;
  onExecutionComplete?: () => void;
  onExecutionCreated?: (executionId: string, mode: 'full' | 'full-single' | 'single' | 'from', sectionIndex?: number) => void;
  isMobile?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  selectedExecutionId?: string | null;
  executionContext?: { type: 'header' | 'section', sectionIndex?: number, sectionId?: string } | null;
}

export function ExecuteSheet({
  selectedFile,
  fullDocument,
  isLoadingFullDocument,
  isOpen,
  onOpenChange,
  onSectionSheetOpen,
  onExecutionComplete,
  onExecutionCreated,
  selectedExecutionId,
  executionContext}: ExecuteSheetProps) {
  // Estados para el Execute Sheet
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  const [sheetInstructions, setSheetInstructions] = useState("");
  const [sheetSelectedLLM, setSheetSelectedLLM] = useState<string>("");
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const [executionType, setExecutionType] = useState<'full' | 'full-single' | 'single' | 'from'>('full-single');
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  
  const { selectedOrganizationId } = useOrganization();
  const { t } = useTranslation('execute');
  
  // Refs para la inicialización
  const instructionsInitialized = useRef<boolean>(false);
  
  // Determinar si realmente estamos cargando el documento completo
  // Si el sheet está abierto pero no tenemos fullDocument, asumimos que está cargando
  const isActuallyLoadingFullDocument = isLoadingFullDocument || (isOpen && !fullDocument);

  // Fetch executions for the document to check for existing pending executions
  useExecutionsByDocumentId(
    selectedFile?.id || '',
    selectedOrganizationId || '',
    selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId && isOpen
  );

  // Query para obtener detalles de la ejecución actual
  const { data: currentExecution } = useQuery({
    queryKey: ["execution", currentExecutionId],
    queryFn: () => getExecutionById(currentExecutionId!, selectedOrganizationId!),
    enabled: !!currentExecutionId && !!selectedOrganizationId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Query para obtener LLMs (lazy loading: only when sheet is open)
  const { data: llms } = useQuery({
    queryKey: ["llms"],
    queryFn: getLLMs,
    enabled: isOpen, // Only fetch when sheet is actually open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Query para obtener LLM por defecto (lazy loading: only when sheet is open)
  const { data: defaultLLM, isLoading: isLoadingDefaultLLM } = useQuery({
    queryKey: ["default-llm"],
    queryFn: getDefaultLLM,
    enabled: isOpen, // Only fetch when sheet is actually open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Mutation para ejecutar documento (crear y ejecutar en una operación)
  const executeDocumentMutation = useMutation({
    mutationFn: ({ documentId, llmId, instructions, organizationId, singleSectionMode, startSectionId, executionId }: { 
      documentId: string; 
      llmId: string; 
      instructions?: string; 
      organizationId: string;
      singleSectionMode?: boolean;
      startSectionId?: string;
      executionId?: string;
    }) => 
      executeDocument({
        documentId,
        llmId,
        instructions,
        organizationId,
        singleSectionMode,
        startSectionId,
        executionId
      }),
    onSuccess: (executionData) => {
      toast.success(t('toast.success'));
      
      // El backend devuelve {execution: {...}, job: {...}}
      // Necesitamos acceder a execution.id
      const executionId = executionData.execution?.id || executionData.id;
      
      console.log('📦 Execute Sheet - Raw response:', executionData);
      console.log('🆔 Extracted execution ID:', executionId);
      
      setCurrentExecutionId(executionId);
      setHasAttemptedCreation(false);
      
      // Determinar el índice de la sección si aplica
      const sectionIdx = selectedSectionId && fullDocument?.sections 
        ? fullDocument.sections.findIndex((s: any) => s.id === selectedSectionId)
        : undefined;
      
      console.log('🚀 Execute Sheet - Execution created:', {
        executionId,
        executionType,
        selectedSectionId,
        sectionIdx,
        willPassIndex: (executionType === 'single' || executionType === 'from') && sectionIdx !== undefined && sectionIdx >= 0
      });
      
      // Siempre notificar la ejecución creada - el comportamiento se maneja en asset-content
      // Para single y from, SIEMPRE pasar el índice (incluso si es 0)
      const indexToPass = (executionType === 'single' || executionType === 'from') && sectionIdx !== undefined && sectionIdx >= 0 
        ? sectionIdx 
        : undefined;
      
      onExecutionCreated?.(executionId, executionType, indexToPass);
      onExecutionComplete?.();
      onOpenChange(false); // Cerrar el sheet inmediatamente
    },
    onError: (error) => {
      setHasAttemptedCreation(true);
      handleApiError(error);
    },
  });



  // Mutation para actualizar LLM



  // Nueva función para ejecutar documento directamente
  const handleExecuteDocument = () => {
    if (!selectedFile?.id) {
      toast.error(t('toast.noDocumentId'));
      return;
    }

    const llmToUse = sheetSelectedLLM || defaultLLM?.id;
    if (!llmToUse) {
      toast.error(t('toast.noModel'));
      return;
    }

    // Validar según el tipo de ejecución
    if (executionType === 'single') {
      // Single: requiere ejecución existente y sección seleccionada
      if (!selectedSectionId) {
        toast.error(t('toast.noSection'));
        return;
      }
      if (!currentExecutionId && !selectedExecutionId) {
        toast.error(t('toast.noExecution'));
        return;
      }
    } else if (executionType === 'from') {
      // From: requiere ejecución existente y sección seleccionada  
      if (!selectedSectionId) {
        toast.error(t('toast.noSection'));
        return;
      }
      if (!currentExecutionId && !selectedExecutionId) {
        toast.error(t('toast.noExecution'));
        return;
      }
    }

    const executionData: any = {
      documentId: selectedFile.id,
      llmId: llmToUse,
      instructions: sheetInstructions || undefined,
      organizationId: selectedOrganizationId!
    };

    // Configurar parámetros según el tipo de ejecución
    if (executionType === 'full') {
      // NUEVA VERSIÓN: Ejecutar todo el documento (nueva versión)
      executionData.singleSectionMode = false;
    } else if (executionType === 'full-single') {
      // NUEVA VERSIÓN: Ejecutar solo la primera sección (nueva versión)
      executionData.singleSectionMode = true;
    } else if (executionType === 'single') {
      // EDITAR EXISTENTE: Ejecutar solo una sección específica en la versión actual
      executionData.startSectionId = selectedSectionId;
      executionData.singleSectionMode = true;
      // Usar ejecución existente (la que está seleccionada actualmente)
      const executionIdToUse = currentExecutionId || selectedExecutionId;
      if (executionIdToUse) {
        executionData.executionId = executionIdToUse;
      }
    } else if (executionType === 'from') {
      // EDITAR EXISTENTE: Ejecutar desde una sección en adelante en la versión actual
      executionData.startSectionId = selectedSectionId;
      executionData.singleSectionMode = false;
      // Usar ejecución existente (la que está seleccionada actualmente)
      const executionIdToUse = currentExecutionId || selectedExecutionId;
      if (executionIdToUse) {
        executionData.executionId = executionIdToUse;
      }
    }

    executeDocumentMutation.mutate(executionData);
  };





  // Effect para inicializar datos de la ejecución en el sheet
  useEffect(() => {
    if (currentExecution) {      
      // Solo inicializar las instrucciones la primera vez, no sobrescribir cuando se actualiza el LLM
      if (!instructionsInitialized.current) {
        setSheetInstructions(currentExecution.instruction || "");
        instructionsInitialized.current = true;
      }
      
      setSheetSelectedLLM(currentExecution.llm_id || "");
    }
  }, [currentExecution]);



  // No longer auto-selecting existing executions on sheet open

  // Helper function to determine if a pending execution is new (never executed) or paused

  // Effect para inicializar el LLM por defecto cuando se abre el sheet
  useEffect(() => {
    if (isOpen && !currentExecution && defaultLLM?.id && !sheetSelectedLLM) {
      setSheetSelectedLLM(defaultLLM.id);
    }
  }, [isOpen, defaultLLM?.id, currentExecution, sheetSelectedLLM]);

  // Effect para resetear la ejecución cuando se cierra el sheet
  useEffect(() => {
    if (!isOpen) {
      setCurrentExecutionId(null);
      setSheetInstructions("");
      setSheetSelectedLLM("");
      setHasAttemptedCreation(false); // Reset the attempt flag when closing
      setExecutionType('full-single'); // Siempre resetear a 'full-single'
      setSelectedSectionId("");
      instructionsInitialized.current = false; // Resetear el flag de inicialización
    }
  }, [isOpen, currentExecution?.status]);

  // Effect para inicializar según el contexto de ejecución
  useEffect(() => {
    if (isOpen && executionContext) {
      if (executionContext.type === 'section') {
        // Desde sección: inicializar con single y sección seleccionada
        setExecutionType('single');
        if (executionContext.sectionId) {
          setSelectedSectionId(executionContext.sectionId);
        }
      } else {
        // Desde header: inicializar con full-single
        setExecutionType('full-single');
        setSelectedSectionId("");
      }
    }
  }, [isOpen, executionContext]);

  // Effect para actualizar selectedSectionId cuando fullDocument se carga
  // Si tenemos sectionIndex pero no sectionId en el contexto, obtener el ID del fullDocument
  useEffect(() => {
    if (isOpen && 
        executionContext?.type === 'section' && 
        executionContext.sectionIndex !== undefined && 
        !executionContext.sectionId && 
        fullDocument?.sections?.[executionContext.sectionIndex]?.id &&
        !selectedSectionId) {
      const sectionId = fullDocument.sections[executionContext.sectionIndex].id;
      console.log('🔄 [ExecuteSheet] Updating selectedSectionId from fullDocument:', sectionId);
      setSelectedSectionId(sectionId);
    }
  }, [isOpen, executionContext, fullDocument, selectedSectionId]);

  // Effect para resetear executionType cuando no hay ejecución actual ni seleccionada
  // SOLO aplica si el tipo ya era 'single' o 'from' y ya no hay ejecución disponible
  useEffect(() => {
    // Solo resetear si realmente no hay ninguna ejecución disponible
    const hasAvailableExecution = currentExecutionId || selectedExecutionId;
    if (!hasAvailableExecution && (executionType === 'single' || executionType === 'from')) {
      // Si viene del contexto de sección con sectionId, mantener 'single', sino 'full'
      if (executionContext?.type === 'section' && executionContext?.sectionId) {
        setExecutionType('single');
        setSelectedSectionId(executionContext.sectionId);
      } else {
        setExecutionType('full-single');
        setSelectedSectionId("");
      }
    }
  }, [currentExecutionId, selectedExecutionId, executionType, executionContext]);

  // Debug logging para entender el estado del botón
  useEffect(() => {
    if (isOpen) {
      const disabledReasons: string[] = [];
      
      if (isActuallyLoadingFullDocument) disabledReasons.push('Loading fullDocument');
      if (isLoadingDefaultLLM) disabledReasons.push('Loading defaultLLM');
      if (!fullDocument?.sections) disabledReasons.push('No fullDocument.sections');
      if (fullDocument?.sections && fullDocument.sections.length === 0) disabledReasons.push('Empty sections');
      if (executeDocumentMutation.isPending) disabledReasons.push('Mutation pending');
      if (!sheetSelectedLLM && !defaultLLM?.id) disabledReasons.push('No LLM selected/available');
      if ((executionType === 'single' || executionType === 'from') && !selectedSectionId) disabledReasons.push('Single/From mode without section');
      if ((executionType === 'single' || executionType === 'from') && !currentExecutionId && !selectedExecutionId) disabledReasons.push('Single/From mode without execution');
      
      console.log('🔍 [ExecuteSheet] Estado del botón:', {
        executionType,
        selectedSectionId,
        currentExecutionId,
        selectedExecutionId: selectedExecutionId,
        fullDocument_exists: !!fullDocument,
        fullDocument_sections: fullDocument?.sections?.length,
        defaultLLM_id: defaultLLM?.id,
        sheetSelectedLLM,
        isLoadingDefaultLLM,
        isLoadingFullDocument_raw: isLoadingFullDocument,
        isActuallyLoadingFullDocument,
        buttonDisabled: disabledReasons.length > 0,
        executionContext,
      });
      
      if (disabledReasons.length > 0) {
        console.log('🚫 [ExecuteSheet] Button DISABLED. Reasons:', disabledReasons);
      } else {
        console.log('✅ [ExecuteSheet] Button ENABLED');
      }
    }
  }, [isOpen, executionType, selectedSectionId, currentExecutionId, selectedExecutionId, fullDocument?.sections, fullDocument, defaultLLM?.id, sheetSelectedLLM, executeDocumentMutation.isPending, isLoadingDefaultLLM, isLoadingFullDocument, isActuallyLoadingFullDocument, executionContext]);

  // Computed options for HuemulField selects
  const executionScopeOptions = executionContext?.type === 'section'
    ? [
        { label: t('executionScope.thisSectionOnly'), value: 'single' },
        { label: t('executionScope.fromThisSection'), value: 'from' },
      ]
    : [
        { label: t('executionScope.firstSectionOnly'), value: 'full-single' },
        { label: t('executionScope.entireDocument'), value: 'full' },
      ];

  const executionScopeDescription =
    executionType === 'full' ? t('executionScope.desc.full') :
    executionType === 'full-single' ? t('executionScope.desc.fullSingle') :
    executionType === 'single' ? t('executionScope.desc.single') :
    executionType === 'from' ? t('executionScope.desc.from') : '';

  const sectionOptions = fullDocument?.sections?.map((section: any, index: number) => ({
    label: `#${index + 1} ${section.name}`,
    value: section.id,
  })) ?? [];

  const llmOptions = llms?.map((llm: any) => ({
    label: defaultLLM?.id === llm.id ? `${llm.name} (${t('languageModel.defaultBadge')})` : llm.name,
    value: llm.id,
  })) ?? [];

  return (
    <>
      <HuemulSheet
        open={isOpen}
        onOpenChange={onOpenChange}
        title={t('sheet.title')}
        description={t('sheet.description')}
        icon={Play}
        showFooter={false}
        maxWidth="w-full sm:max-w-[90vw] lg:max-w-[900px]"
        headerExtra={
          <HuemulButton
            requiredAccess={["create", "edit"]}
            requireAll={false}
            checkGlobalPermissions={true}
            resource="asset"
            onClick={handleExecuteDocument}
            loading={executeDocumentMutation.isPending || isActuallyLoadingFullDocument || isLoadingDefaultLLM}
            icon={Play}
            label={
              executeDocumentMutation.isPending ? t('button.creating') :
              (isActuallyLoadingFullDocument || isLoadingDefaultLLM) ? t('button.loading') :
              t('button.execute')
            }
            disabled={
              isActuallyLoadingFullDocument ||
              isLoadingDefaultLLM ||
              executeDocumentMutation.isPending ||
              (!isActuallyLoadingFullDocument && (!fullDocument?.sections || fullDocument.sections.length === 0)) ||
              (!isLoadingDefaultLLM && !sheetSelectedLLM && !defaultLLM?.id) ||
              ((executionType === 'single' || executionType === 'from') &&
                (!selectedSectionId || (!currentExecutionId && !selectedExecutionId)))
            }
            className="bg-[#4464f7] hover:bg-[#3451e6]"
          />
        }
      >
        <div className="space-y-6">
                  {/* Estado de carga mientras se ejecuta el documento */}
                  {executeDocumentMutation.isPending ? (
                    <Card className="border-0 shadow-sm border-l-4 border-l-[#4464f7]">
                      <CardContent className="py-8">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-[#4464f7]/10 rounded-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#4464f7]" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('pending.title')}</h3>
                          <p className="text-sm text-gray-600">{t('pending.description')}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : hasAttemptedCreation && executeDocumentMutation.isError ? (
                    <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
                      <CardContent className="py-8">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                            <CircleX className="h-8 w-8 text-red-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error.title')}</h3>
                          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                            {t('error.description')}
                          </p>
                        <HuemulButton
                          onClick={handleExecuteDocument}
                          loading={executeDocumentMutation.isPending}
                          disabled={isActuallyLoadingFullDocument || isLoadingDefaultLLM || (!sheetSelectedLLM && !defaultLLM?.id)}
                          icon={Play}
                          label={t('button.tryAgain')}
                          className="bg-[#4464f7] hover:bg-[#3451e6] px-6"
                        />
                        </div>
                      </CardContent>
                    </Card>
                  ) : !fullDocument?.sections || fullDocument.sections.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="py-12">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Play className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noSections.title')}</h3>
                          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                            {t('noSections.description')}
                          </p>
                          <HuemulButton
                            onClick={() => {
                              onOpenChange(false);
                              onSectionSheetOpen();
                            }}
                            icon={Plus}
                            label={t('button.addSections')}
                            className="bg-[#4464f7] hover:bg-[#3451e6] px-6"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    /* Configuration for new execution */
                    <div className="space-y-6">
                      {/* <div className="space-y-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          Execution Configuration
                        </h3>
                        <p className="text-sm text-gray-600">
                          Configure the settings for your new execution. Select a language model and provide any specific instructions.
                        </p>
                      </div> */}

                      <div className="space-y-6">
                        <HuemulField
                          type="select"
                          label={t('executionScope.label')}
                          required
                          value={executionType}
                          onChange={(v) => {
                            setExecutionType(v as 'full' | 'full-single' | 'single' | 'from');
                            if (executionContext?.type !== 'section') {
                              setSelectedSectionId("");
                            }
                          }}
                          options={executionScopeOptions}
                          placeholder={t('executionScope.placeholder')}
                          disabled={executeDocumentMutation.isPending}
                          description={executionScopeDescription}
                        />

                        {(executionType === 'single' || executionType === 'from') && (
                          executionContext?.type === 'section' ? (
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-900">
                                {t('selectedSection.label')} <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  <span className="text-sm font-medium text-blue-900">
                                    {t('selectedSection.sectionNumber', { number: (executionContext.sectionIndex || 0) + 1 })}
                                  </span>
                                </div>
                                <div className="text-sm text-blue-700">
                                  {fullDocument?.sections?.[executionContext.sectionIndex || 0]?.name || t('selectedSection.label')}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">
                                {executionType === 'single'
                                  ? t('selectedSection.desc.single')
                                  : t('selectedSection.desc.from')
                                }
                              </p>
                            </div>
                          ) : (
                            <HuemulField
                              type="select"
                              label={t('selectedSection.label')}
                              required
                              value={selectedSectionId}
                              onChange={(v) => setSelectedSectionId(String(v))}
                              options={sectionOptions}
                              placeholder={t('selectedSection.placeholder')}
                              disabled={executeDocumentMutation.isPending}
                              description={executionType === 'single' ? t('selectedSection.desc.single') : t('selectedSection.desc.from')}
                            />
                          )
                        )}

                        <HuemulField
                          type="select"
                          label={t('languageModel.label')}
                          required
                          value={sheetSelectedLLM}
                          onChange={(v) => setSheetSelectedLLM(String(v))}
                          options={llmOptions}
                          placeholder={t('languageModel.placeholder')}
                          disabled={executeDocumentMutation.isPending}
                          description={!sheetSelectedLLM ? t('languageModel.noModelDesc') : undefined}
                        />
                        
                        <HuemulField
                          type="textarea"
                          label={t('instructions.label')}
                          name="new-instructions"
                          value={sheetInstructions}
                          onChange={(v) => setSheetInstructions(String(v))}
                          rows={16}
                          placeholder={t('instructions.placeholder')}
                          disabled={executeDocumentMutation.isPending}
                          description={t('instructions.description')}
                          inputClassName="min-h-[280px]"
                        />
                      </div>
                    </div>
                  )}
        </div>
      </HuemulSheet>
    </>
  );
}