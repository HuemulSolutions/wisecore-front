import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Play, 
  Loader2, 
  CircleX,
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import EditDocumentDialog from "@/components/assets/dialogs/assets-edit-dialog";
import { DocumentActionButton } from "@/components/assets/content/assets-access-control";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  getExecutionById, 
  executeDocument 
} from "@/services/executions";
import { getLLMs, getDefaultLLM } from "@/services/llms";
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";

interface ExecuteSheetProps {
  selectedFile: {
    id: string;
    name: string;
    type: "folder" | "document";
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
  const [isGeneratingInSheet, setIsGeneratingInSheet] = useState(false);
  const [sheetInstructions, setSheetInstructions] = useState("");
  const [sheetSelectedLLM, setSheetSelectedLLM] = useState<string>("");
  const [] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const [executionType, setExecutionType] = useState<'full' | 'full-single' | 'single' | 'from'>('full');
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  
  // Query client para invalidar queries
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();
  
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
      toast.success("Document execution started successfully");
      
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
      console.error("Error executing document:", error);
      toast.error("Error executing document: " + (error as Error).message);
      setHasAttemptedCreation(true);
    },
  });



  // Mutation para actualizar LLM



  // Nueva función para ejecutar documento directamente
  const handleExecuteDocument = () => {
    if (!selectedFile?.id) {
      toast.error("Document ID not available");
      return;
    }

    const llmToUse = sheetSelectedLLM || defaultLLM?.id;
    if (!llmToUse) {
      toast.error("Please select a language model");
      return;
    }

    // Validar según el tipo de ejecución
    if (executionType === 'single') {
      // Single: requiere ejecución existente y sección seleccionada
      if (!selectedSectionId) {
        toast.error("Please select a section");
        return;
      }
      if (!currentExecutionId && !selectedExecutionId) {
        toast.error("Please select an existing execution to modify");
        return;
      }
    } else if (executionType === 'from') {
      // From: requiere ejecución existente y sección seleccionada  
      if (!selectedSectionId) {
        toast.error("Please select a section");
        return;
      }
      if (!currentExecutionId && !selectedExecutionId) {
        toast.error("Please select an existing execution to modify");
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

  // Effect para sincronizar el estado de generación con el estado real de la ejecución
  useEffect(() => {
    if (currentExecution?.status === "completed" || currentExecution?.status === "failed") {
      setIsGeneratingInSheet(false);
    } else if (currentExecution?.status === "running") {
      // Si la ejecución está corriendo, marcar como generando
      setIsGeneratingInSheet(true);
    }
  }, [currentExecution?.status]);

  // No longer auto-selecting existing executions on sheet open

  // Helper function to determine if execution is actively running
  const isExecutionRunning = () => {
    return currentExecution?.status === "running" || isGeneratingInSheet;
  };

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
      setExecutionType('full'); // Siempre resetear a 'full'
      setSelectedSectionId("");
      // No resetear isGeneratingInSheet aquí si la ejecución sigue corriendo
      if (currentExecution?.status !== "running") {
        setIsGeneratingInSheet(false);
      }
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
        // Desde header: inicializar con full
        setExecutionType('full');
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
        setExecutionType('full');
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-[90vw] lg:max-w-[900px] p-0"
          onPointerDownOutside={isExecutionRunning() ? (e: { preventDefault: () => any; }) => e.preventDefault() : undefined}
          onEscapeKeyDown={isExecutionRunning() ? (e: { preventDefault: () => any; }) => e.preventDefault() : undefined}
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                    <Play className="h-4 w-4" />
                    Execute Document
                  </SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                    Configure and execute this document to generate content based on its sections.
                  </SheetDescription>
                </div>
                {/* Botón de acción centrado verticalmente */}
                <div className="flex items-center h-full gap-2 ml-4">
                  <DocumentActionButton
                    accessLevels={selectedFile?.access_levels || []}
                    requiredAccess={["create", "edit"]}
                    requireAll={false}
                    checkGlobalPermissions={true}
                    resource="assets"
                    onClick={handleExecuteDocument}
                    disabled={
                      // Prioridad 1: Estados de carga - mantener deshabilitado durante carga
                      isActuallyLoadingFullDocument ||
                      isLoadingDefaultLLM ||
                      // Prioridad 2: Mutation en proceso
                      executeDocumentMutation.isPending ||
                      // Prioridad 3: Validaciones de datos (solo si NO está cargando)
                      (!isActuallyLoadingFullDocument && (!fullDocument?.sections || fullDocument.sections.length === 0)) ||
                      (!isLoadingDefaultLLM && !sheetSelectedLLM && !defaultLLM?.id) ||
                      // Prioridad 4: Validación específica para single y from
                      ((executionType === 'single' || executionType === 'from') && 
                        (!selectedSectionId || (!currentExecutionId && !selectedExecutionId)))
                    }
                    className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                    style={{ alignSelf: 'center' }}
                  >
                    {executeDocumentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (isActuallyLoadingFullDocument || isLoadingDefaultLLM) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Execute Document
                      </>
                    )}
                  </DocumentActionButton>
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="space-y-6">
                  {/* Estado de carga mientras se ejecuta el documento */}
                  {executeDocumentMutation.isPending ? (
                    <Card className="border-0 shadow-sm border-l-4 border-l-[#4464f7]">
                      <CardContent className="py-8">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-[#4464f7]/10 rounded-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#4464f7]" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Executing Document</h3>
                          <p className="text-sm text-gray-600">Starting document execution, this may take a few moments...</p>
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Execute Document</h3>
                          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                            There was an error executing the document. Please check your configuration and try again.
                          </p>
                        <Button
                          onClick={handleExecuteDocument}
                          disabled={isActuallyLoadingFullDocument || isLoadingDefaultLLM || (!sheetSelectedLLM && !defaultLLM?.id)}
                          className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer px-6"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sections Available</h3>
                          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                            This document needs sections before it can be executed. Add some sections to get started with content generation.
                          </p>
                          <Button
                            onClick={() => {
                              onOpenChange(false);
                              onSectionSheetOpen();
                            }}
                            className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer px-6"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Sections
                          </Button>
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
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-900">
                            Execution Scope <span className="text-red-500">*</span>
                          </label>
                          <Select
                            value={executionType}
                            onValueChange={(value: 'full' | 'full-single' | 'single' | 'from') => {
                              setExecutionType(value);
                              // Solo resetear section selection si no viene del contexto de sección
                              if (executionContext?.type !== 'section') {
                                setSelectedSectionId("");
                              }
                            }}
                            disabled={executeDocumentMutation.isPending}
                          >
                            <SelectTrigger className="w-full h-11 bg-white border-gray-300 hover:border-[#4464f7] focus:border-[#4464f7] focus:ring-2 focus:ring-[#4464f7]/20 transition-colors hover:cursor-pointer">
                              <SelectValue placeholder="Select execution scope" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Opciones disponibles desde header */}
                              {(!executionContext || executionContext.type === 'header') && (
                                <>
                                  <SelectItem value="full" className="cursor-pointer">
                                    <span className="font-medium">Execute Entire Document</span>
                                  </SelectItem>
                                  
                                  <SelectItem value="full-single" className="cursor-pointer">
                                    <span className="font-medium">Execute First Section Only</span>
                                  </SelectItem>
                                </>
                              )}
                              
                              {/* Opciones disponibles desde sección */}
                              {executionContext?.type === 'section' && (
                                <>
                                  <SelectItem value="single" className="cursor-pointer">
                                    <span className="font-medium">Execute This Section Only</span>
                                  </SelectItem>
                                  
                                  <SelectItem value="from" className="cursor-pointer">
                                    <span className="font-medium">Execute From This Section Onwards</span>
                                  </SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          {executionType && (
                            <p className="text-xs text-gray-500">
                              {executionType === 'full' && 'Generate content for all sections (new version)'}
                              {executionType === 'full-single' && 'Generate content for the first section only (new version)'}
                              {executionType === 'single' && 'Generate content for this specific section (modifies existing)'}
                              {executionType === 'from' && 'Generate from this section to the end (modifies existing)'}
                            </p>
                          )}
                        </div>

                        {(executionType === 'single' || executionType === 'from') && (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-900">
                              Selected Section
                              <span className="text-red-500">*</span>
                            </label>
                            
                            {executionContext?.type === 'section' ? (
                              // Mostrar badge cuando viene del contexto de sección
                              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  <span className="text-sm font-medium text-blue-900">
                                    Section #{(executionContext.sectionIndex || 0) + 1}
                                  </span>
                                </div>
                                <div className="text-sm text-blue-700">
                                  {fullDocument?.sections?.[executionContext.sectionIndex || 0]?.name || 'Selected Section'}
                                </div>
                              </div>
                            ) : (
                              // Selector normal cuando viene del header
                              <>
                                <Select
                                  value={selectedSectionId}
                                  onValueChange={setSelectedSectionId}
                                  disabled={executeDocumentMutation.isPending}
                                >
                                  <SelectTrigger className="w-full h-11 bg-white border-gray-300 hover:border-[#4464f7] focus:border-[#4464f7] focus:ring-2 focus:ring-[#4464f7]/20 transition-colors hover:cursor-pointer">
                                    <SelectValue placeholder="Select a section" />
                                  </SelectTrigger>
                                  <SelectContent className="max-w-full">
                                    {fullDocument?.sections?.map((section: any, index: number) => (
                                      <SelectItem key={section.id} value={section.id} className="cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
                                          <span className="font-medium truncate">{section.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                            
                            <p className="text-xs text-gray-500">
                              {executionType === 'single' 
                                ? 'Only this section will be executed'
                                : 'All sections from this one onwards will be executed'
                              }
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-900">
                            Language Model <span className="text-red-500">*</span>
                          </label>
                          <Select
                            value={sheetSelectedLLM}
                            onValueChange={setSheetSelectedLLM}
                            disabled={executeDocumentMutation.isPending}
                          >
                            <SelectTrigger className="w-full h-11 bg-white border-gray-300 hover:border-[#4464f7] focus:border-[#4464f7] focus:ring-2 focus:ring-[#4464f7]/20 transition-colors hover:cursor-pointer">
                              <SelectValue placeholder="Select a language model" />
                            </SelectTrigger>
                            <SelectContent className="max-w-full">
                              {llms?.map((llm: any) => (
                                <SelectItem key={llm.id} value={llm.id} className="cursor-pointer">
                                  <div className="flex items-center justify-between w-full gap-3">
                                    <span className="font-medium">{llm.name}</span>
                                    {defaultLLM?.id === llm.id && (
                                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium border border-blue-200">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!sheetSelectedLLM && (
                            <p className="text-xs text-gray-500">
                              Please select a language model to proceed with the execution.
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <label htmlFor="new-instructions" className="block text-sm font-medium text-gray-900">
                            Execution Instructions
                            <span className="text-sm font-normal text-gray-500 ml-1">(Optional)</span>
                          </label>
                          <textarea
                            id="new-instructions"
                            value={sheetInstructions}
                            onChange={(e) => setSheetInstructions(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-[#4464f7] focus:outline-none focus:ring-2 focus:ring-[#4464f7]/20 focus:border-[#4464f7] resize-none transition-colors"
                            rows={5}
                            placeholder="Enter any specific instructions for this execution. For example: 'Focus on technical details' or 'Keep it concise and professional'..."
                            disabled={executeDocumentMutation.isPending}
                          />
                          <p className="text-xs text-gray-500">
                            These instructions will guide the AI during content generation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          </div>
          
          {/* SheetFooter eliminado, el botón ahora está solo en el header */}
        </div>
      </SheetContent>
      </Sheet>

      {/* Edit Document Dialog */}
      <EditDocumentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        documentId={selectedFile?.id || ''}
        currentName={selectedFile?.name || ''}
        currentDescription={fullDocument?.description}
        onUpdated={(newName) => {
          // Invalidate queries to refresh document data
          queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
          queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
          console.log('Document updated with new name:', newName);
        }}
      />
    </>
  );
}