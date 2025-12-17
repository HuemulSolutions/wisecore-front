import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Checkbox} from "@/components/ui/checkbox";
import {FileText, Trash2, Filter} from "lucide-react";
import {useState} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDocumentDependencies, addDocumentDependency, removeDocumentDependency } from "@/services/dependencies";
import { getAllDocuments } from "@/services/documents";
import { getAllDocumentTypes } from "@/services/document_type";
import { useOrganization } from "@/contexts/organization-context";


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

interface DocumentType {
    id: string;
    name: string;
    color: string;
}

export default function AddDependency({ id }: { id: string }) {
    const [newDependency, setNewDependency] = useState('');
    const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const queryClient = useQueryClient();
    const { selectedOrganizationId } = useOrganization();

    // Document data is fetched but not currently used in this component

    const { data: dependencies = [], isLoading, error } = useQuery<Dependency[]>({
        queryKey: ['documentDependencies', id],
        queryFn: () => getDocumentDependencies(id!, selectedOrganizationId!),
        enabled: !!id && !!selectedOrganizationId,
    });

    const { data: allDocuments = [] } = useQuery<Document[]>({
        queryKey: ['allDocuments'],
        queryFn: () => getAllDocuments(selectedOrganizationId!),
        enabled: !!selectedOrganizationId,
    });

    const { data: documentTypes = [] } = useQuery<DocumentType[]>({
        queryKey: ['documentTypes', selectedOrganizationId],
        queryFn: () => getAllDocumentTypes(selectedOrganizationId!),
        enabled: !!selectedOrganizationId,
    });

    const addDependencyMutation = useMutation({
        mutationFn: (dependsOnDocumentId: string) => addDocumentDependency(id, dependsOnDocumentId, selectedOrganizationId!),
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

    const handleSelectDocument = (documentId: string) => {
        if (documentId) {
            addDependencyMutation.mutate(documentId);
        }
    };

    const handleRemoveDependency = (dependencyId: string) => {
        
        removeDocumentDependency(id, dependencyId, selectedOrganizationId!)
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
                        
                        {/* Select para agregar nueva dependencia con filtro */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Add new dependency:</label>
                            <div className="flex items-center gap-2">
                                <Select value={newDependency} onValueChange={handleSelectDocument}>
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
                                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="hover:cursor-pointer"
                                            title="Filter by asset type"
                                        >
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm">Asset Types</h4>
                                            <div className="space-y-2">
                                                {documentTypes.map((type) => (
                                                    <div key={type.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={type.id}
                                                            checked={selectedDocumentTypes.includes(type.id)}
                                                            onCheckedChange={(checked: boolean) => {
                                                                if (checked) {
                                                                    setSelectedDocumentTypes(prev => [...prev, type.id]);
                                                                } else {
                                                                    setSelectedDocumentTypes(prev => prev.filter(id => id !== type.id));
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={type.id}
                                                            className="flex items-center space-x-2 text-sm font-medium cursor-pointer"
                                                        >
                                                            <div 
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: type.color }}
                                                            />
                                                            <span>{type.name}</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
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
