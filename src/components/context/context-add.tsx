import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteContextDialog } from "@/components/context/context-delete-dialog";
import { EditContextDialog } from "@/components/context/context-edit-dialog";
import { AddContextDialog } from "@/components/context/context-add-dialog";
import { getContext, deleteContext, editTextContext, editFileContext } from "@/services/context";
import { ContextDisplay } from "./context-content";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";

interface AddContextSheetProps {
  id: string;
  isSheetOpen?: boolean;
}

export default function AddContext({ id, isSheetOpen = true }: AddContextSheetProps) {
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
      toast.success("Context deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
      setContextToDelete(null);
    }
  });

  // Mutation to edit text context
  const editTextContextMutation = useMutation({
    mutationFn: ({ contextId, name, content }: { contextId: string; name: string; content: string }) =>
      editTextContext(contextId, name, content, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Context updated successfully");
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
      setEditDialogOpen(false);
      setContextToEdit(null);
    }
  });

  // Mutation to edit file context
  const editFileContextMutation = useMutation({
    mutationFn: ({ contextId, file, name }: { contextId: string; file: File; name?: string }) =>
      editFileContext(contextId, file, selectedOrganizationId!, name),
    onSuccess: () => {
      toast.success("Context updated successfully");
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

  const confirmEditContext = (contextId: string, name: string, content: string, file?: File) => {
    if (file) {
      editFileContextMutation.mutate({ contextId, file, name });
    } else {
      editTextContextMutation.mutate({ contextId, name, content });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading contexts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Error loading contexts</span>
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
              <h3 className="text-sm font-medium text-gray-900">Current Contexts</h3>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {contexts?.length || 0} contexts
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Context
            </Button>
          </div>

          {/* Content */}
          <div className="p-4">
            {!contexts || contexts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No contexts configured</p>
                <p className="text-xs text-gray-400 mt-1">Add context to provide additional information and variables for document execution.</p>
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
                            {ctx.context_type === 'text' ? 'Text' : 'Document'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditContext({ id: ctx.id, name: ctx.name, content: ctx.content || '', context_type: ctx.context_type })}
                          disabled={editTextContextMutation.isPending || editFileContextMutation.isPending}
                          className="h-7 w-7 p-0 text-[#4464f7] hover:text-white hover:bg-[#4464f7] hover:cursor-pointer"
                          title="Edit Context"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteContext(ctx.id)}
                          disabled={deleteContextMutation.isPending}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                          title="Delete Context"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Context Content */}
                    <div className="p-0">
                      <ContextDisplay 
                        item={{
                          id: ctx.id,
                          name: ctx.name,
                          content: ctx.content || 'No content available'
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
        isProcessing={editTextContextMutation.isPending || editFileContextMutation.isPending}
      />
    </>
  );
}