import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Trash2, 
  Plus, 
  Link2, 
  ExternalLink,
  Loader2,
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentTreeSelector } from "@/components/document-tree-selector";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getDocumentDependencies, addDocumentDependency, removeDocumentDependency } from "@/services/dependencies";
// Document services no longer needed as tree selector handles library structure
import { getAllDocumentTypes } from "@/services/document_type";
import { useOrganization } from "@/contexts/organization-context";
import { toast } from "sonner";

interface Dependency {
    document_id: string;
    document_name: string;
    section_name: string | null;
    dependency_type: string;
}

interface DocumentType {
    id: string;
    name: string;
    color: string;
}

export default function AddDependencySheet({ id }: { id: string }) {
    const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dependencyToDelete, setDependencyToDelete] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { selectedOrganizationId } = useOrganization();

    const { data: dependencies = [], isLoading, error } = useQuery<Dependency[]>({
        queryKey: ['documentDependencies', id],
        queryFn: () => getDocumentDependencies(id!),
        enabled: !!id,
    });

    const { data: documentTypes = [] } = useQuery<DocumentType[]>({
        queryKey: ['documentTypes', selectedOrganizationId],
        queryFn: () => getAllDocumentTypes(selectedOrganizationId!),
        enabled: !!selectedOrganizationId,
    });

    const addDependencyMutation = useMutation({
        mutationFn: (dependsOnDocumentId: string) => addDocumentDependency(id, dependsOnDocumentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentDependencies', id] });
            toast.success("Dependency added successfully");
        },
        onError: (error) => {
            console.error('Error adding dependency:', error);
            toast.error("Failed to add dependency. Please try again.");
        },
    });

    const removeDependencyMutation = useMutation({
        mutationFn: (dependencyId: string) => removeDocumentDependency(id, dependencyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentDependencies', id] });
            toast.success("Dependency removed successfully");
            setDeleteDialogOpen(false);
            setDependencyToDelete(null);
        },
        onError: (error) => {
            console.error('Error removing dependency:', error);
            toast.error("Failed to remove dependency. Please try again.");
        },
    });

    const handleSelectDocument = (document: { id: string; name: string; type: "document" }) => {
        if (document.id) {
            addDependencyMutation.mutate(document.id);
        }
    };

    const handleRemoveDependency = (dependencyId: string) => {
        setDependencyToDelete(dependencyId);
        setDeleteDialogOpen(true);
    };

    const confirmRemoveDependency = () => {
        if (dependencyToDelete) {
            removeDependencyMutation.mutate(dependencyToDelete);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading dependencies...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Error loading dependencies</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Add New Dependency Section */}
                <div className="border rounded-lg bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
                        <Plus className="h-4 w-4 text-[#4464f7]" />
                        <h3 className="text-sm font-medium text-gray-900">Add New Dependency</h3>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <DocumentTreeSelector
                            documentTypes={documentTypes}
                            selectedDocumentTypes={selectedDocumentTypes}
                            onDocumentSelect={handleSelectDocument}
                            onFilterChange={setSelectedDocumentTypes}
                            placeholder="Search and select a document to add as dependency..."
                            // disabled={addDependencyMutation.isPending}
                            excludeDocumentIds={[id, ...dependencies.map(dep => dep.document_id)]}
                            showContainer={true}
                            customPadding="p-4"
                        />
                        
                        {/* {addDependencyMutation.isPending && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 mt-3 p-3 bg-blue-50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Adding dependency...
                            </div>
                        )} */}
                    </div>
                </div>

                {/* Existing Dependencies Section */}
                <div className="border rounded-lg bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-[#4464f7]" />
                            <h3 className="text-sm font-medium text-gray-900">Current Dependencies</h3>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {dependencies.length} dependencies
                            </Badge>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {dependencies.length === 0 ? (
                            <div className="text-center py-8">
                                <Link2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No dependencies configured</p>
                                <p className="text-xs text-gray-400 mt-1">Add document dependencies to create relationships and shared context.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dependencies.map((dependency) => (
                                    <div key={dependency.document_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-gray-600" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {dependency.document_name}
                                                </span>
                                                {dependency.section_name && (
                                                    <span className="text-xs text-gray-500">
                                                        Section: {dependency.section_name}
                                                    </span>
                                                )}
                                                <Badge variant="outline" className="text-xs w-fit mt-1 bg-green-50 text-green-700 border-green-200">
                                                    {dependency.dependency_type || 'Document'}
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0 hover:cursor-pointer"
                                                title="View Document"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRemoveDependency(dependency.document_id)}
                                                disabled={removeDependencyMutation.isPending}
                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                                                title="Remove Dependency"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Dependency</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this dependency? This action cannot be undone and may affect document relationships.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="hover:cursor-pointer">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmRemoveDependency}
                            disabled={removeDependencyMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 hover:cursor-pointer"
                        >
                            {removeDependencyMutation.isPending ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}