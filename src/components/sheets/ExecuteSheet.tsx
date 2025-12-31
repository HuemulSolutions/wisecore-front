import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Play, 
  Loader2, 
  CircleCheck, 
  CircleX,
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SectionExecutionSheet from "@/components/section_execution_sheet";
import EditDocumentDialog from "@/components/edit_document_dialog";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "../ui/sheet";
import { 
  getExecutionById, 
  approveExecution, 
  disapproveExecution,
  executeDocument 
} from "@/services/executions";
import { getLLMs, updateExecutionLLM, getDefaultLLM } from "@/services/llms";
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
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionSheetOpen: () => void;
  onExecutionComplete?: () => void;
  onExecutionCreated?: (executionId: string) => void;
  isMobile?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  selectedExecutionId?: string | null;
}

export function ExecuteSheet({
  selectedFile,
  fullDocument,
  isOpen,
  onOpenChange,
  onSectionSheetOpen,
  onExecutionComplete,
  onExecutionCreated,
  selectedExecutionId}: ExecuteSheetProps) {
  // Estados para el Execute Sheet
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [isGeneratingInSheet, setIsGeneratingInSheet] = useState(false);
  const [sheetInstructions, setSheetInstructions] = useState("");
  const [sheetSelectedLLM, setSheetSelectedLLM] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const [executionType, setExecutionType] = useState<'full' | 'single' | 'from'>('full');
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  
  // Query client para invalidar queries
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();
  
  // Refs para la inicialización
  const instructionsInitialized = useRef<boolean>(false);

  // Fetch executions for the document to check for existing pending executions
  const { data: documentExecutions } = useExecutionsByDocumentId(
    selectedFile?.id || '',
    selectedOrganizationId || '',
    selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId && isOpen
  );

  // Query para obtener detalles de la ejecución actual
  const { data: currentExecution, refetch: refetchExecution } = useQuery({
    queryKey: ["execution", currentExecutionId],
    queryFn: () => getExecutionById(currentExecutionId!, selectedOrganizationId!),
    enabled: !!currentExecutionId && !!selectedOrganizationId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Query para obtener LLMs
  const { data: llms } = useQuery({
    queryKey: ["llms"],
    queryFn: getLLMs,
  });

  // Query para obtener LLM por defecto
  const { data: defaultLLM } = useQuery({
    queryKey: ["default-llm"],
    queryFn: getDefaultLLM,
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
      setCurrentExecutionId(executionData.id);
      setHasAttemptedCreation(false);
      // Siempre notificar el ID de la ejecución que se está usando/creando
      onExecutionCreated?.(executionData.id);
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
  const updateLLMMutation = useMutation({
    mutationFn: (llmId: string) => updateExecutionLLM(currentExecutionId!, llmId),
    onSuccess: () => {
      toast.success("Model updated");
      refetchExecution();
    },
    onError: () => {
      toast.error("Failed to update model");
    }
  });



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

    // Validar que se haya seleccionado una sección si el tipo lo requiere
    if ((executionType === 'single' || executionType === 'from') && !selectedSectionId) {
      toast.error("Please select a section");
      return;
    }

    const executionData: any = {
      documentId: selectedFile.id,
      llmId: llmToUse,
      instructions: sheetInstructions || undefined,
      organizationId: selectedOrganizationId!
    };

    // Configurar parámetros según el tipo de ejecución
    if (executionType === 'full') {
      // Ejecutar todo el documento
      executionData.singleSectionMode = false;
    } else if (executionType === 'single') {
      // Ejecutar solo una sección específica (requiere ejecución existente)
      const executionIdToUse = currentExecutionId || selectedExecutionId;
      if (!executionIdToUse) {
        toast.error("Single section execution requires an existing execution");
        return;
      }
      executionData.startSectionId = selectedSectionId;
      executionData.singleSectionMode = true;
      executionData.executionId = executionIdToUse;
      // Notificar inmediatamente que vamos a usar esta ejecución
      if (!currentExecutionId) {
        onExecutionCreated?.(executionIdToUse);
      }
    } else if (executionType === 'from') {
      // Ejecutar desde una sección en adelante (requiere ejecución existente)
      const executionIdToUse = currentExecutionId || selectedExecutionId;
      if (!executionIdToUse) {
        toast.error("Execute from section requires an existing execution");
        return;
      }
      executionData.startSectionId = selectedSectionId;
      executionData.singleSectionMode = false;
      executionData.executionId = executionIdToUse;
      // Notificar inmediatamente que vamos a usar esta ejecución
      if (!currentExecutionId) {
        onExecutionCreated?.(executionIdToUse);
      }
    }

    executeDocumentMutation.mutate(executionData);
  };



  const handleApproveInSheet = async () => {
    if (!currentExecutionId) return;
    
    setIsApproving(true);
    try {
      await approveExecution(currentExecutionId, selectedOrganizationId!);
      refetchExecution();
      toast.success("Execution approved successfully");
      
      // Call the completion callback to refresh the main content
      onExecutionComplete?.();
    } catch (error) {
      console.error('Error approving execution:', error);
      toast.error("Error approving execution. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDisapproveInSheet = async () => {
    if (!currentExecutionId) return;
    
    setIsApproving(true);
    try {
      await disapproveExecution(currentExecutionId, selectedOrganizationId!);
      refetchExecution();
      toast.success("Execution disapproved successfully");
    } catch (error) {
      console.error('Error disapproving execution:', error);
      toast.error("Error disapproving execution. Please try again.");
    } finally {
      setIsApproving(false);
    }
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

  // Effect para buscar ejecuciones existentes cuando se abre el sheet
  useEffect(() => {
    if (isOpen && selectedFile && !currentExecutionId && documentExecutions) {
      // Buscar si ya existe una ejecución en proceso o pendiente
      const existingActiveExecution = documentExecutions?.find((execution: any) => 
        execution.status === 'pending' || execution.status === 'running'
      );
      
      if (existingActiveExecution) {
        console.log('Found existing active execution:', existingActiveExecution.id);
        setCurrentExecutionId(existingActiveExecution.id);
        onExecutionCreated?.(existingActiveExecution.id);
      }
    }
  }, [isOpen, selectedFile, currentExecutionId, documentExecutions]);

  // Helper function to determine if execution is actively running
  const isExecutionRunning = () => {
    return currentExecution?.status === "running" || isGeneratingInSheet;
  };

  // Helper function to determine if a pending execution is new (never executed) or paused
  const isPendingExecutionNew = () => {
    if (currentExecution?.status !== 'pending') return false;
    // Check if any section has generated content (output)
    return !currentExecution.sections?.some((section: any) => 
      section.output && section.output.trim().length > 0
    );
  };

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

  // Effect para resetear executionType cuando no hay ejecución actual ni seleccionada
  useEffect(() => {
    if (!currentExecutionId && !selectedExecutionId && (executionType === 'single' || executionType === 'from')) {
      setExecutionType('full');
      setSelectedSectionId("");
    }
  }, [currentExecutionId, selectedExecutionId, executionType]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-[90vw] lg:max-w-[900px] p-0"
          onPointerDownOutside={isExecutionRunning() ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={isExecutionRunning() ? (e) => e.preventDefault() : undefined}
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                    <Play className="h-4 w-4" />
                    {currentExecution ? 
                      (currentExecution.status === 'pending' ? 
                        (isPendingExecutionNew() ? 'Ready to Execute' : 'Continue Execution')
                        : 'Execute Document'
                      ) : 'Create New Execution'
                    }
                  </SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                    {currentExecution ? 
                      (currentExecution.status === 'pending' ? 
                        (isPendingExecutionNew() ? 
                          'Execution created successfully. Configure it and press Generate to start content creation.' 
                          : 'You have a pending execution. Configure it and generate content when ready.'
                        ) : 'Configure and execute this document to generate content.'
                      ) : 'Execute this document to generate new content based on its sections and context.'
                    }
                  </SheetDescription>
                </div>
                {/* Botón de acción centrado verticalmente */}
                <div className="flex items-center h-full gap-2 ml-4">
                  {currentExecution ? (
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (currentExecution.status === "completed") {
                          handleApproveInSheet();
                        } else if (currentExecution.status === "approved") {
                          handleDisapproveInSheet();
                        }
                      }}
                      disabled={isExecutionRunning() || (currentExecution.status !== "completed" && currentExecution.status !== "approved") || isApproving}
                      className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-8"
                      style={{ alignSelf: 'center' }}
                    >
                      {isExecutionRunning() ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Processing...
                        </>
                      ) : currentExecution.status === "completed" ? (
                        isApproving ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CircleCheck className="h-3.5 w-3.5 mr-1.5" />
                            Approve
                          </>
                        )
                      ) : currentExecution.status === "approved" ? (
                        isApproving ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Disapproving...
                          </>
                        ) : (
                          <>
                            <CircleX className="h-3.5 w-3.5 mr-1.5" />
                            Disapprove
                          </>
                        )
                      ) : null}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleExecuteDocument}
                      disabled={
                        !fullDocument?.sections || 
                        fullDocument.sections.length === 0 || 
                        executeDocumentMutation.isPending || 
                        (!sheetSelectedLLM && !defaultLLM?.id) ||
                        ((executionType === 'single' || executionType === 'from') && !selectedSectionId)
                      }
                      className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                      style={{ alignSelf: 'center' }}
                    >
                      {executeDocumentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute Document
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="space-y-6">
              {currentExecution ? (
                <>
                  {/* Execution Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Execution Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="sheet-instructions" className="block text-sm font-medium text-gray-700 mb-2">
                            Execution Instructions:
                          </label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <textarea
                                  id="sheet-instructions"
                                  value={sheetInstructions}
                                  onChange={(e) => setSheetInstructions(e.target.value)}
                                  placeholder="Describe any specific requirements, constraints, or instructions for this execution..."
                                  className={`w-full min-h-[100px] p-3 border rounded-md resize-vertical transition-colors ${
                                    currentExecution?.status !== "pending" || isExecutionRunning()
                                      ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  }`}
                                  rows={4}
                                  disabled={currentExecution?.status !== "pending" || isExecutionRunning()}
                                  readOnly={currentExecution?.status !== "pending"}
                                />
                              </TooltipTrigger>
                              {currentExecution?.status !== "pending" && (
                                <TooltipContent>
                                  <p>Instructions cannot be edited after execution has started</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Select
                            value={sheetSelectedLLM}
                            onValueChange={(v) => {
                              setSheetSelectedLLM(v);
                              updateLLMMutation.mutate(v);
                            }}
                            disabled={isExecutionRunning() || currentExecution?.status !== "pending" || updateLLMMutation.isPending}
                          >
                            <SelectTrigger className="w-full sm:w-[200px] hover:cursor-pointer">
                              <SelectValue placeholder={updateLLMMutation.isPending ? "Updating..." : "Select model"} />
                            </SelectTrigger>
                            <SelectContent>
                              {llms?.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Execution Sections */}
                  {currentExecution?.sections && currentExecution.sections.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Document Sections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {currentExecution.sections.map((section: any) => (
                            <SectionExecutionSheet
                              key={section.id}
                              sectionExecution={section}
                              onUpdate={refetchExecution}
                              readyToEdit={currentExecution.status === "completed" && !isExecutionRunning()}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <>
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
                          disabled={!sheetSelectedLLM && !defaultLLM?.id}
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
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          Execution Configuration
                        </h3>
                        <p className="text-sm text-gray-600">
                          Configure the settings for your new execution. Select a language model and provide any specific instructions.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-900">
                            Execution Scope <span className="text-red-500">*</span>
                          </label>
                          <Select
                            value={executionType}
                            onValueChange={(value: 'full' | 'single' | 'from') => {
                              setExecutionType(value);
                              setSelectedSectionId(""); // Reset section selection
                            }}
                            disabled={executeDocumentMutation.isPending}
                          >
                            <SelectTrigger className="w-full h-11 bg-white border-gray-300 hover:border-[#4464f7] focus:border-[#4464f7] focus:ring-2 focus:ring-[#4464f7]/20 transition-colors hover:cursor-pointer">
                              <SelectValue placeholder="Select execution scope" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full" className="cursor-pointer">
                                <div className="flex flex-col">
                                  <span className="font-medium">Execute Entire Document</span>
                                  <span className="text-xs text-gray-500">Generate content for all sections</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="single" className="cursor-pointer" disabled={!currentExecutionId && !selectedExecutionId}>
                                <div className="flex flex-col">
                                  <span className="font-medium">Execute Single Section</span>
                                  <span className="text-xs text-gray-500">
                                    {(!currentExecutionId && !selectedExecutionId)
                                      ? 'Requires an existing execution' 
                                      : 'Generate content for one specific section'}
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="from" className="cursor-pointer" disabled={!currentExecutionId && !selectedExecutionId}>
                                <div className="flex flex-col">
                                  <span className="font-medium">Execute From Section Onwards</span>
                                  <span className="text-xs text-gray-500">
                                    {(!currentExecutionId && !selectedExecutionId)
                                      ? 'Requires an existing execution' 
                                      : 'Generate from selected section to the end'}
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {(executionType === 'single' || executionType === 'from') && (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-900">
                              {executionType === 'single' ? 'Select Section' : 'Start From Section'} <span className="text-red-500">*</span>
                            </label>
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
                            <p className="text-xs text-gray-500">
                              {executionType === 'single' 
                                ? 'Only the selected section will be executed' 
                                : 'All sections from the selected one onwards will be executed'}
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
                </>
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