import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link2, List, Paperclip, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulMediaUploadSheet } from "@/huemul/components/huemul-media-upload-sheet";
import type { AssetDetailPanelProps, AssetDetailPanelRailItem, AssetDetailPanelTab } from "@/types/assets";
import type { MediaScope } from "@/types/media";
import { AssetsDetailPanelRail } from "./assets-detail-panel-rail";
import { AssetsPanelIndexTab } from "./assets-panel-index-tab";
import { AssetsPanelFieldsTab } from "./assets-panel-fields-tab";
import { AssetsPanelFilesTab, type AssetsPanelFilesTabHandle } from "./assets-panel-files-tab";
import { AssetsPanelLinksTab, type AssetsPanelLinksTabHandle } from "./assets-panel-links-tab";

// Duración mínima del giro del ícono de refresh, independiente de cuánto tarde la
// query real — evita un "parpadeo" cuando la respuesta vuelve casi instantánea.
const MIN_SPIN_MS = 900;

/**
 * Panel de detalle del activo: rail vertical (Índice/Campos/Recursos/Activos relacionados) +
 * header contextual (título, "+", refresh) + contenido del tab. Ver ia context/list-detail-panel-guide.md.
 */
export function AssetsDetailPanel(props: AssetDetailPanelProps) {
  const { t } = useTranslation(["assets", "common"]);
  const {
    organizationId,
    documentId,
    executionId,
    versionLabel,
    canListCustomFields,
    canCreateFields,
    canUpdateFields,
    canDeleteFields,
    canCreateMedia,
    canUpdateMedia,
    canDeleteMedia,
    canListExecutionRelationships,
    canOpenDiagrams,
    canListAssetTypes,
    canDeleteRelationship,
    activeTab,
    onActiveTabChange,
    tocItems,
    canAddSection,
    onAddSection,
    onRefreshIndex,
    customFields,
    isLoadingCustomFields,
    isRefreshingCustomFields,
    customFieldsPage,
    customFieldsPageSize,
    uploadingImageFieldId,
    onCustomFieldsPageChange,
    onAddCustomField,
    onEditCustomField,
    onEditCustomFieldContent,
    onDeleteCustomField,
    onRefreshCustomFields,
    executions,
    onOpenMediaSheet,
    isCollapsed,
    onToggleCollapse,
    className,
  } = props;

  const [refreshingTab, setRefreshingTab] = useState<AssetDetailPanelTab | null>(null);
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [filesCount, setFilesCount] = useState(0);
  const [linksCount, setLinksCount] = useState(0);

  // Alcance elegido en el selector del tab Recursos — controla qué se lista, a
  // dónde sube el "+" del header y con qué se abre "Ver todos los recursos".
  // Se resincroniza con la versión que el editor tiene abierta cada vez que
  // cambia el activo o la versión seleccionada.
  const [filesScope, setFilesScope] = useState<MediaScope>(
    executionId ? { level: "execution", parentId: executionId } : { level: "document", parentId: documentId },
  );
  useEffect(() => {
    setFilesScope(executionId ? { level: "execution", parentId: executionId } : { level: "document", parentId: documentId });
  }, [documentId, executionId]);

  const filesRef = useRef<AssetsPanelFilesTabHandle>(null);
  const linksRef = useRef<AssetsPanelLinksTabHandle>(null);

  // El tab activo no puede quedar apuntando a un tab que el usuario no puede ver
  // (el guard vive acá porque `activeTab` es estado controlado por el caller).
  useEffect(() => {
    if (activeTab === "fields" && !canListCustomFields) onActiveTabChange("index");
    if (activeTab === "links" && !canListExecutionRelationships) onActiveTabChange("index");
  }, [activeTab, canListCustomFields, canListExecutionRelationships, onActiveTabChange]);

  const runRefresh = useCallback((tab: AssetDetailPanelTab, task?: () => void | Promise<unknown>) => {
    setRefreshingTab(tab);
    const start = Date.now();
    Promise.resolve(task?.()).finally(() => {
      const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - start));
      setTimeout(() => {
        setRefreshingTab((current) => (current === tab ? null : current));
      }, wait);
    });
  }, []);

  const handleRefresh = useCallback(() => {
    switch (activeTab) {
      case "index": return runRefresh("index", onRefreshIndex);
      case "fields": return runRefresh("fields", onRefreshCustomFields);
      case "files": return runRefresh("files", () => filesRef.current?.refresh());
      case "links": return runRefresh("links", () => linksRef.current?.refresh());
    }
  }, [activeTab, onRefreshIndex, onRefreshCustomFields, runRefresh]);

  const railItems: AssetDetailPanelRailItem[] = [
    { key: "index", label: t("content.detailPanel.tabs.index"), icon: List, visible: true },
    { key: "fields", label: t("content.detailPanel.tabs.fields"), icon: SlidersHorizontal, visible: canListCustomFields },
    { key: "files", label: t("content.detailPanel.tabs.files"), icon: Paperclip, count: filesCount, visible: true },
    { key: "links", label: t("content.detailPanel.tabs.linksShort"), icon: Link2, count: linksCount, visible: canListExecutionRelationships },
  ];

  const handleSelectTab = (tab: AssetDetailPanelTab) => {
    onActiveTabChange(tab);
    if (isCollapsed) onToggleCollapse();
  };

  const isRefreshing = refreshingTab === activeTab;

  const addAction = (() => {
    if (activeTab === "index" && canAddSection && onAddSection) {
      return { label: t("content.detailPanel.addIndex"), onClick: onAddSection };
    }
    if (activeTab === "fields" && canCreateFields) {
      return { label: t("content.detailPanel.addFields"), onClick: onAddCustomField };
    }
    if (activeTab === "files" && canCreateMedia) {
      return { label: t("content.detailPanel.addFiles"), onClick: () => setIsUploadSheetOpen(true) };
    }
    return null;
  })();

  if (isCollapsed) {
    return (
      <div className={cn("asset-detail-panel flex h-full flex-col overflow-hidden bg-card", className)}>
        <AssetsDetailPanelRail
          items={railItems}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          collapseLabel={t("content.detailPanel.collapse")}
          expandLabel={t("content.detailPanel.expand")}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("asset-detail-panel flex h-full overflow-hidden rounded-xl border bg-card shadow-sm", className)}
      style={{ borderColor: "var(--adp-border, var(--border))" }}
    >
      <AssetsDetailPanelRail
        items={railItems}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        collapseLabel={t("content.detailPanel.collapse")}
        expandLabel={t("content.detailPanel.expand")}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header: título del tab activo + "+" contextual + refresh */}
        <div
          className="flex shrink-0 items-center justify-between gap-1 border-b px-2.5 py-2"
          style={{ borderColor: "var(--adp-border, var(--border))" }}
        >
          <h3 className="truncate text-sm font-semibold text-foreground">{t(`content.detailPanel.tabs.${activeTab}`)}</h3>
          <div className="flex shrink-0 items-center gap-0.5">
            {addAction && (
              <HuemulButton
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                icon={Plus}
                iconClassName="h-3.5 w-3.5"
                tooltip={addAction.label}
                onClick={addAction.onClick}
              />
            )}
            <HuemulButton
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              icon={RefreshCw}
              iconClassName={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
              tooltip={t("common:refresh")}
              onClick={handleRefresh}
            />
          </div>
        </div>

        {/* Contenido del tab activo — Archivos y Vínculos quedan montados aunque no
            estén activos, para que sus contadores del rail no partan en 0 al abrir el panel. */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className={cn("h-full", activeTab !== "index" && "hidden")}>
            <AssetsPanelIndexTab items={tocItems} onAddSection={onAddSection} canAddSection={canAddSection} />
          </div>
          {canListCustomFields && (
            <div className={cn("h-full", activeTab !== "fields" && "hidden")}>
              <AssetsPanelFieldsTab
                customFields={customFields}
                isLoading={isLoadingCustomFields}
                isRefreshing={isRefreshingCustomFields}
                page={customFieldsPage}
                pageSize={customFieldsPageSize}
                uploadingImageFieldId={uploadingImageFieldId}
                canCreate={canCreateFields}
                canUpdate={canUpdateFields}
                canDelete={canDeleteFields}
                onPageChange={onCustomFieldsPageChange}
                onAdd={onAddCustomField}
                onEdit={onEditCustomField}
                onEditContent={onEditCustomFieldContent}
                onDelete={onDeleteCustomField}
                onRefresh={onRefreshCustomFields}
              />
            </div>
          )}
          <div className={cn("h-full", activeTab !== "files" && "hidden")}>
            <AssetsPanelFilesTab
              ref={filesRef}
              organizationId={organizationId}
              documentId={documentId}
              scope={filesScope}
              onScopeChange={setFilesScope}
              executions={executions}
              canCreateMedia={canCreateMedia}
              canUpdateMedia={canUpdateMedia}
              canDeleteMedia={canDeleteMedia}
              onUpload={() => setIsUploadSheetOpen(true)}
              onOpenMediaSheet={() => onOpenMediaSheet(filesScope)}
              onCountChange={setFilesCount}
            />
          </div>
          {canListExecutionRelationships && (
            <div className={cn("h-full", activeTab !== "links" && "hidden")}>
              <AssetsPanelLinksTab
                ref={linksRef}
                organizationId={organizationId}
                executionId={executionId}
                currentDocumentId={documentId}
                versionLabel={versionLabel}
                canOpenDiagrams={canOpenDiagrams}
                canListAssetTypes={canListAssetTypes}
                canDeleteRelationship={canDeleteRelationship}
                onCountChange={setLinksCount}
              />
            </div>
          )}
        </div>
      </div>

      <HuemulMediaUploadSheet
        open={isUploadSheetOpen}
        onOpenChange={setIsUploadSheetOpen}
        organizationId={organizationId}
        fixedLevel={{ level: filesScope.level, parentId: filesScope.parentId }}
        canCreate={canCreateMedia}
        onUploaded={() => runRefresh("files", () => filesRef.current?.refresh())}
      />
    </div>
  );
}
