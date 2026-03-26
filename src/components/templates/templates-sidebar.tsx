import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Loader2, Search, Edit3, Trash2, FileCode, RefreshCw, MoreVertical, X, ChevronLeft, ChevronRight } from "lucide-react";
import { CreateTemplateDialog } from "./templates-create-dialog";
import { EditTemplateDialog } from "./templates-edit-dialog";
import { DeleteTemplateDialog } from "./templates-delete-dialog";

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
}

interface TemplatesPagination {
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

interface TemplatesSidebarProps {
  templates: TemplateItem[];
  isLoading: boolean;
  error?: Error | unknown | null;
  selectedTemplateId: string | null;
  onTemplateSelect: (template: TemplateItem) => void;
  onTemplateDeleted?: () => void;
  organizationId: string | null;
  onRefresh?: () => void;
  onSearch?: (term: string) => void;
  searchValue?: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  pagination?: TemplatesPagination;
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
  pagination,
}: TemplatesSidebarProps) {
  const { t } = useTranslation(['templates', 'common']);
  const queryClient = useQueryClient();
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogTemplate, setEditDialogTemplate] = useState<TemplateItem | null>(null);
  const [deleteDialogTemplate, setDeleteDialogTemplate] = useState<TemplateItem | null>(null);

  const filteredTemplates = templates;

  const openEditDialog = (template: TemplateItem) => {
    setEditDialogTemplate(template);
  };

  const closeEditDialog = () => {
    setEditDialogTemplate(null);
  };

  const openDeleteDialog = (template: TemplateItem) => {
    setDeleteDialogTemplate(template);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogTemplate(null);
  };

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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => setIsDialogOpen(true), 0);
                      }} className="hover:cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        {t('templates:sidebar.newTemplate')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </SidebarGroup>
          
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
        <div className="flex-1 overflow-y-auto px-2 min-h-0">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="pt-1">
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
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["templates", organizationId] })}
                  />
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">{t('templates:sidebar.loading')}</span>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm mb-2">
                    {searchValue ? t('templates:sidebar.noTemplatesMatchSearch') : t('templates:sidebar.noTemplatesFound')}
                  </p>
                  {!searchValue && (
                    <p className="text-xs">{t('templates:sidebar.noTemplatesHint')}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredTemplates.map((template) => (
                    <ContextMenu key={template.id}>
                      <ContextMenuTrigger asChild>
                        <div
                          className={`group p-1 rounded-md cursor-pointer transition-colors border ${
                            selectedTemplateId === template.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                          }`}
                          onClick={() => onTemplateSelect(template)}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="shrink-0">
                              <FileCode className={`h-3.5 w-3.5 ${
                                selectedTemplateId === template.id
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className={`font-medium text-xs truncate ${
                                selectedTemplateId === template.id
                                  ? 'text-blue-900'
                                  : 'text-gray-900'
                              }`}>
                                {template.name}
                              </h3>
                              {template.description && (
                                <p className={`text-[10px] truncate mt-0.5 ${
                                  selectedTemplateId === template.id
                                    ? 'text-blue-600'
                                    : 'text-gray-500'
                                }`}>
                                  {template.description}
                                </p>
                              )}
                            </div>
                            {(canUpdate || canDelete) && (
                              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 hover:cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {canUpdate && (
                                      <DropdownMenuItem
                                        className="hover:cursor-pointer"
                                        onSelect={() => {
                                          setTimeout(() => openEditDialog(template), 0);
                                        }}
                                      >
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Edit Template
                                      </DropdownMenuItem>
                                    )}
                                    {canDelete && (
                                      <DropdownMenuItem
                                        className="hover:cursor-pointer text-red-600"
                                        onSelect={() => {
                                          setTimeout(() => openDeleteDialog(template), 0);
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Template
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        {canUpdate && (
                          <ContextMenuItem
                            className="hover:cursor-pointer"
                            onSelect={() => {
                              setTimeout(() => openEditDialog(template), 0);
                            }}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit Template
                          </ContextMenuItem>
                        )}
                        {canDelete && (
                          <ContextMenuItem
                            className="hover:cursor-pointer text-red-600"
                            onSelect={() => {
                              setTimeout(() => openDeleteDialog(template), 0);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Template
                          </ContextMenuItem>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
                  )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              {canCreate && (
                <ContextMenuItem
                  className="hover:cursor-pointer"
                  onClick={() => {
                    setTimeout(() => setIsDialogOpen(true), 0);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>
        </div>

        {/* Pagination footer - always visible */}
        {pagination && (
          <div className="shrink-0 flex items-center justify-between gap-2 px-2 py-1.5 border-t border-gray-200 bg-white">
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-6 w-[72px] text-[10px] hover:cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 250].map((s) => (
                  <SelectItem key={s} value={s.toString()} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-[10px] text-muted-foreground shrink-0">
              {t('common:pagination.page')} {pagination.page}
            </span>

            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="icon"
                className={`h-6 w-6 hover:cursor-pointer transition-opacity ${!pagination.hasPrevious ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={!pagination.hasPrevious}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`h-6 w-6 hover:cursor-pointer transition-opacity ${!pagination.hasNext ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={!pagination.hasNext}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
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
          onOpenChange={(open) => { if (!open) closeEditDialog(); }}
          templateId={editDialogTemplate.id}
          templateName={editDialogTemplate.name}
          templateDescription={editDialogTemplate.description}
          organizationId={organizationId}
          onSuccess={() => {
            onRefresh?.();
            closeEditDialog();
          }}
        />
      )}

      {deleteDialogTemplate && organizationId && (
        <DeleteTemplateDialog
          open={!!deleteDialogTemplate}
          onOpenChange={(open) => { if (!open) closeDeleteDialog(); }}
          templateId={deleteDialogTemplate.id}
          templateName={deleteDialogTemplate.name}
          organizationId={organizationId}
          onSuccess={() => {
            closeDeleteDialog();
            onTemplateDeleted?.();
          }}
        />
      )}
    </>
  );
}
