import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ExecutionInfo from "@/components/execution_info";
import SectionExecution from "@/components/section_execution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, WandSparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getExecutionById } from "@/services/executions";
import { useState } from "react";

export default function ExecutionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [instructions, setInstructions] = useState("");

    const { data: execution, isLoading, error } = useQuery({
        queryKey: ["execution", id],
        queryFn: () => getExecutionById(id!),
        enabled: !!id, // Solo ejecutar si id está definido
    });


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
            <ExecutionInfo execution={execution} />


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
                            <textarea
                                id="instructions"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Describe any specific requirements, constraints, or instructions for this execution..."
                                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                                rows={6}
                            />
                        </div>
                    </div>
                    <Separator className="my-4" />
                    {execution.sections && execution.sections.length > 0 && (
                        <div className="space-y-1">
                            {execution.sections.map((section: any) => (
                                <SectionExecution
                                    key={section.id}
                                    sectionExecution={section}
                                />
                            ))}
                        </div>
                    )}

                    <div className="mt-4 flex justify-end">
                        <Button
                            className="hover:cursor-pointer"
                            onClick={() => {
                                // Aquí iría la lógica para enviar las instrucciones y ejecutar el proceso
                                console.log("Instructions submitted:", instructions);
                            }}
                        >
                            <WandSparkles className="h-4 w-4 mr-2" />
                            Generate
                        </Button>
                    </div>
                </CardContent>

            </Card>

        </div>
    );
}