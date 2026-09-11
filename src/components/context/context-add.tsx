import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  FileText, 
  Upload,
  Trash2,
  Pencil,
  Users,
  Type,
  Loader2,
  AlertCircle
} from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Badge } from "@/components/ui/badge";
import { DeleteContextDialog } from "@/components/context/context-delete-dialog";
import { EditContextDialog } from "@/components/context/context-edit-dialog";
import { AddContextDialog } from "@/components/context/context-add-dialog";
import { getContext, deleteContext, editTextContext, addDocumentContext } from "@/services/context";
import { ContextDisplay } from "./context-content";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";
import type { AddContextSheetProps, ContextItem, EditTextContextBody } from '@/types/context';

export type { AddContextSheetProps } from '@/types/context';

// `canEdit` es secure-by-default (punto 9 del checklist): su único call-site
// (assets-context-sheet.tsx) ya lo pasa explícito desde el cruce lifecycle × RBAC.
export default function AddContext({ id, isSheetOpen = true, canEdit = false }: AddContextSheetProps) {
  const { t } = useTranslation('context')
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contextToEdit, setContextToEdit] = useState<ContextItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  // Get document contexts
  const { data: contexts, isLoading, error } = useQuery<ContextItem[]>({
    queryKey: ['contexts', id],
    queryFn: () => getContext(id, selectedOrganizationId!),
    enabled: !!id && !!selectedOrganizationId && isSheetOpen
  });

  const missingRequiredCount = contexts?.filter((ctx) => ctx.required && !ctx.content?.trim()).length ?? 0;

  // Mutation to delete context
  const deleteContextMutation = useMutation({
    mutationFn: (contextId: string) => deleteContext(contextId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success(t('toast.contextDeleted'));
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
      // can_generate depende de si queda al menos un contexto configurado.
      queryClient.invalidateQueries({ queryKey: ['document-content', id] });
      setContextToDelete(null);
    }
  });

  // Mutation to edit context
  const editTextContextMutation = useMutation({
    mutationFn: ({ contextId, body }: { contextId: string; body: EditTextContextBody }) =>
      editTextContext(contextId, body, selectedOrganizationId!),
    onSuccess: () => {
      toast.success(t('toast.contextUpdated'));
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', id] });
      setEditDialogOpen(false);
      setContextToEdit(null);
    }
  });

  // Mutation to add file context directly
  const addDocumentMutation = useMutation({
    mutationFn: ({ file }: { file: File }) =>
      addDocumentContext(id, file, selectedOrganizationId!),
    onSuccess: () => {
      toast.success(t('toast.fileContextAdded'));
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
      // can_generate (GET /documents/{id}/content) depende de si el activo
      // tiene contexto configurado — se recalcula solo al invalidar acá.
      queryClient.invalidateQueries({ queryKey: ['document-content', id] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addDocumentMutation.mutate({ file });
    }
  };

  const handleDeleteContext = (contextId: string) => {
    setContextToDelete(contextId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteContext = async () => {
    if (contextToDelete) {
      await deleteContextMutation.mutateAsync(contextToDelete);
    }
  };

  const handleEditContext = (ctx: ContextItem) => {
    setContextToEdit(ctx);
    setEditDialogOpen(true);
  };

  const confirmEditContext = (contextId: string, body: EditTextContextBody) => {
    editTextContextMutation.mutate({ contextId, body });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{t('errorLoading')}</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Existing Contexts Section */}
        <div className="border rounded-lg bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#4464f7]" />
              <h3 className="text-sm font-medium text-gray-900">{t('currentContexts')}</h3>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {t('contextsCount', { count: contexts?.length || 0 })}
              </Badge>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <HuemulButton
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                  checkGlobalPermissions={true}
                  resource="context"
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                  icon={Type}
                  iconClassName="h-3.5 w-3.5"
                  label={t('addTextContext')}
                  disabled={addDocumentMutation.isPending}
                />
                <HuemulButton
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                  checkGlobalPermissions={true}
                  resource="context"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={Upload}
                  iconClassName="h-3.5 w-3.5"
                  label={t('addFileContext')}
                  loading={addDocumentMutation.isPending}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx,.xlsx,.xlsm"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            )}
          </div>

          {/* Banner de resumen: contextos obligatorios sin contenido bloquean can_generate */}
          {missingRequiredCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">{t('requiredBanner', { count: missingRequiredCount })}</p>
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {!contexts || contexts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('noContexts')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('noContextsDescription')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contexts.map((ctx) => {
                  const isMissingRequired = !!ctx.required && !ctx.content?.trim();
                  return (
                  <div key={ctx.id} className={`border rounded-lg bg-white transition-colors ${isMissingRequired ? 'border-amber-300' : 'border-gray-200 hover:border-gray-300'}`}>
                    {/* Context Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {ctx.context_type === 'text' ? (
                            <Type className="h-4 w-4 text-gray-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{ctx.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              ctx.context_type === 'text'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {ctx.context_type === 'text' ? t('badgeText') : t('badgeDocument')}
                          </Badge>
                          {ctx.required && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${isMissingRequired ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                            >
                              {isMissingRequired ? t('pendingContentBadge') : t('requiredBadge')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <HuemulButton
                            requiredAccess="edit"
                            checkGlobalPermissions={true}
                            resource="context"
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditContext(ctx)}
                            disabled={editTextContextMutation.isPending}
                            className="h-7 w-7 p-0 text-[#4464f7] hover:text-white hover:bg-[#4464f7] hover:cursor-pointer"
                            icon={Pencil}
                            iconClassName="h-3 w-3"
                            title={t('editContextTitle')}
                          />
                          <HuemulButton
                            requiredAccess="delete"
                            checkGlobalPermissions={true}
                            resource="context"
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteContext(ctx.id)}
                            disabled={deleteContextMutation.isPending}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                            icon={Trash2}
                            iconClassName="h-3 w-3"
                            title={t('deleteContextTitle')}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Context Content */}
                    <div className="p-0">
                      <ContextDisplay 
                        item={{
                          id: ctx.id,
                          name: ctx.name,
                          content: ctx.content || t('noContentAvailable')
                        }}
                        hideHeader={true}
                      />
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddContextDialog
        documentId={id}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <DeleteContextDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteContext}
      />

      <EditContextDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        context={contextToEdit}
        onConfirm={confirmEditContext}
        isProcessing={editTextContextMutation.isPending}
      />
    </>
  );
}