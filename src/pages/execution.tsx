import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOrgNavigate } from "@/hooks/useOrgRouter";
import ExecutionInfo from "@/components/execution/execution_info";
import SectionExecution from "@/components/sections/sections_execution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Chatbot from "@/components/chatbot/chatbot";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, WandSparkles, Loader2, CircleCheck, CircleX } from "lucide-react";
import { TableOfContents } from "@/components/assets/content/assets-table-of-contents";
import { getExecutionById, approveExecution, disapproveExecution } from "@/services/executions";
import { getLLMs, updateExecutionLLM } from "@/services/llms";
import { generateDocument } from "@/services/generate";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useOrganization } from "@/contexts/organization-context";

export default function ExecutionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useOrgNavigate();
    const { selectedOrganizationId } = useOrganization();
    const [instructions, setInstructions] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [editableSections, setEditableSections] = useState<any[]>([]);
    const currentSectionId = useRef<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [selectedLLM, setSelectedLLM] = useState<string>("");
    const [isApproving, setIsApproving] = useState(false);
    
    // New ref to control if auto-generation has already started
    const hasAutoStarted = useRef<boolean>(false);
    
    // Refs for buffering and cancellation
    const textBuffer = useRef<string>('');
    const updateTimer = useRef<NodeJS.Timeout | null>(null);
    const abortController = useRef<AbortController | null>(null);

    const updateLLMMutation = useMutation({
        mutationFn: (llmId: string) => updateExecutionLLM(id!, llmId),
        onSuccess: () => {
            toast.success("Model updated");
            refetch();
        },
        onError: () => {
            toast.error("Failed to update model");
        }
    });

    const { data: execution, isLoading, error, refetch } = useQuery({
        queryKey: ["execution", id],
        queryFn: () => getExecutionById(id!, selectedOrganizationId!),
        enabled: !!id && !!selectedOrganizationId,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const { data: llms } = useQuery({
        queryKey: ["llms"],
        queryFn: getLLMs,
    });

     useEffect(() => {
        if (execution?.sections) {
            setEditableSections([...execution.sections]);
            setInstructions(execution.instruction || "");
            setStatus(execution.status || null);
            setSelectedLLM(execution.llm_id || "");
            
            // Detect if execution is in "running" state but we haven't started generation
            // This can happen when navigating back to an execution in progress
            if (execution.status === "running" && !isGenerating && !hasAutoStarted.current) {
                console.log("Execution is already running, resuming generation monitoring...");
                setIsGenerating(true);
                hasAutoStarted.current = true;
                
                // Don't call handleGenerate here, just set state to show it's generating
                // The generation is already happening on the backend
            }
        }
    }, [execution, isGenerating]);

    // New useEffect to reset the flag when execution completes
    useEffect(() => {
        if (execution?.status === "completed" || execution?.status === "failed") {
            hasAutoStarted.current = false;
            setIsGenerating(false);
        }
    }, [execution?.status]);

    // Cleanup effect for timers and controllers
    useEffect(() => {
        return () => {
            if (updateTimer.current) {
                clearTimeout(updateTimer.current);
            }
            if (abortController.current) {
                abortController.current.abort();
            }
            // Reset the flag when component unmounts
            hasAutoStarted.current = false;
        };
    }, []);

    const handleSectionInfo = (sectionId: string) => {
        console.log(`Generando sección: ${sectionId}`);
        
        // IMPORTANT: Process any pending text from the previous section
        if (textBuffer.current && currentSectionId.current) {
            const pendingText = textBuffer.current;
            const previousSectionId = currentSectionId.current;
            textBuffer.current = ''; // Clear the buffer
            
            // Cancel any pending timer
            if (updateTimer.current) {
                clearTimeout(updateTimer.current);
                updateTimer.current = null;
            }
            
            // Update the previous section with pending text
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
        
        // Now change to the new section
        currentSectionId.current = sectionId;
    };

    const handleStreamError = (error: Event) => {
        console.error('Stream error:', error);
        setIsGenerating(false);
        hasAutoStarted.current = false;
        currentSectionId.current = null;
        
        // Clear any pending updates
        if (updateTimer.current) {
            clearTimeout(updateTimer.current);
            updateTimer.current = null;
        }
        
        toast.error("Error generating content. Please try again.");
    };

    const handleStreamClose = () => {
        console.log('Stream closed');
        setIsGenerating(false);
        hasAutoStarted.current = false;
        currentSectionId.current = null;
        
        // Process any remaining buffered text
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
        
        refetch();
    };

    const handleStreamData = (text: string) => {
        if (!currentSectionId.current) return;
        
        // Add to buffer
        textBuffer.current += text;
        
        // Clear existing timer
        if (updateTimer.current) {
            clearTimeout(updateTimer.current);
        }
        
        // Schedule update after 100ms to batch multiple chunks
        updateTimer.current = setTimeout(() => {
            const bufferedText = textBuffer.current;
            const targetSectionId = currentSectionId.current; // Capture current ID to avoid race conditions
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

    const handleGenerate = async () => {
        if (!execution?.document_id) return;
        
        // Check if we're already generating
        if (isGenerating) {
            console.log("Generation already in progress, skipping...");
            return;
        }
        
        // Mark that we've started generation manually
        hasAutoStarted.current = true;
        
        // Create new controller
        abortController.current = new AbortController();
        
        setIsGenerating(true);
        setStatus("running");
        
        try {
            await generateDocument({
                documentId: execution.document_id,
                executionId: id!,
                userInstructions: instructions,
                organizationId: selectedOrganizationId!,
                signal: abortController.current.signal,
                onData: handleStreamData,
                onInfo: (sectionId: string) => {
                    handleSectionInfo(sectionId);
                },
                onError: handleStreamError,
                onClose: handleStreamClose
            });
        } catch (error) {
            console.error('Error starting generation:', error);
            setIsGenerating(false);
            hasAutoStarted.current = false;
            toast.error("Error starting generation. Please try again.");
            return;
        }
    };

    const handleApprove = async () => {
        if (!execution?.document_id) return;
        
        setIsApproving(true);
        try {
            await approveExecution(id!, selectedOrganizationId!);
            refetch();
            toast.success("Execution approved successfully");
        } catch (error) {
            console.error('Error approving execution:', error);
            toast.error("Error approving execution. Please try again.");
        } finally {
            setIsApproving(false);
        }
    };

    const handleDisapprove = async () => {
        if (!execution?.document_id) return;
        
        setIsApproving(true);
        try {
            await disapproveExecution(id!, selectedOrganizationId!);
            refetch();
            toast.success("Execution disapproved successfully");
        } catch (error) {
            console.error('Error disapproving execution:', error);
            toast.error("Error disapproving execution. Please try again.");
        } finally {
            setIsApproving(false);
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) {
        return <div>Error: {(error as Error).message}</div>;
    }

    const tocItems = [
        { id: "execution-info", title: "Execution Info", level: 1 },
        { id: "execution-config", title: "Execution Configuration", level: 1 },
        ...(editableSections?.map(section => ({
            id: section.id || section.section_execution_id,
            title: section.name,
            level: 2, // Assuming sections are level 2 for now
        })) || [])
    ];

    return (
        <div className="flex gap-8">
            <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="hover:cursor-pointer"
                            onClick={() => navigate(`/document/${execution.document_id}`)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">Generate content</h1>
                    </div>
                </div>

                {/* Tarjeta de información de la ejecución */}
                <div id="execution-info">
                    <ExecutionInfo execution={execution} onRefresh={refetch} isGenerating={isGenerating} />
                </div>


                {/* Tarjeta de instrucciones */}
                <div id="execution-config">
                    <Card>
                        <CardHeader>
                            <CardTitle>Execution Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                                        Execution Instructions: Enter specific instructions for this execution:
                                    </label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <textarea
                                                    id="instructions"
                                                    value={instructions}
                                                    onChange={(e) => setInstructions(e.target.value)}
                                                    placeholder="Describe any specific requirements, constraints, or instructions for this execution..."
                                                    className={`w-full min-h-[120px] p-3 border rounded-md resize-vertical transition-colors ${
                                                        execution?.status !== "pending" || isGenerating
                                                            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                                                            : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    }`}
                                                    rows={6}
                                                    disabled={execution?.status !== "pending" || isGenerating}
                                                    readOnly={execution?.status !== "pending"}
                                                />
                                            </TooltipTrigger>
                                            {execution?.status !== "pending" && (
                                                <TooltipContent>
                                                    <p>Instructions cannot be edited after execution has started</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                                <div className="mt-4 flex justify-end gap-2 items-center flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={selectedLLM}
                                            onValueChange={(v) => {
                                                setSelectedLLM(v);
                                                updateLLMMutation.mutate(v);
                                            }}
                                            disabled={isGenerating || status !== "pending" || updateLLMMutation.isPending}
                                        >
                                            <SelectTrigger className="w-[220px] hover:cursor-pointer">
                                                <SelectValue placeholder={updateLLMMutation.isPending ? "Updating model..." : "Select model"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {llms?.map((m: any) => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        className="hover:cursor-pointer"
                                        disabled={isGenerating || (status !== "pending" && status !== "completed" && status !== "approved") || isApproving}
                                        onClick={status === "completed" ? handleApprove : status === "approved" ? handleDisapprove : handleGenerate}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating
                                            </>
                                        ) : status === "completed" ? (
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
                                        ) : status === "approved" ? (
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
                                </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent>
                        {editableSections && editableSections.length > 0 && (
                            <div className="space-y-1">
                                {editableSections.map((section: any) => (
                                    <div key={section.id || section.section_execution_id} id={section.id || section.section_execution_id}>
                                        <SectionExecution
                                            sectionExecution={section}
                                            onUpdate={refetch}
                                            readyToEdit={execution.status === "completed" && !isGenerating}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
            <div className="w-64 hidden lg:block">
                <TableOfContents items={tocItems} />
            </div>
            <Chatbot executionId={id!} />
        </div>
    );
}