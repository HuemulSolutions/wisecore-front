import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Input } from "@/components/ui/input";
import { HuemulFileTree } from "@/huemul/components/huemul-file-tree";
import type { HuemulFileTreeRef } from "@/huemul/components/huemul-file-tree";
import type { HuemulTreeNode, HuemulTreeMenuAction } from "@/types/huemul";

import {
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FileCode, Search, Edit3, Trash2, RefreshCw, MoreVertical, X, Copy, Upload, Download, Loader2 } from "lucide-react";
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
    metadata: { description: template.description },
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
}: TemplatesSidebarProps) {
  const { t } = useTranslation(['templates', 'common']);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  const showActionsMenu = canImport || canExport;

  return (
    <>
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        {/* Header */}
        <div className="py-2">
          <SidebarGroup className="py-0">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="py-0 text-xs">{t('templates:sidebar.title')}</SidebarGroupLabel>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:cursor-pointer"
                  onClick={() => {
                    if (isSearchOpen) { setLocalSearch(''); onSearch?.('') }
                    setIsSearchOpen(!isSearchOpen)
                  }}
                >
                  {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
                <HuemulButton
                  icon={RefreshCw}
                  iconClassName="h-4 w-4"
                  variant="ghost"
                  size="icon"
                  loading={isLoading}
                  tooltip={t('common:refresh')}
                  className="h-6 w-6"
                  onClick={() => onRefresh?.()}
                />
                {canCreate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:cursor-pointer"
                    onClick={() => setIsDialogOpen(true)}
                    aria-label={t('templates:sidebar.newTemplate')}
                    title={t('templates:sidebar.newTemplate')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                {showActionsMenu && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canExport && (
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onSelect={() => { setTimeout(() => setIsSelectionMode(true), 0); }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {t('templates:exportImport.exportMenu')}
                        </DropdownMenuItem>
                      )}
                      {canImport && (
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onSelect={() => { setTimeout(() => setShowImportSheet(true), 0); }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {t('templates:exportImport.importMenu')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </SidebarGroup>

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
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />{t('common:exporting')}</>
                ) : (
                  <><Download className="h-3.5 w-3.5 mr-1.5" />{`${t('common:export')} (${selectedIds.size})`}</>
                )}
              </Button>
            </div>
          )}

          {/* Search bar */}
          {isSearchOpen && (
            <div className="px-2 pt-1 pb-1">
              <Input
                placeholder={t('templates:sidebar.searchPlaceholder')}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch?.(localSearch)
                  if (e.key === 'Escape') { setLocalSearch(''); onSearch?.(''); setIsSearchOpen(false) }
                }}
                className="h-7 text-xs"
                autoFocus
              />
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
                menuActions={menuActions}
                onFileClick={(node) => {
                  const tpl = templatesRef.current.find((tItem) => tItem.id === node.id);
                  if (tpl) onTemplateSelect(tpl);
                }}
                renderLeafIcon={(node) => (
                  <FileCode
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      node.id === selectedTemplateId ? "text-blue-600" : "text-gray-400",
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
            )}
          </div>
        </ScrollArea>
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
