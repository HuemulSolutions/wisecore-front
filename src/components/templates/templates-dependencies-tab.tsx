import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { HuemulPagination } from "@/huemul/components/huemul-pagination";
import { HuemulAssetTreePickerDialog } from "@/huemul/components/huemul-asset-tree-picker";
import { DependencyVersionDialog } from "@/components/dependency/dependency-version-dialog";
import { DependencyListItem } from "@/components/dependency/dependency-list-item";
import { useTableLoadingState } from "@/hooks/useTableLoadingState";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants";
import {
  templateDependenciesQueryKeys,
  useTemplateDependencies,
  useTemplateDependencyMutations,
} from "@/hooks/useTemplateDependencies";
import type { UpdateTemplateDependencyRequest } from "@/types/templates";
import type { Dependency } from "@/types/dependency/sheets";

export interface TemplateDependenciesTabProps {
  templateId: string;
  organizationId: string;
  /** template:u — alta/edición/borrado de dependencias. Sin esto, tab de solo lectura. */
  canManage?: boolean;
  /** asset:l|r + folder:l|r — el picker de documentos del alta. */
  canPickAssets?: boolean;
}

// Dependencias de documento a nivel de template (tab del detalle de
// template). Se copian a cada documento creado desde este template — copia
// one-shot, sin sincronización posterior. El endpoint pagina (a diferencia
// del de documento, que trae todo en un array).
export function TemplateDependenciesTab({
  templateId,
  organizationId,
  canManage = false,
  canPickAssets = false,
}: TemplateDependenciesTabProps) {
  const { t } = useTranslation(['dependencies', 'common']);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<{ id: string; name: string } | null>(null);
  const [editingDependency, setEditingDependency] = useState<Dependency | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dependencyToDelete, setDependencyToDelete] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useTemplateDependencies(organizationId, templateId, { page, pageSize });

  const mutations = useTemplateDependencyMutations(organizationId, templateId, {
    added: t('templateTab.toast.added'),
    versionUpdated: t('templateTab.toast.versionUpdated'),
    removed: t('templateTab.toast.removed'),
  });

  const { isTableLoading } = useTableLoadingState({ isLoading, isFetching, hasData: !!data });

  const dependencies = useMemo(() => data?.data ?? [], [data]);

  // Solo cubre la página cargada: con pageSize 100 es un no-problema
  // práctico. Si has_next, un documento dependiente de otra página podría
  // aparecer seleccionable; el backend lo rechaza y el onError global avisa.
  const disabledPickerIds = useMemo(
    () => dependencies.map((dep) => dep.document_id),
    [dependencies],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: templateDependenciesQueryKeys.listBase() });
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleConfirmVersionDialog = async (body: UpdateTemplateDependencyRequest) => {
    if (editingDependency) {
      await mutations.update.mutateAsync({ dependencyId: editingDependency.id, body });
    } else if (pendingDocument) {
      await mutations.create.mutateAsync({ depends_on_document_id: pendingDocument.id, ...body });
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
      await mutations.delete.mutateAsync(dependencyToDelete);
      setDependencyToDelete(null);
    }
  };

  if (error) {
    return (
      <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{t('errorLoading')}</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Fixed header */}
      <div className="px-4 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{t('templateTab.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('templateTab.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <HuemulButton
              variant="outline"
              size="sm"
              icon={RefreshCw}
              iconClassName="w-3 h-3 mr-1"
              label={t('common:refresh')}
              loading={isRefreshing || isFetching}
              onClick={handleRefresh}
              className="h-8 text-xs px-2"
            />
            {canManage && canPickAssets && (
              <HuemulButton
                size="sm"
                icon={Plus}
                iconClassName="w-3 h-3 mr-1"
                label={t('templateTab.addButton')}
                onClick={() => setPickerOpen(true)}
                className="h-8 text-xs px-2"
              />
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
            <Link2 className="h-4 w-4 text-[#4464f7]" />
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {t('templateTab.count', { count: dependencies.length })}
            </Badge>
          </div>

          <div className="p-2">
            {isTableLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">{t('loading')}</span>
              </div>
            ) : dependencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
                <Link2 className="h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">{t('templateTab.empty')}</p>
                <p className="text-xs text-gray-400 max-w-xs">{t('templateTab.emptyHint')}</p>
                {canManage && canPickAssets && (
                  <HuemulButton
                    variant="outline"
                    size="sm"
                    className="mt-2 hover:cursor-pointer"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {t('templateTab.addButton')}
                  </HuemulButton>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {dependencies.map((dependency) => (
                  <DependencyListItem
                    key={dependency.id}
                    dependency={dependency}
                    orgId={organizationId}
                    canEdit={canManage}
                    onChangeVersion={handleChangeVersion}
                    onRemove={handleRemoveDependency}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {(dependencies.length > 0 || page > 1) && (
          <div className="pt-2">
            <HuemulPagination
              page={page}
              pageSize={pageSize}
              hasNext={data?.has_next}
              hasPrevious={page > 1}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            />
          </div>
        )}
      </div>

      {canManage && canPickAssets && (
        <HuemulAssetTreePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          organizationId={organizationId}
          mode="document"
          container="dialog"
          keepOpenOnSelect
          disabledIds={disabledPickerIds}
          disabledHint={t('templateTab.picker.alreadyDependency')}
          title={t('templateTab.picker.title')}
          description={t('templateTab.picker.description')}
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
          isSubmitting={mutations.create.isPending || mutations.update.isPending}
        />
      )}

      <HuemulAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('templateTab.deleteDialog.title')}
        description={t('templateTab.deleteDialog.description')}
        actionLabel={t('common:delete')}
        onAction={confirmRemoveDependency}
        actionVariant="destructive"
      />
    </div>
  );
}
