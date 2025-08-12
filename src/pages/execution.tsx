import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ExecutionInfo from "@/components/execution_info";
import SectionExecution from "@/components/section_execution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, WandSparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getExecutionById } from "@/services/executions";
import { generateDocument } from "@/services/generate";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function ExecutionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [instructions, setInstructions] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [editableSections, setEditableSections] = useState<any[]>([]);
    const currentSectionId = useRef<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);


    const { data: execution, isLoading, error, refetch } = useQuery({
        queryKey: ["execution", id],
        queryFn: () => getExecutionById(id!),
        enabled: !!id, // Solo ejecutar si id está definido
    });

     useEffect(() => {
        if (execution?.sections) {
            setEditableSections([...execution.sections]);
            setInstructions(execution.instruction || "");
            setStatus(execution.status || null);
        }
    }, [execution]);

    const handleSectionInfo = (sectionId: string) => {
        console.log(`Generando sección: ${sectionId}`);
        currentSectionId.current = sectionId;
    };

    const handleStreamError = (error: Event) => {
        console.error('Error en el stream:', error);
        setIsGenerating(false);
        currentSectionId.current = null;
        toast.error("Error al generar contenido. Por favor, inténtalo de nuevo.");
    };

    const handleStreamClose = () => {
        console.log('Stream cerrado');
        setIsGenerating(false);
        currentSectionId.current = null;
        refetch();
    };

    const handleStreamData = (text: string) => {
        setEditableSections(prevSections => 
            prevSections.map(section => {
                if (section.id === currentSectionId.current) {
                    console.log(`Actualizando sección ${section.id} con texto: ${text}`);
                    return {
                        ...section,
                        output: section.output + text
                    };
                }
                return section;
            })
        );
    };

    const handleGenerate = async () => {
        if (!execution?.document_id) return;
        
        setIsGenerating(true);
        setStatus("running");
        
        try {
            await generateDocument({
                documentId: execution.document_id,
                executionId: id!,
                userInstructions: instructions,
                onData: handleStreamData,
                onInfo: (sectionId: string) => {
                    handleSectionInfo(sectionId);
                },
                onError: handleStreamError,
                onClose: handleStreamClose
            });
        } catch (error) {
            console.error('Error al iniciar la generación:', error);
            setIsGenerating(false);
            toast.error("Error al iniciar la generación. Por favor, inténtalo de nuevo.");
            return;
        }
    };


    if (isLoading) return <div>Loading...</div>;
    if (error) {
        return <div>Error: {(error as Error).message}</div>;
    }
    return (
        <div className="space-y-4">
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
            <ExecutionInfo execution={execution} onRefresh={refetch} />


            {/* Tarjeta de instrucciones */}
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
                    <Separator className="my-4" />
                    {editableSections && editableSections.length > 0 && (
                        <div className="space-y-1">
                            {editableSections.map((section: any) => (
                                <SectionExecution
                                    key={section.id}
                                    sectionExecution={section}
                                    onUpdate={refetch}
                                />
                            ))}
                        </div>
                    )}

                    {status === "pending" && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                className="hover:cursor-pointer"
                                disabled={isGenerating}
                                onClick={handleGenerate}
                            >
                                <WandSparkles className="h-4 w-4 mr-2" />
                                Generate
                            </Button>
                        </div>
                    )}
                </CardContent>

            </Card>

        </div>
    );
}