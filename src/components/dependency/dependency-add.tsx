import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  File, 
  Trash2, 
  Link2, 
  ExternalLink,
  Loader2,
  AlertCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FileTree, type FileTreeRef } from "@/components/assets/content/assets-file-tree";
import type { FileNode } from "@/types/assets";
import type { MenuAction } from "@/types/menu-action";
import { RemoveDependencyDialog } from "@/components/dependency/dependency-delete-dialog";
import { getDocumentDependencies, addDocumentDependency, removeDocumentDependency } from "@/services/dependencies";
import { getLibraryContent } from "@/services/folders";
import { getAllDocumentTypes } from "@/services/document_type";
import { useOrganization } from "@/contexts/organization-context";
import { useEffectiveOrgId } from "@/hooks/useOrgRouter";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import type { Dependency, DocumentType, AddDependencySheetProps } from "@/types/dependency/sheets";

export type { AddDependencySheetProps } from "@/types/dependency/sheets";

export default function AddDependencySheet({ id, isSheetOpen = true, canEdit = true }: AddDependencySheetProps) {
    const { t } = useTranslation('dependencies')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dependencyToDelete, setDependencyToDelete] = useState<string | null>(null);
    const fileTreeRef = useRef<FileTreeRef>(null);
    const queryClient = useQueryClient();
    const { selectedOrganizationId } = useOrganization();
    const orgId = useEffectiveOrgId();

    const { data: dependencies = [], isLoading, error } = useQuery<Dependency[]>({
        queryKey: ['documentDependencies', id],
        queryFn: () => getDocumentDependencies(id!, selectedOrganizationId!),
        enabled: !!id && !!selectedOrganizationId && isSheetOpen,
    });

    useQuery<DocumentType[]>({
        queryKey: ['documentTypes', selectedOrganizationId],
        queryFn: () => getAllDocumentTypes(selectedOrganizationId!),
        enabled: !!selectedOrganizationId,
    });

    const addDependencyMutation = useMutation({
        mutationFn: (dependsOnDocumentId: string) => addDocumentDependency(id, dependsOnDocumentId, selectedOrganizationId!),
        onSuccess: async () => {
            // Wait for the dependencies to be reloaded
            await queryClient.refetchQueries({ queryKey: ['documentDependencies', id] });
            toast.success(t('toast.added'));
            // Refresh the file tree to update disabled states after dependencies are updated
            await fileTreeRef.current?.refresh();
        },
    });

    const removeDependencyMutation = useMutation({
        mutationFn: (dependencyId: string) => removeDocumentDependency(id, dependencyId, selectedOrganizationId!),
        onSuccess: async () => {
            // Wait for the dependencies to be reloaded
            await queryClient.refetchQueries({ queryKey: ['documentDependencies', id] });
            toast.success(t('toast.removed'));
            // Refresh the file tree to update disabled states after dependencies are updated
            await fileTreeRef.current?.refresh();
        },
    });

    const handleSelectDocument = async (node: FileNode) => {
        // Skip if it's the current document or already a dependency
        const currentDependencies = queryClient.getQueryData<Dependency[]>(['documentDependencies', id]) || [];
        const excludedIds = new Set([id, ...currentDependencies.map(dep => dep.document_id)]);
        if (node.type === "document" && node.id && !excludedIds.has(node.id)) {
            addDependencyMutation.mutate(node.id);
        }
    };

    const handleLoadChildren = async (folderId: string | null): Promise<FileNode[]> => {
        if (!selectedOrganizationId) return [];
        
        try {
            const response = await getLibraryContent(selectedOrganizationId, folderId || undefined);
            
            // Get current dependencies from queryClient to ensure we have the latest data
            const currentDependencies = queryClient.getQueryData<Dependency[]>(['documentDependencies', id]) || [];
            const dependencyIds = new Set(currentDependencies.map(dep => dep.document_id));
            
            const folderNodes: FileNode[] = response.folders.map((item) => ({
                id: item.id,
                name: item.name,
                type: "folder" as const,
                hasChildren: true,
                isDependency: false,
            }));
            const assetNodes: FileNode[] = response.assets
                .filter((item) => item.id !== id)
                .map((item) => ({
                id: item.id,
                name: item.name,
                type: "document" as const,
                document_type: item.document_type,
                access_levels: item.access_levels,
                hasChildren: false,
                // Mark dependencies so menu actions and icons can identify them
                isDependency: dependencyIds.has(item.id),
            }));
            return [...folderNodes, ...assetNodes];
        } catch (error) {
            handleApiError(error, { fallbackMessage: t('toast.loadFailed') });
            return [];
        }
    };

    const dependencyMenuActions: MenuAction[] = useMemo(() => [
        {
            label: t('viewDocument'),
            icon: <ExternalLink className="h-4 w-4" />,
            onClick: async (nodeId: string) => {
                window.open(`/${orgId}/asset/${nodeId}`, '_blank');
            },
            show: (node: FileNode) => !!(node as any).isDependency,
        },
        ...(canEdit ? [{
            label: t('removeDependency'),
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive" as const,
            onClick: async (nodeId: string) => {
                handleRemoveDependency(nodeId);
            },
            show: (node: FileNode) => !!(node as any).isDependency,
        }] : []),
    ], [t, orgId, canEdit]);

    const handleRemoveDependency = (dependencyId: string) => {
        setDependencyToDelete(dependencyId);
        setDeleteDialogOpen(true);
    };

    const confirmRemoveDependency = async () => {
        if (dependencyToDelete) {
            await removeDependencyMutation.mutateAsync(dependencyToDelete);
            setDependencyToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">{t('loading')}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('errorLoading')}</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Dependencies FileTree Section */}
                <div className="border rounded-lg bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
                        <Link2 className="h-4 w-4 text-[#4464f7]" />
                        <h3 className="text-sm font-medium text-gray-900">{t('sheet.title')}</h3>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {t('currentSection.badge', { count: dependencies.length })}
                        </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-full">
                        <FileTree
                            ref={fileTreeRef}
                            onLoadChildren={handleLoadChildren}
                            onFileClick={canEdit ? handleSelectDocument : undefined}
                            showCreateButtons={false}
                            showBorder={false}
                            showDefaultActions={{ create: false, delete: false, share: false }}
                            menuActions={dependencyMenuActions}
                            alwaysShowMenuActions
                            minHeight="350px"
                            renderNodeClassName={(node) => {
                                if ((node as any).isDependency) {
                                    return "opacity-50";
                                }
                                return undefined;
                            }}
                            renderLeafIcon={(node) => {
                                const isDep = (node as any).isDependency;
                                if (isDep) {
                                    return (
                                        <>
                                            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-gray-100 text-muted-foreground border-gray-300 font-normal shrink-0">
                                                {t('linkedBadge')}
                                            </Badge>
                                        </>
                                    );
                                }
                                return (
                                    <File
                                        className="h-3.5 w-3.5 shrink-0"
                                        style={{ color: node.document_type?.color || "currentColor" }}
                                    />
                                );
                            }}
                        />
                        
                        {addDependencyMutation.isPending && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 mt-3 p-3 bg-blue-50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('addSection.adding')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <RemoveDependencyDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onAction={confirmRemoveDependency}
            />
        </>
    );
}