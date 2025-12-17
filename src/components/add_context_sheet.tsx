import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Plus, 
  Upload, 
  X, 
  Trash2,
  Users,
  File,
  Type,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getContext, addTextContext, addDocumentContext, deleteContext } from "@/services/context";
import { ContextDisplay } from "./context";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";

export default function AddContextSheet({ id }: { id: string }) {
  const [context, setContext] = useState("");
  const [contextName, setContextName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("text");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  // Get document contexts
  const { data: contexts, isLoading, error } = useQuery({
    queryKey: ['contexts', id],
    queryFn: () => getContext(id, selectedOrganizationId!),
    enabled: !!id && !!selectedOrganizationId
  });

  // Mutation to add text context
  const addTextMutation = useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) => 
      addTextContext(id, name, content, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Text context added successfully");
      setContext("");
      setContextName("");
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
    },
    onError: (error: Error) => {
      toast.error("Error adding text context: " + error.message);
    }
  });

  // Mutation to add document context
  const addDocumentMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => 
      addDocumentContext(id, file, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Document context added successfully");
      setUploadedFile(null);
      setContextName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
    },
    onError: (error: Error) => {
      toast.error("Error adding document context: " + error.message);
    }
  });

  // Mutation to delete context
  const deleteContextMutation = useMutation({
    mutationFn: (contextId: string) => deleteContext(contextId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Context deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
      setDeleteDialogOpen(false);
      setContextToDelete(null);
    },
    onError: (error: Error) => {
      toast.error("Error deleting context: " + error.message);
    }
  });

  const handleAddText = () => {
    if (!contextName.trim() || !context.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    addTextMutation.mutate({ name: contextName, content: context });
  };

  const handleAddDocument = () => {
    if (!uploadedFile) {
      toast.error("Please select a file");
      return;
    }
    addDocumentMutation.mutate({ file: uploadedFile });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteContext = (contextId: string) => {
    setContextToDelete(contextId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteContext = () => {
    if (contextToDelete) {
      deleteContextMutation.mutate(contextToDelete);
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
        {/* Add New Context Section */}
        <div className="border rounded-lg bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#4464f7]" />
              <h3 className="text-sm font-medium text-gray-900">Add New Context</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Context
                </TabsTrigger>
                <TabsTrigger value="document" className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Document Context
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="text-name" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Context Name
                    </Label>
                    <Input
                      id="text-name"
                      placeholder="Enter context name"
                      value={contextName}
                      onChange={(e) => setContextName(e.target.value)}
                      disabled={addTextMutation.isPending}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="text-content" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Context Content
                    </Label>
                    <Textarea
                      id="text-content"
                      placeholder="Enter context content"
                      rows={4}
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      disabled={addTextMutation.isPending}
                    />
                  </div>
                  
                  <Button
                    onClick={handleAddText}
                    disabled={!contextName.trim() || !context.trim() || addTextMutation.isPending}
                    className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                  >
                    {addTextMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Text Context
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="document" className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Select Document
                    </Label>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      disabled={addDocumentMutation.isPending}
                      accept=".txt,.md,.pdf,.doc,.docx"
                      className="hidden"
                    />
                    
                    {/* File selector UI */}
                    {!uploadedFile ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFileInputClick}
                        disabled={addDocumentMutation.isPending}
                        className="w-full h-10 justify-start text-left font-normal hover:cursor-pointer border-dashed border-2"
                      >
                        <Upload className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-500">Choose a document file...</span>
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        {/* Selected file display */}
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-blue-900">{uploadedFile.name}</span>
                              <span className="text-xs text-blue-600">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleFileInputClick}
                              disabled={addDocumentMutation.isPending}
                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 hover:cursor-pointer"
                              title="Change file"
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleClearFile}
                              disabled={addDocumentMutation.isPending}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleAddDocument}
                    disabled={!uploadedFile || addDocumentMutation.isPending}
                    className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                  >
                    {addDocumentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Add Document Context
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

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
                          {ctx.type === 'text' ? (
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
                              ctx.type === 'text' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {ctx.type === 'text' ? 'Text' : 'Document'}
                          </Badge>
                        </div>
                      </div>
                      
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Context</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this context? This action cannot be undone and may affect document execution.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteContext}
              disabled={deleteContextMutation.isPending}
              className="bg-red-600 hover:bg-red-700 hover:cursor-pointer"
            >
              {deleteContextMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}