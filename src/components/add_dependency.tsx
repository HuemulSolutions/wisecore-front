import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {FileText, Plus, Trash2} from "lucide-react";
import {useState} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDocumentDependencies, addDocumentDependency, removeDocumentDependency } from "@/services/dependencies";
import { getAllDocuments, getDocumentById } from "@/services/documents";


interface Dependency {
    document_id: string;
    document_name: string;
    section_name: string | null;
    dependency_type: string;
}

interface Document {
    id: string;
    name: string;
}

export default function AddDependency({ id }: { id: string }) {
    const [newDependency, setNewDependency] = useState('');
    const queryClient = useQueryClient();

    const { data: document } = useQuery({
        queryKey: ['document', id],
        queryFn: () => getDocumentById(id),
        enabled: !!id,
    });

    const { data: dependencies = [], isLoading, error } = useQuery<Dependency[]>({
        queryKey: ['documentDependencies', id],
        queryFn: () => getDocumentDependencies(id!),
        enabled: !!id,
    });

    const { data: allDocuments = [] } = useQuery<Document[]>({
        queryKey: ['allDocuments'],
        queryFn: () => getAllDocuments(document?.organization_id),
        enabled: !!document?.organization_id,
    });

    const addDependencyMutation = useMutation({
        mutationFn: (dependsOnDocumentId: string) => addDocumentDependency(id, dependsOnDocumentId),
        onSuccess: () => {
            // Refrescar las dependencias y limpiar el select
            queryClient.invalidateQueries({ queryKey: ['documentDependencies', id] });
            setNewDependency('');
        },
        onError: (error) => {
            console.error('Error adding dependency:', error);
        },
    });

    // Filtrar documentos disponibles (excluir el actual y los ya dependientes)
    const availableDocuments = allDocuments.filter(doc => 
        doc.id !== id && !dependencies.some(dep => dep.document_id === doc.id)
    );

    const handleAddDependency = () => {
        if (newDependency) {
            addDependencyMutation.mutate(newDependency);
        }
    };

    const handleRemoveDependency = (dependencyId: string) => {
        
        removeDocumentDependency(id, dependencyId)
            .then(() => {
                // Refrescar las dependencias después de eliminar
                queryClient.invalidateQueries({ queryKey: ['documentDependencies', id] });
            })
            .catch(error => {
                console.error('Error removing dependency:', error);
            });
    };

    if (isLoading) {
        return <div>Loading dependencies...</div>;
    }
    if (error) {
        return <div>Error loading dependencies: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
                {/* Sección de Dependencias */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Dependencies
                        </CardTitle>
                        <CardDescription>
                            Add dependencies to other Wisecore documents
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        
                        {/* Select para agregar nueva dependencia */}
                        <div className="flex items-center gap-2">
                            <Select value={newDependency} onValueChange={setNewDependency}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select a document to add as dependency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableDocuments.map((doc) => (
                                        <SelectItem key={doc.id} value={doc.id}>
                                            {doc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                className="hover:cursor-pointer"
                                onClick={handleAddDependency}
                                disabled={!newDependency || addDependencyMutation.isPending}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Lista de dependencias existentes */}
                        {dependencies.map((dependency) => (
                            <div key={dependency.document_id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <span className="text-sm font-medium">{dependency.document_name}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="hover:cursor-pointer text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveDependency(dependency.document_id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

    )
}
