import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  FileText, 
  Plus, 
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
import { getContext, deleteContext, editTextContext } from "@/services/context";
import { ContextDisplay } from "./context-content";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";

interface AddContextSheetProps {
  id: string;
  isSheetOpen?: boolean;
}

export default function AddContext({ id, isSheetOpen = true }: AddContextSheetProps) {
  const { t } = useTranslation('context')
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contextToEdit, setContextToEdit] = useState<{ id: string; name: string; content: string; context_type?: string } | null>(null);
  
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  // Get document contexts
  const { data: contexts, isLoading, error } = useQuery({
    queryKey: ['contexts', id],
    queryFn: () => getContext(id, selectedOrganizationId!),
    enabled: !!id && !!selectedOrganizationId && isSheetOpen
  });

  // Mutation to delete context
  const deleteContextMutation = useMutation({
    mutationFn: (contextId: string) => deleteContext(contextId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success(t('toast.contextDeleted'));
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
      setContextToDelete(null);
    }
  });

  // Mutation to edit context
  const editTextContextMutation = useMutation({
    mutationFn: ({ contextId, name, content }: { contextId: string; name: string; content: string }) =>
      editTextContext(contextId, name, content, selectedOrganizationId!),
    onSuccess: () => {
      toast.success(t('toast.contextUpdated'));
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
      setEditDialogOpen(false);
      setContextToEdit(null);
    }
  });

  const handleDeleteContext = (contextId: string) => {
    setContextToDelete(contextId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteContext = async () => {
    if (contextToDelete) {
      await deleteContextMutation.mutateAsync(contextToDelete);
    }
  };

  const handleEditContext = (ctx: { id: string; name: string; content: string; context_type?: string }) => {
    setContextToEdit(ctx);
    setEditDialogOpen(true);
  };

  const confirmEditContext = (contextId: string, name: string, content: string) => {
    editTextContextMutation.mutate({ contextId, name, content });
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
            <HuemulButton
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#4464f7] hover:bg-[#3451e6] text-xs"
              icon={Plus}
              iconClassName="h-3.5 w-3.5 mr-1.5"
              label={t('addContext')}
            />
          </div>

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
                {contexts.map((ctx: any) => (
                  <div key={ctx.id} className="border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
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
                        <div className="flex items-center gap-2">
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
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <HuemulButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditContext({ id: ctx.id, name: ctx.name, content: ctx.content || '', context_type: ctx.context_type })}
                          disabled={editTextContextMutation.isPending}
                          className="h-7 w-7 p-0 text-[#4464f7] hover:text-white hover:bg-[#4464f7]"
                          icon={Pencil}
                          iconClassName="h-3 w-3"
                          title={t('editContextTitle')}
                        />
                        <HuemulButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteContext(ctx.id)}
                          disabled={deleteContextMutation.isPending}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          icon={Trash2}
                          iconClassName="h-3 w-3"
                          title={t('deleteContextTitle')}
                        />
                      </div>
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
                ))}
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