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
import ExecutionInfoSheet from "@/components/execution_info_sheet";
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
}

export function ExecuteSheet({
  selectedFile,
  fullDocument,
  isOpen,
  onOpenChange,
  onSectionSheetOpen,
  onExecutionComplete,
  onExecutionCreated}: ExecuteSheetProps) {
  // Estados para el Execute Sheet
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [isGeneratingInSheet, setIsGeneratingInSheet] = useState(false);
  const [sheetInstructions, setSheetInstructions] = useState("");
  const [sheetSelectedLLM, setSheetSelectedLLM] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  
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
    mutationFn: ({ documentId, llmId, instructions, organizationId }: { documentId: string; llmId: string; instructions?: string; organizationId: string }) => 
      executeDocument({
        documentId,
        llmId,
        instructions,
        organizationId
      }),
    onSuccess: (executionData) => {
      toast.success("Document execution started successfully");
      setCurrentExecutionId(executionData.id);
      setHasAttemptedCreation(false);
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

    executeDocumentMutation.mutate({
      documentId: selectedFile.id,
      llmId: llmToUse,
      instructions: sheetInstructions,
      organizationId: selectedOrganizationId!
    });
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
      // No resetear isGeneratingInSheet aquí si la ejecución sigue corriendo
      if (currentExecution?.status !== "running") {
        setIsGeneratingInSheet(false);
      }
      instructionsInitialized.current = false; // Resetear el flag de inicialización
    }
  }, [isOpen, currentExecution?.status]);

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
                      disabled={!fullDocument?.sections || fullDocument.sections.length === 0 || executeDocumentMutation.isPending || (!sheetSelectedLLM && !defaultLLM?.id)}
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
                  {/* Execution Information */}
                  <div className="space-y-4">
                    <ExecutionInfoSheet 
                      execution={currentExecution} 
                      onRefresh={refetchExecution} 
                      isGenerating={isExecutionRunning()}
                      onNewExecution={() => {
                        // Cerrar el sheet actual y abrir uno nuevo
                        onOpenChange(false);
                        setTimeout(() => {
                          setCurrentExecutionId(null);
                          onOpenChange(true);
                        }, 100);
                      }}
                      onExecutionDeleted={() => {
                        // Cerrar el sheet y actualizar el contenido principal
                        onOpenChange(false);
                        onExecutionComplete?.();
                      }}
                    />
                  </div>

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
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          Execution Configuration
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          Configure the settings for your new execution. Select a language model and provide any specific instructions.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-900">
                              Language Model <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={sheetSelectedLLM}
                              onValueChange={setSheetSelectedLLM}
                              disabled={executeDocumentMutation.isPending}
                            >
                              <SelectTrigger className="w-full h-11 border-gray-300 focus:border-[#4464f7] focus:ring-2 focus:ring-[#4464f7]/20">
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4464f7]/20 focus:border-[#4464f7] resize-none transition-colors"
                              rows={5}
                              placeholder="Enter any specific instructions for this execution. For example: 'Focus on technical details' or 'Keep it concise and professional'..."
                              disabled={executeDocumentMutation.isPending}
                            />
                            <p className="text-xs text-gray-500">
                              These instructions will guide the AI during content generation.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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