import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Pencil, Trash2, Plus, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { ContextDisplay } from "@/components/context/context-content";
import { TemplateContextDialog } from "./templates-context-dialog";
import {
  templateContextQueryKeys,
  useTemplateContexts,
  useTemplateContextMutations,
} from "@/hooks/useTemplateContext";
import type { TemplateContext } from "@/types/templates";

export interface TemplateContextTabProps {
  templateId: string;
  organizationId: string;
  /** template:u — alta/edición/borrado de contexto. Sin esto, tab de solo lectura. */
  canManage?: boolean;
}

// Contexto de texto a nivel de template (tab del detalle de template). Se
// copia a cada documento creado desde este template — copia one-shot, sin
// sincronización posterior. A diferencia del contexto de documento no hay
// variante de archivo, así que no hay botón "Archivo" ni badge de tipo.
export function TemplateContextTab({ templateId, organizationId, canManage = false }: TemplateContextTabProps) {
  const { t } = useTranslation(['context', 'common']);
  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<TemplateContext | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<string | null>(null);

  const { data: contexts, isLoading, isFetching, error, refetch } = useTemplateContexts(organizationId, templateId);

  const mutations = useTemplateContextMutations(organizationId, templateId, {
    created: t('templateTab.toast.created'),
    updated: t('templateTab.toast.updated'),
    deleted: t('templateTab.toast.deleted'),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: templateContextQueryKeys.listBase() });
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCreateDialog = () => {
    setEditingContext(null);
    setDialogOpen(true);
  };

  const openEditDialog = (context: TemplateContext) => {
    setEditingContext(context);
    setDialogOpen(true);
  };

  const handleSubmit = (values: { name: string; content: string }) => {
    if (editingContext) {
      mutations.update.mutate(
        { contextId: editingContext.id, body: values },
        { onSuccess: () => { setDialogOpen(false); setEditingContext(null); } },
      );
    } else {
      mutations.create.mutate(values, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (contextId: string) => {
    setContextToDelete(contextId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (contextToDelete) {
      await mutations.delete.mutateAsync(contextToDelete);
      setContextToDelete(null);
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
            {canManage && (
              <HuemulButton
                size="sm"
                icon={Plus}
                iconClassName="w-3 h-3 mr-1"
                label={t('templateTab.addButton')}
                onClick={openCreateDialog}
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
            <Users className="h-4 w-4 text-[#4464f7]" />
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {t('templateTab.count', { count: contexts?.length || 0 })}
            </Badge>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">{t('loading')}</span>
              </div>
            ) : !contexts || contexts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('templateTab.empty')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('templateTab.emptyHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contexts.map((ctx) => (
                  <div key={ctx.id} className="border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between p-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-900">{ctx.name}</span>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <HuemulButton
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(ctx)}
                            className="h-7 w-7 p-0 text-[#4464f7] hover:text-white hover:bg-[#4464f7] hover:cursor-pointer"
                            icon={Pencil}
                            iconClassName="h-3 w-3"
                            title={t('templateTab.editTitle')}
                          />
                          <HuemulButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(ctx.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                            icon={Trash2}
                            iconClassName="h-3 w-3"
                            title={t('templateTab.deleteTitle')}
                          />
                        </div>
                      )}
                    </div>
                    <ContextDisplay
                      item={{ id: ctx.id, name: ctx.name, content: ctx.content || t('noContentAvailable') }}
                      hideHeader
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TemplateContextDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={editingContext ? 'edit' : 'create'}
        initialValue={editingContext ? { name: editingContext.name, content: editingContext.content } : null}
        onSubmit={handleSubmit}
        isProcessing={mutations.create.isPending || mutations.update.isPending}
      />

      <HuemulAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('templateTab.deleteDialog.title')}
        description={t('templateTab.deleteDialog.description')}
        actionLabel={t('common:delete')}
        onAction={confirmDelete}
        actionVariant="destructive"
        actionIcon={Trash2}
      />
    </div>
  );
}
