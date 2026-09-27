import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulPanelHeader } from "@/huemul/components/huemul-panel-header";
import { HuemulFileTree } from "@/huemul/components/huemul-file-tree";
import type { HuemulFileTreeRef } from "@/huemul/components/huemul-file-tree";
import type { HuemulTreeNode, HuemulTreeMenuAction } from "@/types/huemul";
import { useDebounce } from "@/hooks/use-debounce";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FileCode, Edit3, Trash2, RefreshCw, X, Copy, Download, FileJson, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportTemplates } from "@/services/templates";
import { CreateTemplateDialog } from "./templates-create-dialog";
import { EditTemplateDialog } from "./templates-edit-dialog";
import { DeleteTemplateDialog } from "./templates-delete-dialog";
import { CloneTemplateDialog } from "./templates-clone-dialog";
import { TemplatesImportSheet } from "./templates-import-sheet";
import type { TemplateItem } from '@/types/templates';
import type { TemplatesSidebarProps } from '@/types/templates';
export type { TemplatesSidebarProps } from '@/types/templates';

const TEMPLATE_NODE_TYPE = "template";

function templateToNode(template: TemplateItem): HuemulTreeNode {
  return {
    id: template.id,
    name: template.name,
    type: TEMPLATE_NODE_TYPE,
    metadata: {
      description: template.description,
      sections_count: template.sections_count,
      usage_count: template.usage_count,
    },
  };
}

export function TemplatesSidebar({
  templates,
  isLoading,
  error,
  selectedTemplateId,
  onTemplateSelect,
  onTemplateDeleted,
  organizationId,
  onRefresh,
  onSearch,
  searchValue = '',
  canCreate,
  canUpdate,
  canDelete,
  canExport,
  canImport,
  hasNext,
  onLoadMore,
}: TemplatesSidebarProps) {
  const { t } = useTranslation(['templates', 'common']);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debouncedSearch = useDebounce(localSearch, 400);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogTemplate, setEditDialogTemplate] = useState<TemplateItem | null>(null);
  const [deleteDialogTemplate, setDeleteDialogTemplate] = useState<TemplateItem | null>(null);
  const [cloneDialogTemplate, setCloneDialogTemplate] = useState<TemplateItem | null>(null);

  // Export selection mode + import
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [showImportSheet, setShowImportSheet] = useState(false);

  // El árbol maneja su propia data vía onLoadChildren/onRefresh; react-query sigue
  // siendo la fuente de verdad (búsqueda + paginación). Mantenemos los templates en
  // un ref para alimentar el árbol con callbacks estables y lo refrescamos cuando
  // llega una nueva página/búsqueda.
  const treeRef = useRef<HuemulFileTreeRef>(null);
  const templatesRef = useRef<TemplateItem[]>(templates);
  templatesRef.current = templates;

  const loadTemplateNodes = useCallback(
    () => Promise.resolve(templatesRef.current.map(templateToNode)),
    [],
  );

  useEffect(() => {
    treeRef.current?.refresh();
  }, [templates]);

  // Filtra en tiempo real: cada tipeo dispara onSearch tras el debounce, sin
  // esperar Enter. El guard contra searchValue evita un llamado de más cuando
  // el cambio ya vino del padre (ej. al limpiar un filtro externo).
  useEffect(() => {
    if (debouncedSearch !== searchValue) {
      onSearch?.(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const isAllSelected = templates.length > 0 && selectedIds.size === templates.length;

  const handleExport = async () => {
    if (!organizationId) return;
    if (selectedIds.size === 0) {
      toast.error(t('templates:exportImport.exportSelectionRequired'));
      return;
    }
    setIsExporting(true);
    try {
      await exportTemplates(organizationId, { template_ids: [...selectedIds] });
      exitSelectionMode();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('templates:exportImport.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  // Acciones por nodo (clone/edit/delete), gateadas por permisos.
  const menuActions: HuemulTreeMenuAction[] = [];
  if (canCreate) {
    menuActions.push({
      label: t('templates:sidebar.cloneTemplate'),
      icon: <Copy className="h-4 w-4" />,
      onClick: async (id) => {
        const tpl = templatesRef.current.find((t) => t.id === id);
        if (tpl) setCloneDialogTemplate(tpl);
      },
    });
  }
  if (canUpdate) {
    menuActions.push({
      label: t('templates:sidebar.editTemplate'),
      icon: <Edit3 className="h-4 w-4" />,
      onClick: async (id) => {
        const tpl = templatesRef.current.find((t) => t.id === id);
        if (tpl) setEditDialogTemplate(tpl);
      },
    });
  }
  if (canExport) {
    menuActions.push({
      label: t('templates:sidebar.exportTemplateJson'),
      icon: <FileJson className="h-4 w-4" />,
      onClick: async (id) => {
        if (!organizationId) return;
        try {
          await exportTemplates(organizationId, { template_ids: [id] });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t('templates:sidebar.exportTemplateError'));
        }
      },
    });
  }
  if (canDelete) {
    menuActions.push({
      variant: "destructive",
      label: t('templates:sidebar.deleteTemplate'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (id) => {
        const tpl = templatesRef.current.find((t) => t.id === id);
        if (tpl) setDeleteDialogTemplate(tpl);
      },
    });
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        {/* Header */}
        <div className="py-2">
          <HuemulPanelHeader
            title={t('templates:sidebar.title')}
            titleClassName="text-[13px] font-semibold text-foreground"
            search={{
              value: localSearch,
              onChange: setLocalSearch,
              alwaysOpen: true,
              showIcon: true,
              placeholder: t('templates:sidebar.searchPlaceholder'),
            }}
            onRefresh={() => onRefresh?.()}
            isRefreshing={isLoading}
            actions={
              canCreate && (
                <HuemulButton
                  icon={Plus}
                  iconClassName="h-3.5 w-3.5"
                  label={t('templates:sidebar.newTemplateShort')}
                  tooltip={t('templates:sidebar.newTemplate')}
                  variant="default"
                  size="sm"
                  className="h-7 rounded-[7px] px-2.5 text-xs font-semibold"
                  onClick={() => setIsDialogOpen(true)}
                />
              )
            }
          />

          {/* Selection bar */}
          {isSelectionMode && (
            <div className="flex flex-col gap-2 mx-2 mt-1.5 px-2 py-2 rounded-md border bg-muted/40">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:cursor-pointer"
                  onClick={exitSelectionMode}
                  aria-label={t('common:cancel')}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <span className="flex-1 min-w-0 truncate text-xs font-medium">
                  {t('templates:exportImport.selectedCount', { count: selectedIds.size })}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-6 px-0 text-xs shrink-0"
                  onClick={() =>
                    setSelectedIds(
                      isAllSelected ? new Set() : new Set(templatesRef.current.map((tpl) => tpl.id)),
                    )
                  }
                >
                  {isAllSelected ? t('common:deselectAll') : t('common:selectAll')}
                </Button>
              </div>
              <Button
                size="sm"
                className="w-full h-8 text-xs"
                disabled={selectedIds.size === 0 || isExporting}
                onClick={handleExport}
              >
                {isExporting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />{t('templates:exportImport.exportingAction')}</>
                ) : (
                  <><Download className="h-3.5 w-3.5 mr-1.5" />{`${t('templates:exportImport.exportAction')} (${selectedIds.size})`}</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0" type="hover">
          <div className="px-2 pt-1">
            {error ? (
              <div className="flex flex-col items-center justify-center min-h-75 text-center rounded-lg border border-dashed p-6">
                <p className="text-red-600 mb-3 font-medium text-sm">
                  {(error as Error).message || t('templates:sidebar.loadError')}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {t('templates:sidebar.loadErrorDescription')}
                </p>
                <HuemulButton
                  icon={RefreshCw}
                  iconClassName="h-3.5 w-3.5 mr-2"
                  label={t('common:tryAgain')}
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => onRefresh?.()}
                />
              </div>
            ) : isLoading && templates.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">{t('common:loading')}</span>
              </div>
            ) : (
              <>
                {/* Encabezado de grupo: agrupamiento visual único, sin criterio real de categoría todavía. */}
                <div className="px-2 pb-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                    {t('templates:sidebar.title')}
                  </span>
                </div>
                <HuemulFileTree
                  ref={treeRef}
                  onLoadChildren={loadTemplateNodes}
                  onRefresh={loadTemplateNodes}
                  folderType="folder"
                  showCreateButtons={false}
                  showDefaultActions={{ create: false, delete: false, share: false }}
                  showBorder={false}
                  minHeight="0"
                  activeNodeId={selectedTemplateId}
                  disableIndentPadding
                  renderNodeClassName={(node) =>
                    cn(
                      "gap-[9px] rounded-lg border px-2.5 py-2 items-start",
                      node.id === selectedTemplateId
                        ? "bg-[#eff4ff] border-[#dbe6ff] hover:bg-[#eff4ff] text-[#0f172a] font-semibold"
                        : "bg-transparent border-transparent hover:bg-[#f1f4f7] text-[#334155] font-normal",
                    )
                  }
                  nodeNameClassName={(node) =>
                    node.id === selectedTemplateId ? "text-[13px] font-semibold" : "text-[13px] font-normal"
                  }
                  menuActions={menuActions}
                  alwaysShowMenuActions
                  onFileClick={(node) => {
                    const tpl = templatesRef.current.find((tItem) => tItem.id === node.id);
                    if (tpl) onTemplateSelect(tpl);
                  }}
                  renderLeafIcon={(node) => (
                    <FileCode
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        node.id === selectedTemplateId ? "text-[#2563eb]" : "text-[#94a3b8]",
                      )}
                    />
                  )}
                  selectable={isSelectionMode}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  labels={{
                    empty: searchValue
                      ? t('templates:sidebar.noTemplatesMatchSearch')
                      : t('templates:sidebar.noTemplatesFound'),
                    loading: t('common:loading'),
                  }}
                />
              </>
            )}

            {hasNext && !error && !(isLoading && templates.length === 0) && (
              <div className="flex justify-center pt-2 pb-1">
                <HuemulButton
                  label={isLoading ? t('common:loading') : t('common:loadMore')}
                  variant="ghost"
                  size="sm"
                  loading={isLoading}
                  onClick={onLoadMore}
                  className="text-xs text-primary hover:text-primary/80 hover:cursor-pointer"
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {(canImport || canExport) && (
          <div className="flex items-center gap-4 border-t border-[#eef1f5] px-4 py-3">
            {canImport && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary hover:cursor-pointer"
                onClick={() => setShowImportSheet(true)}
              >
                {t('templates:sidebar.footerImport')}
              </button>
            )}
            {canExport && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary hover:cursor-pointer"
                onClick={() => setIsSelectionMode(true)}
              >
                {t('templates:sidebar.footerExport')}
              </button>
            )}
          </div>
        )}
      </div>

      <CreateTemplateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        organizationId={organizationId}
        onTemplateCreated={(template) => {
          onTemplateSelect(template);
        }}
      />

      {editDialogTemplate && organizationId && (
        <EditTemplateDialog
          open={!!editDialogTemplate}
          onOpenChange={(open) => { if (!open) setEditDialogTemplate(null); }}
          templateId={editDialogTemplate.id}
          templateName={editDialogTemplate.name}
          templateDescription={editDialogTemplate.description}
          organizationId={organizationId}
          onSuccess={() => {
            onRefresh?.();
            setEditDialogTemplate(null);
          }}
        />
      )}

      {deleteDialogTemplate && organizationId && (
        <DeleteTemplateDialog
          open={!!deleteDialogTemplate}
          onOpenChange={(open) => { if (!open) setDeleteDialogTemplate(null); }}
          templateId={deleteDialogTemplate.id}
          templateName={deleteDialogTemplate.name}
          organizationId={organizationId}
          onSuccess={() => {
            setDeleteDialogTemplate(null);
            onTemplateDeleted?.();
          }}
        />
      )}

      {cloneDialogTemplate && organizationId && (
        <CloneTemplateDialog
          open={!!cloneDialogTemplate}
          onOpenChange={(open) => { if (!open) setCloneDialogTemplate(null); }}
          templateId={cloneDialogTemplate.id}
          organizationId={organizationId}
          onSuccess={(cloned) => {
            setCloneDialogTemplate(null);
            onRefresh?.();
            onTemplateSelect(cloned);
          }}
        />
      )}

      <TemplatesImportSheet
        open={showImportSheet}
        organizationId={organizationId}
        onOpenChange={(open) => { if (!open) setShowImportSheet(false); }}
        onImportSuccess={() => onRefresh?.()}
      />
    </>
  );
}
