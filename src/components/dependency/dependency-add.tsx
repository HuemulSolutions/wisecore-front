import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  File,
  Trash2,
  Link2,
  ExternalLink,
  GitBranch,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { FileTree, type FileTreeRef } from "@/components/assets/content/assets-file-tree";
import type { FileNode } from "@/types/assets";
import type { MenuAction } from "@/types/menu-action";
import { RemoveDependencyDialog } from "@/components/dependency/dependency-delete-dialog";
import { DependencyVersionDialog } from "@/components/dependency/dependency-version-dialog";
import { getDocumentDependencies, addDocumentDependency, updateDocumentDependency, removeDocumentDependency } from "@/services/dependencies";
import { getLibraryContent } from "@/services/folders";
import { useOrganization } from "@/contexts/organization-context";
import { useEffectiveOrgId } from "@/hooks/useOrgRouter";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import type { Dependency, AddDependencySheetProps, UpdateDependencyVersionRequest } from "@/types/dependency/sheets";

export type { AddDependencySheetProps } from "@/types/dependency/sheets";

function getVersionModeBadgeLabel(dependency: Dependency, t: (key: string) => string): string {
  if (dependency.version_mode === 'specific') {
    return dependency.depends_on_execution_name || t('versionMode.badge.specificFallback');
  }
  if (dependency.version_mode === 'latest_approved') {
    return t('versionMode.badge.latestApproved');
  }
  return t('versionMode.badge.published');
}

export default function AddDependencySheet({ id, isSheetOpen = true, canEdit = true }: AddDependencySheetProps) {
    const { t } = useTranslation('dependencies')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dependencyToDelete, setDependencyToDelete] = useState<string | null>(null);
    // Document node the user clicked to create a dependency (create mode) or the
    // existing dependency being repointed to another version (edit mode).
    const [pendingDocument, setPendingDocument] = useState<{ id: string; name: string } | null>(null);
    const [editingDependency, setEditingDependency] = useState<Dependency | null>(null);
    const [versionDialogOpen, setVersionDialogOpen] = useState(false);
    const fileTreeRef = useRef<FileTreeRef>(null);
    const queryClient = useQueryClient();
    const { selectedOrganizationId } = useOrganization();
    const orgId = useEffectiveOrgId();

    const { data: dependencies = [], isLoading, isFetching, error, refetch } = useQuery<Dependency[]>({
        queryKey: ['documentDependencies', id],
        queryFn: () => getDocumentDependencies(id!, selectedOrganizationId!),
        enabled: !!id && !!selectedOrganizationId && isSheetOpen,
    });

    const depByDocId = useMemo(
        () => new Map(dependencies.map((dep) => [dep.document_id, dep])),
        [dependencies],
    );

    // Lee la caché de React Query en el momento de la llamada en lugar de depender
    // del estado `dependencies` derivado por render: tras un refetchQueries, la
    // caché ya está actualizada aunque el componente todavía no haya re-renderizado,
    // y handleLoadChildren se invoca desde fileTreeRef.refresh() antes de ese render.
    const getFreshDepByDocId = () => {
        const cached = queryClient.getQueryData<Dependency[]>(['documentDependencies', id]);
        const source = cached ?? dependencies;
        return new Map(source.map((dep) => [dep.document_id, dep]));
    };

    const addDependencyMutation = useMutation({
        mutationFn: (body: { depends_on_document_id: string } & UpdateDependencyVersionRequest) =>
            addDocumentDependency(id, body, selectedOrganizationId!),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ['documentDependencies', id] });
            toast.success(t('toast.added'));
            await fileTreeRef.current?.refresh();
        },
        onError: (error) => {
            handleApiError(error, { fallbackMessage: t('toast.addFailed') });
        },
    });

    const updateDependencyMutation = useMutation({
        mutationFn: ({ dependencyId, body }: { dependencyId: string; body: UpdateDependencyVersionRequest }) =>
            updateDocumentDependency(id, dependencyId, body, selectedOrganizationId!),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ['documentDependencies', id] });
            toast.success(t('toast.versionUpdated'));
            await fileTreeRef.current?.refresh();
        },
        onError: (error) => {
            handleApiError(error, { fallbackMessage: t('toast.updateFailed') });
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
        onError: (error) => {
            handleApiError(error, { fallbackMessage: t('toast.removeFailed') });
        },
    });

    const handleSelectDocument = (node: FileNode) => {
        // Skip if it's the current document or already a dependency
        if (node.type === "document" && node.id && node.id !== id && !depByDocId.has(node.id)) {
            setPendingDocument({ id: node.id, name: node.name });
            setEditingDependency(null);
            setVersionDialogOpen(true);
        }
    };

    const handleChangeVersion = (dependency: Dependency) => {
        setEditingDependency(dependency);
        setPendingDocument({ id: dependency.document_id, name: dependency.document_name });
        setVersionDialogOpen(true);
    };

    const handleConfirmVersionDialog = async (body: UpdateDependencyVersionRequest) => {
        if (editingDependency) {
            await updateDependencyMutation.mutateAsync({ dependencyId: editingDependency.id, body });
        } else if (pendingDocument) {
            await addDependencyMutation.mutateAsync({ depends_on_document_id: pendingDocument.id, ...body });
        }
        setVersionDialogOpen(false);
        setPendingDocument(null);
        setEditingDependency(null);
    };

    const handleLoadChildren = async (folderId: string | null): Promise<FileNode[]> => {
        if (!selectedOrganizationId) return [];

        try {
            const response = await getLibraryContent(selectedOrganizationId, folderId || undefined);
            const freshDepByDocId = getFreshDepByDocId();

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
                isDependency: freshDepByDocId.has(item.id),
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
            show: (node: FileNode) => !!node.isDependency,
        },
        ...(canEdit ? [{
            label: t('changeVersion'),
            icon: <GitBranch className="h-4 w-4" />,
            onClick: async (nodeId: string) => {
                const dependency = depByDocId.get(nodeId);
                if (dependency) handleChangeVersion(dependency);
            },
            show: (node: FileNode) => !!node.isDependency,
        }] : []),
        ...(canEdit ? [{
            label: t('removeDependency'),
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive" as const,
            onClick: async (nodeId: string) => {
                const dependency = depByDocId.get(nodeId);
                if (dependency) handleRemoveDependency(dependency);
            },
            show: (node: FileNode) => !!node.isDependency,
        }] : []),
    ], [t, orgId, canEdit, depByDocId]);

    const handleRemoveDependency = (dependency: Dependency) => {
        setDependencyToDelete(dependency.id);
        setDeleteDialogOpen(true);
    };

    const confirmRemoveDependency = async () => {
        if (dependencyToDelete) {
            await removeDependencyMutation.mutateAsync(dependencyToDelete);
            setDependencyToDelete(null);
        }
    };

    const handleRefresh = async () => {
        await refetch();
        await fileTreeRef.current?.refresh();
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
                        <HuemulButton
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            icon={RefreshCw}
                            tooltip={t('common:refresh')}
                            loading={isFetching}
                            onClick={handleRefresh}
                        />
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
                                if (node.isDependency) {
                                    return "opacity-50";
                                }
                                return undefined;
                            }}
                            renderLeafIcon={(node) => {
                                const dependency = depByDocId.get(node.id);
                                if (dependency) {
                                    return (
                                        <>
                                            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-gray-100 text-muted-foreground border-gray-300 font-normal shrink-0">
                                                {getVersionModeBadgeLabel(dependency, t)}
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

            {pendingDocument && (
                <DependencyVersionDialog
                    open={versionDialogOpen}
                    onOpenChange={(open) => {
                        setVersionDialogOpen(open);
                        if (!open) {
                            setPendingDocument(null);
                            setEditingDependency(null);
                        }
                    }}
                    dependsOnDocumentId={pendingDocument.id}
                    dependsOnDocumentName={pendingDocument.name}
                    dependency={editingDependency}
                    onConfirm={handleConfirmVersionDialog}
                    isSubmitting={addDependencyMutation.isPending || updateDependencyMutation.isPending}
                />
            )}

            <RemoveDependencyDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onAction={confirmRemoveDependency}
            />
        </>
    );
}
