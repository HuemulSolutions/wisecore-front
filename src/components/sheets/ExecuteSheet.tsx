import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Play, 
  Loader2, 
  WandSparkles, 
  CircleCheck, 
  CircleX 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExecutionInfoSheet from "@/components/execution_info_sheet";
import SectionExecutionSheet from "@/components/section_execution_sheet";
import SectionPreviewSheet from "@/components/section_preview_sheet";
import DocumentInfoSheet from "@/components/document_info_sheet";
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
  SheetTrigger,
} from "../ui/sheet";
import { 
  getExecutionById, 
  approveExecution, 
  disapproveExecution, 
  createExecution 
} from "@/services/executions";
import { getLLMs, updateLLM } from "@/services/llms";
import { generateDocument } from "@/services/generate";
import { toast } from "sonner";

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
}

export function ExecuteSheet({
  selectedFile,
  fullDocument,
  isOpen,
  onOpenChange,
  onSectionSheetOpen
}: ExecuteSheetProps) {
  // Estados para el Execute Sheet
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [isGeneratingInSheet, setIsGeneratingInSheet] = useState(false);
  const [sheetInstructions, setSheetInstructions] = useState("");
  const [sheetSelectedLLM, setSheetSelectedLLM] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [editableSections, setEditableSections] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Query client para invalidar queries
  const queryClient = useQueryClient();
  
  // Refs para el streaming de generación
  const currentSectionId = useRef<string | null>(null);
  const hasAutoStarted = useRef<boolean>(false);
  const textBuffer = useRef<string>('');
  const updateTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Query para obtener detalles de la ejecución actual
  const { data: currentExecution, refetch: refetchExecution } = useQuery({
    queryKey: ["execution", currentExecutionId],
    queryFn: () => getExecutionById(currentExecutionId!),
    enabled: !!currentExecutionId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Query para obtener LLMs
  const { data: llms } = useQuery({
    queryKey: ["llms"],
    queryFn: getLLMs,
  });

  // Mutation para crear ejecución
  const createExecutionMutation = useMutation({
    mutationFn: (documentId: string) => createExecution(documentId),
    onSuccess: (executionData) => {
      toast.success("Execution created successfully");
      setCurrentExecutionId(executionData.id);
    },
    onError: (error) => {
      console.error("Error creating execution:", error);
      toast.error("Error creating execution: " + (error as Error).message);
    },
  });

  // Mutation para actualizar LLM
  const updateLLMMutation = useMutation({
    mutationFn: (llmId: string) => updateLLM(currentExecutionId!, llmId),
    onSuccess: () => {
      toast.success("Model updated");
      refetchExecution();
    },
    onError: () => {
      toast.error("Failed to update model");
    }
  });

  // Funciones para el streaming
  const handleSectionInfo = (sectionId: string) => {
    console.log(`Generando sección: ${sectionId}`);
    
    if (textBuffer.current && currentSectionId.current) {
      const pendingText = textBuffer.current;
      const previousSectionId = currentSectionId.current;
      textBuffer.current = '';
      
      if (updateTimer.current) {
        clearTimeout(updateTimer.current);
        updateTimer.current = null;
      }
      
      setEditableSections(prevSections => {
        const sectionIndex = prevSections.findIndex(s => s.id === previousSectionId);
        if (sectionIndex === -1) return prevSections;
        
        const newSections = [...prevSections];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          output: (newSections[sectionIndex].output || '') + pendingText
        };
        return newSections;
      });
    }
    
    currentSectionId.current = sectionId;
  };

  const handleStreamError = (error: Event) => {
    console.error('Stream error:', error);
    setIsGeneratingInSheet(false);
    hasAutoStarted.current = false;
    currentSectionId.current = null;
    
    if (updateTimer.current) {
      clearTimeout(updateTimer.current);
      updateTimer.current = null;
    }
    
    toast.error("Error generating content. Please try again.");
  };

  const handleStreamClose = () => {
    console.log('Stream closed');
    setIsGeneratingInSheet(false);
    hasAutoStarted.current = false;
    currentSectionId.current = null;
    
    if (textBuffer.current && currentSectionId.current) {
      const finalText = textBuffer.current;
      textBuffer.current = '';
      
      setEditableSections(prevSections => {
        const sectionIndex = prevSections.findIndex(s => s.id === currentSectionId.current);
        if (sectionIndex === -1) return prevSections;
        
        const newSections = [...prevSections];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          output: (newSections[sectionIndex].output || '') + finalText
        };
        return newSections;
      });
    }
    
    refetchExecution();
  };

  const handleStreamData = (text: string) => {
    if (!currentSectionId.current) return;
    
    textBuffer.current += text;
    
    if (updateTimer.current) {
      clearTimeout(updateTimer.current);
    }
    
    updateTimer.current = setTimeout(() => {
      const bufferedText = textBuffer.current;
      const targetSectionId = currentSectionId.current;
      textBuffer.current = '';
      
      if (!bufferedText || !targetSectionId) return;
      
      setEditableSections(prevSections => {
        const sectionIndex = prevSections.findIndex(s => s.id === targetSectionId);
        if (sectionIndex === -1) return prevSections;
        
        const newSections = [...prevSections];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          output: (newSections[sectionIndex].output || '') + bufferedText
        };
        return newSections;
      });
    }, 100);
  };

  const handleGenerateInSheet = async () => {
    if (!currentExecution?.document_id || !currentExecutionId) return;
    
    if (isGeneratingInSheet) {
      console.log("Generation already in progress, skipping...");
      return;
    }
    
    hasAutoStarted.current = true;
    abortController.current = new AbortController();
    
    setIsGeneratingInSheet(true);
    
    try {
      await generateDocument({
        documentId: currentExecution.document_id,
        executionId: currentExecutionId,
        userInstructions: sheetInstructions,
        signal: abortController.current.signal,
        onData: handleStreamData,
        onInfo: handleSectionInfo,
        onError: handleStreamError,
        onClose: handleStreamClose
      });
    } catch (error) {
      console.error('Error starting generation:', error);
      setIsGeneratingInSheet(false);
      hasAutoStarted.current = false;
      toast.error("Error starting generation. Please try again.");
    }
  };

  const handleApproveInSheet = async () => {
    if (!currentExecutionId) return;
    
    setIsApproving(true);
    try {
      await approveExecution(currentExecutionId);
      refetchExecution();
      toast.success("Execution approved successfully");
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
      await disapproveExecution(currentExecutionId);
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
    if (currentExecution?.sections) {
      setEditableSections([...currentExecution.sections]);
      setSheetInstructions(currentExecution.instruction || "");
      setSheetSelectedLLM(currentExecution.llm_id || "");
      
      if (currentExecution.status === "running" && !isGeneratingInSheet && !hasAutoStarted.current) {
        console.log("Execution is already running, resuming generation monitoring...");
        setIsGeneratingInSheet(true);
        hasAutoStarted.current = true;
      }
    }
  }, [currentExecution, isGeneratingInSheet]);

  // Effect para resetear el flag cuando la ejecución se complete
  useEffect(() => {
    if (currentExecution?.status === "completed" || currentExecution?.status === "failed") {
      hasAutoStarted.current = false;
      setIsGeneratingInSheet(false);
    }
  }, [currentExecution?.status]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (updateTimer.current) {
        clearTimeout(updateTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
      hasAutoStarted.current = false;
    };
  }, []);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            size="sm"
            className="h-8 px-3 bg-[#4464f7] hover:bg-[#3451e6] text-white border-none hover:cursor-pointer shadow-sm text-xs"
            title="Create New Execution"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Execute
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="sm:max-w-[900px] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={isGeneratingInSheet ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={isGeneratingInSheet ? (e) => e.preventDefault() : undefined}
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Play className="h-4 w-4" />
                    {currentExecution ? 'Execute Document' : 'Create New Execution'}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-gray-500 mt-1">
                    {currentExecution ? 'Configure and execute this document to generate content.' : 'Execute this document to generate new content based on its sections and context.'}
                  </SheetDescription>
                </div>
                {/* Botón de acción centrado verticalmente */}
                <div className="flex items-center h-full gap-2">
                  {currentExecution ? (
                    <Button 
                      onClick={() => {
                        if (currentExecution.status === "completed") {
                          handleApproveInSheet();
                        } else if (currentExecution.status === "approved") {
                          handleDisapproveInSheet();
                        } else {
                          handleGenerateInSheet();
                        }
                      }}
                      disabled={isGeneratingInSheet || (currentExecution.status !== "pending" && currentExecution.status !== "completed" && currentExecution.status !== "approved") || isApproving}
                      className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                      style={{ alignSelf: 'center' }}
                    >
                      {isGeneratingInSheet ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : currentExecution.status === "completed" ? (
                        isApproving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CircleCheck className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )
                      ) : currentExecution.status === "approved" ? (
                        isApproving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Disapproving...
                          </>
                        ) : (
                          <>
                            <CircleX className="h-4 w-4 mr-2" />
                            Disapprove
                          </>
                        )
                      ) : (
                        <>
                          <WandSparkles className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        if (selectedFile) {
                          createExecutionMutation.mutate(selectedFile.id);
                        }
                      }}
                      disabled={!fullDocument?.sections || fullDocument.sections.length === 0 || createExecutionMutation.isPending}
                      className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                      style={{ alignSelf: 'center' }}
                    >
                      {createExecutionMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Create Execution
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
              {currentExecution ? (
                <>
                  {/* Execution Information */}
                  <div className="space-y-4">
                    <ExecutionInfoSheet 
                      execution={currentExecution} 
                      onRefresh={refetchExecution} 
                      isGenerating={isGeneratingInSheet} 
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
                                    currentExecution?.status !== "pending" || isGeneratingInSheet
                                      ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  }`}
                                  rows={4}
                                  disabled={currentExecution?.status !== "pending" || isGeneratingInSheet}
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
                            disabled={isGeneratingInSheet || currentExecution?.status !== "pending" || updateLLMMutation.isPending}
                          >
                            <SelectTrigger className="w-[200px] hover:cursor-pointer">
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
                  {editableSections && editableSections.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Document Sections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {editableSections.map((section: any) => (
                            <SectionExecutionSheet
                              sectionExecution={section}
                              onUpdate={refetchExecution}
                              readyToEdit={currentExecution.status === "completed" && !isGeneratingInSheet}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  {/* Document Information para nueva ejecución */}
                  <DocumentInfoSheet
                    document={{
                      id: selectedFile?.id || '',
                      name: selectedFile?.name || '',
                      sections: fullDocument?.sections || []
                    }}
                    onConfigureDocument={() => {
                      setIsEditDialogOpen(true);
                    }}
                  />

                  {/* Sections Preview para nueva ejecución */}
                  <SectionPreviewSheet
                    sections={fullDocument?.sections || []}
                    onSectionSheetOpen={() => {
                      onOpenChange(false);
                      onSectionSheetOpen();
                    }}
                  />
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