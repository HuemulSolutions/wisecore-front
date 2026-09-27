import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Plus, GitBranch } from "lucide-react";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { HuemulPagination } from "@/huemul/components/huemul-pagination";
import { HuemulAssetTreePickerDialog } from "@/huemul/components/huemul-asset-tree-picker";
import { TemplateSettingsPanelHeader } from "./templates-settings-panel-header";
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
  /** Chevron a la izquierda del título — vuelve a la lista de grupos de "Configuración". */
  onBack?: () => void;
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
  onBack,
}: TemplateDependenciesTabProps) {
  const { t } = useTranslation(['dependencies', 'common', 'templates']);
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-8">
      <TemplateSettingsPanelHeader
        className="shrink-0 pb-4 pt-1"
        titleWrapClassName="max-w-[620px]"
        onBack={onBack}
        icon={GitBranch}
        title={t('templateTab.title')}
        subtitle={t('templateTab.description')}
        refresh={{ onClick: handleRefresh, loading: isRefreshing || isFetching }}
        primaryAction={canManage && canPickAssets ? { icon: Plus, label: t('templateTab.addButton'), onClick: () => setPickerOpen(true) } : undefined}
      />

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {isTableLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">{t('loading')}</span>
          </div>
        ) : dependencies.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-[10px] border border-dashed border-[#d7dde5] p-7 text-center">
            <p className="text-sm font-semibold text-[#475569]">{t('templateTab.empty')}</p>
            <p className="text-[13px] text-[#64748b]">{t('templateTab.emptyHint')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-[#eef1f5] bg-white">
            <ul className="divide-y divide-[#eef1f5]">
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
          </div>
        )}

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
