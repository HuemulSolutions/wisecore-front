import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Paperclip, Trash2 } from "lucide-react";
import { useMediaList, useMediaMutations } from "@/hooks/useMedia";
import { useMediaViewMode } from "@/hooks/useMediaViewMode";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state";
import { HuemulViewToggle } from "@/huemul/components/huemul-view-toggle";
import { HuemulMediaGallery } from "@/huemul/components/huemul-media-gallery";
import { HuemulMediaDetailSheet } from "@/huemul/components/huemul-media-detail-sheet";
import { HuemulMediaScopeSelector } from "@/huemul/components/huemul-media-scope-selector";
import type { Media, MediaScope, MediaScopeExecutionOption } from "@/types/media";

export interface AssetsPanelFilesTabProps {
  organizationId: string;
  documentId: string;
  scope: MediaScope;
  onScopeChange: (scope: MediaScope) => void;
  executions: MediaScopeExecutionOption[];
  canCreateMedia: boolean;
  canUpdateMedia: boolean;
  canDeleteMedia: boolean;
  onUpload: () => void;
  onOpenMediaSheet: () => void;
  onFetchingChange?: (isFetching: boolean) => void;
  onCountChange?: (count: number) => void;
}

export interface AssetsPanelFilesTabHandle {
  refresh: () => void | Promise<unknown>;
}

/**
 * Tab "Recursos" del panel de detalle — reusa los componentes de media que ya
 * usa el resto de la app (`HuemulMediaGallery`, `HuemulViewToggle` +
 * `useMediaViewMode`, `HuemulMediaDetailSheet`, `HuemulMediaScopeSelector`), en
 * vez de filas a mano. El alcance (documento completo / versión) es controlado
 * por `assets-detail-panel.tsx`, que también lo usa para fijar el destino del
 * botón de subida. La vista completa paginada sigue viviendo en `MediaListSheet`,
 * abierta desde el enlace del pie.
 */
export const AssetsPanelFilesTab = forwardRef<AssetsPanelFilesTabHandle, AssetsPanelFilesTabProps>(function AssetsPanelFilesTab({
  organizationId,
  documentId,
  scope,
  onScopeChange,
  executions,
  canCreateMedia,
  canUpdateMedia,
  canDeleteMedia,
  onUpload,
  onOpenMediaSheet,
  onFetchingChange,
  onCountChange,
}, ref) {
  const { t } = useTranslation(["assets", "media", "common"]);
  const [viewMode, setViewMode] = useMediaViewMode();
  const [selectedItem, setSelectedItem] = useState<Media | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const { deleteMedia } = useMediaMutations(organizationId);

  const mediaQuery = useMediaList(organizationId, scope.level, { parentId: scope.parentId });

  useImperativeHandle(ref, () => ({
    refresh: () => mediaQuery.refetch(),
  }), [mediaQuery]);

  useEffect(() => { onFetchingChange?.(mediaQuery.isFetching); }, [mediaQuery.isFetching, onFetchingChange]);

  const items = mediaQuery.data?.data ?? [];
  const totalCount = mediaQuery.data?.total ?? items.length;
  useEffect(() => { onCountChange?.(totalCount); }, [totalCount, onCountChange]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMedia.mutateAsync(deleteTarget.id);
      toast.success(t("media:detail.deleteMediaSuccess"));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(t("content.detailPanel.files.deleteError"));
      throw error;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2 pb-1">
        <HuemulMediaScopeSelector
          compact
          scope={scope}
          onScopeChange={onScopeChange}
          documentId={documentId}
          executions={executions}
        />
        {items.length > 0 && <HuemulViewToggle value={viewMode} onChange={setViewMode} />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
        {!mediaQuery.isLoading && items.length === 0 && !mediaQuery.isError ? (
          <HuemulPanelEmptyState
            icon={Paperclip}
            title={t("content.detailPanel.files.emptyTitle")}
            description={t("content.detailPanel.files.emptyDescription")}
            action={canCreateMedia ? { label: t("content.detailPanel.files.upload"), onClick: onUpload } : undefined}
            hint={!canCreateMedia ? t("content.detailPanel.files.noPermissionCreate") : undefined}
          />
        ) : (
          <HuemulMediaGallery
            items={items}
            viewMode={viewMode}
            isLoading={mediaQuery.isLoading}
            isFetching={mediaQuery.isFetching}
            isError={mediaQuery.isError}
            onRetry={() => mediaQuery.refetch()}
            onSelect={(item) => {
              setSelectedItem(item);
              setDetailOpen(true);
            }}
            onDelete={canDeleteMedia ? (item) => setDeleteTarget(item) : undefined}
            deleteLabel={t("media:detail.deleteMedia")}
            emptyTitle={t("content.detailPanel.files.noMatchesTitle")}
            emptyDescription={t("content.detailPanel.files.noMatchesDescription")}
            loadError={t("media:loadError")}
            retryLabel={t("common:tryAgain")}
            gridClassName="grid grid-cols-1 gap-2 @[240px]/media:grid-cols-2"
          />
        )}
      </div>

      <div
        className="shrink-0 border-t px-3 py-2 text-center"
        style={{ borderColor: "var(--adp-border, var(--border))" }}
      >
        <button
          type="button"
          onClick={onOpenMediaSheet}
          className="text-xs font-medium hover:cursor-pointer hover:underline"
          style={{ color: "var(--adp-accent-fg, var(--primary))" }}
        >
          {t("content.detailPanel.files.viewAll", { count: items.length })}
        </button>
      </div>

      <HuemulMediaDetailSheet
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        organizationId={organizationId}
        canCreate={canCreateMedia}
        canUpdate={canUpdateMedia}
        canDelete={canDeleteMedia}
      />

      <HuemulAlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t("media:detail.deleteMediaTitle")}
        description={t("media:detail.deleteMediaDescription")}
        actionLabel={t("media:detail.deleteMediaConfirm")}
        actionIcon={Trash2}
        cancelLabel={t("common:cancel")}
        onAction={handleDelete}
      />
    </div>
  );
});
