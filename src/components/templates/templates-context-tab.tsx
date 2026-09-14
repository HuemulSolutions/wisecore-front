import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Plus, Trash2, MessageSquareText } from "lucide-react";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { TemplateSettingsPanelHeader } from "./templates-settings-panel-header";
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
  /** Chevron a la izquierda del título — vuelve a la lista de grupos de "Configuración". */
  onBack?: () => void;
}

// Contexto de texto a nivel de template (tab del detalle de template). Se
// copia a cada documento creado desde este template — copia one-shot, sin
// sincronización posterior. A diferencia del contexto de documento no hay
// variante de archivo, así que no hay botón "Archivo" ni badge de tipo.
export function TemplateContextTab({ templateId, organizationId, canManage = false, onBack }: TemplateContextTabProps) {
  const { t } = useTranslation(['context', 'common', 'templates']);
  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<TemplateContext | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<string | null>(null);

  const { data: contexts, isLoading, isFetching, error, refetch } = useTemplateContexts(organizationId, templateId);
  const missingRequiredCount = contexts?.filter((ctx) => ctx.required && !ctx.content?.trim()).length ?? 0;

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

  const handleSubmit = (values: { name: string; content?: string; required: boolean }) => {
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-8">
      <TemplateSettingsPanelHeader
        className="shrink-0 pb-4 pt-1"
        titleWrapClassName="max-w-[620px]"
        onBack={onBack}
        icon={MessageSquareText}
        title={t('templateTab.title')}
        subtitle={t('templateTab.description')}
        refresh={{ onClick: handleRefresh, loading: isRefreshing || isFetching }}
        primaryAction={canManage ? { icon: Plus, label: t('templateTab.addButton'), onClick: openCreateDialog } : undefined}
      />

      {missingRequiredCount > 0 && (
        <div className="mb-3 flex shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">{t('requiredBanner', { count: missingRequiredCount })}</p>
        </div>
      )}

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">{t('loading')}</span>
          </div>
        ) : !contexts || contexts.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-[10px] border border-dashed border-[#d7dde5] p-7 text-center">
            <p className="text-sm font-semibold text-[#475569]">{t('templateTab.empty')}</p>
            <p className="text-[13px] text-[#64748b]">{t('templateTab.emptyHint')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {contexts.map((ctx) => {
              const isMissingRequired = ctx.required && !ctx.content?.trim();
              const metadata = [
                ctx.required ? (isMissingRequired ? t('pendingContentBadge') : t('requiredBadge')) : t('optionalBadge'),
                ctx.content?.trim() ? t('metaHasContent') : t('metaNoContent'),
              ].join(' · ');

              return (
                <div
                  key={ctx.id}
                  role={canManage ? "button" : undefined}
                  tabIndex={canManage ? 0 : undefined}
                  onClick={canManage ? () => openEditDialog(ctx) : undefined}
                  className={`flex items-center gap-3 rounded-[10px] border px-3.5 py-3 transition-colors ${
                    isMissingRequired ? 'border-amber-300 bg-amber-50/40' : 'border-[#eef1f5] bg-white'
                  } ${canManage ? 'hover:cursor-pointer hover:border-[#d7dde5]' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#0f172a]">{ctx.name}</p>
                    <p className="text-xs text-[#64748b]">{metadata}</p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(ctx.id); }}
                      className="shrink-0 text-xs text-[#b91c1c] hover:cursor-pointer hover:underline"
                    >
                      {t('removeAction')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TemplateContextDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={editingContext ? 'edit' : 'create'}
        initialValue={editingContext ? { name: editingContext.name, content: editingContext.content, required: editingContext.required } : null}
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
