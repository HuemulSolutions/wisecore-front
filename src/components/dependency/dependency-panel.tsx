import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulAssetTreePickerDialog } from "@/huemul/components/huemul-asset-tree-picker";
import { RemoveDependencyDialog } from "@/components/dependency/dependency-delete-dialog";
import { DependencyVersionDialog } from "@/components/dependency/dependency-version-dialog";
import { DependencyListItem } from "@/components/dependency/dependency-list-item";
import { getDocumentDependencies, addDocumentDependency, updateDocumentDependency, removeDocumentDependency } from "@/services/dependencies";
import { useOrganization } from "@/contexts/organization-context";
import { useEffectiveOrgId } from "@/hooks/useOrgRouter";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import type { Dependency, AddDependencySheetProps, UpdateDependencyVersionRequest } from "@/types/dependency/sheets";

export type { AddDependencySheetProps } from "@/types/dependency/sheets";

// `canEdit` es secure-by-default (punto 9 del checklist): su único call-site
// (assets-dependencies-sheet.tsx) ya lo pasa explícito desde el cruce lifecycle × RBAC.
export default function AddDependencySheet({ id, isSheetOpen = true, canEdit = false }: AddDependencySheetProps) {
    const { t } = useTranslation('dependencies')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dependencyToDelete, setDependencyToDelete] = useState<string | null>(null);
    // Document node the user clicked to create a dependency (create mode) or the
    // existing dependency being repointed to another version (edit mode).
    const [pendingDocument, setPendingDocument] = useState<{ id: string; name: string } | null>(null);
    const [editingDependency, setEditingDependency] = useState<Dependency | null>(null);
    const [versionDialogOpen, setVersionDialogOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const queryClient = useQueryClient();
    const { selectedOrganizationId } = useOrganization();
    const orgId = useEffectiveOrgId();

    const { data: dependencies = [], isLoading, isFetching, error, refetch } = useQuery<Dependency[]>({
        queryKey: ['documentDependencies', id],
        queryFn: () => getDocumentDependencies(id!, selectedOrganizationId!),
        enabled: !!id && !!selectedOrganizationId && isSheetOpen,
    });

    // Ids no seleccionables en el picker: el propio activo y los que ya son dependencia.
    const disabledPickerIds = useMemo(
        () => [id, ...dependencies.map((dep) => dep.document_id)],
        [id, dependencies],
    );

    const addDependencyMutation = useMutation({
        mutationFn: (body: { depends_on_document_id: string } & UpdateDependencyVersionRequest) =>
            addDocumentDependency(id, body, selectedOrganizationId!),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ['documentDependencies', id] });
            toast.success(t('toast.added'));
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
        },
        onError: (error) => {
            handleApiError(error, { fallbackMessage: t('toast.removeFailed') });
        },
    });

    const handlePickAsset = (docId: string, label: string) => {
        setPendingDocument({ id: docId, name: label });
        setEditingDependency(null);
        setVersionDialogOpen(true);
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
                {/* Dependencies List Section */}
                <div className="border rounded-lg bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
                        <Link2 className="h-4 w-4 text-[#4464f7]" />
                        <h3 className="text-sm font-medium text-gray-900">{t('list.title')}</h3>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {t('list.count', { count: dependencies.length })}
                        </Badge>
                        <HuemulButton
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-2"
                            icon={RefreshCw}
                            tooltip={t('common:refresh')}
                            loading={isFetching}
                            onClick={handleRefresh}
                        />
                        {canEdit && (
                            <HuemulButton
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 ml-auto text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
                                onClick={() => setPickerOpen(true)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                {t('addButton')}
                            </HuemulButton>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-2">
                        {dependencies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
                                <Link2 className="h-8 w-8 text-gray-300" />
                                <p className="text-sm font-medium text-gray-600">{t('list.empty')}</p>
                                <p className="text-xs text-gray-400 max-w-xs">{t('list.emptyHint')}</p>
                                {canEdit && (
                                    <HuemulButton
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 hover:cursor-pointer"
                                        onClick={() => setPickerOpen(true)}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        {t('addButton')}
                                    </HuemulButton>
                                )}
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {dependencies.map((dependency) => (
                                    <DependencyListItem
                                        key={dependency.id}
                                        dependency={dependency}
                                        orgId={orgId}
                                        canEdit={canEdit}
                                        onChangeVersion={handleChangeVersion}
                                        onRemove={handleRemoveDependency}
                                    />
                                ))}
                            </ul>
                        )}

                        {addDependencyMutation.isPending && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 mt-3 p-3 bg-blue-50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('list.adding')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {canEdit && selectedOrganizationId && (
                <HuemulAssetTreePickerDialog
                    open={pickerOpen}
                    onOpenChange={setPickerOpen}
                    organizationId={selectedOrganizationId}
                    mode="document"
                    container="sheet"
                    keepOpenOnSelect
                    disabledIds={disabledPickerIds}
                    disabledHint={t('picker.alreadyDependency')}
                    title={t('picker.title')}
                    description={t('picker.description')}
                    onSelect={handlePickAsset}
                />
            )}

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
