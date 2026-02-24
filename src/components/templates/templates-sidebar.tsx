import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, FileText, Loader2, Search, Edit3, Trash2, FileCode, RefreshCw, MoreVertical } from "lucide-react";
import { CreateTemplateDialog } from "./templates-create-dialog";
import { EditTemplateDialog } from "./templates-edit-dialog";
import { DeleteTemplateDialog } from "./templates-delete-dialog";

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
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
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
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
  canCreate,
  canUpdate,
  canDelete,
}: TemplatesSidebarProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogTemplate, setEditDialogTemplate] = useState<TemplateItem | null>(null);
  const [deleteDialogTemplate, setDeleteDialogTemplate] = useState<TemplateItem | null>(null);

  // Filtrar templates basado en búsqueda
  const filteredTemplates = searchTerm
    ? templates.filter((template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : templates;

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
              <SidebarGroupLabel className="py-0 text-xs">Templates</SidebarGroupLabel>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 hover:cursor-pointer"
                  onClick={() => onRefresh?.()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
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
                        New Template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </SidebarGroup>
          
          {/* Search bar */}
          <div className="mt-2 px-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-7 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-2 min-h-0">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="pt-1">
                  {error ? (
                <div className="flex flex-col items-center justify-center min-h-75 text-center rounded-lg border border-dashed p-6">
                  <p className="text-red-600 mb-3 font-medium text-sm">
                    {(error as Error).message || 'Failed to load templates'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    There was an error loading the templates. Please try again.
                  </p>
                  <Button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["templates", organizationId] })} 
                    variant="outline" 
                    size="sm"
                    className="hover:cursor-pointer h-8"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm mb-2">
                    {searchTerm ? 'No templates match your search' : 'No templates found'}
                  </p>
                  {!searchTerm && (
                    <p className="text-xs">Create your first template to get started</p>
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
