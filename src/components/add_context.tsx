import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getContext, addTextContext, addDocumentContext, deleteContext } from "@/services/context";
import { ContextDisplay } from "./context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AddContext({ id }: { id: string }) {
  const [context, setContext] = useState("");
  const [contextName, setContextName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const queryClient = useQueryClient();

  // Obtener la lista de contextos del documento
  const { data: contexts, isLoading, error } = useQuery({
    queryKey: ['contexts', id],
    queryFn: () => getContext(id),
    enabled: !!id
  });

  // Mutación para añadir contexto de texto
  const addTextMutation = useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) => 
      addTextContext(id, name, content),
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

  // Mutación para añadir contexto de documento
  const addDocumentMutation = useMutation({
    mutationFn: (file: File) => addDocumentContext(id, file),
    onSuccess: () => {
      toast.success("Document context added successfully");
      setUploadedFile(null);
      const fileInput = document.getElementById("file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
    },
    onError: (error: Error) => {
      toast.error("Error adding document context: " + error.message);
    }
  });

  // Mutación para eliminar contexto
  const deleteContextMutation = useMutation({
    mutationFn: (contextId: string) => deleteContext(id, contextId),
    onSuccess: () => {
      toast.success("Context deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['contexts', id] });
    },
    onError: (error: Error) => {
      toast.error("Error deleting context: " + error.message);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleAddTextContext = () => {
    if (!contextName.trim() || !context.trim()) {
      toast.error("Please fill in both name and content fields");
      return;
    }
    addTextMutation.mutate({ name: contextName, content: context });
  };

  const handleAddDocumentContext = () => {
    if (!uploadedFile) {
      toast.error("Please select a file first");
      return;
    }
    addDocumentMutation.mutate(uploadedFile);
  };

  const handleDeleteContext = (contextId: string) => {
    deleteContextMutation.mutate(contextId);
  };

  return (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Context
          </CardTitle>
          <CardDescription>
            Add context information via text or document upload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text Context</TabsTrigger>
              <TabsTrigger value="document">Upload Document</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="space-y-2">
              <Label htmlFor="context">Name</Label>
              <Input
                id="context"
                placeholder="Enter context name..."
                value={contextName}
                onChange={(e) => setContextName(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="context">Content</Label>
              <Textarea
                id="context"
                placeholder="Enter additional context for this document..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={6}
              />
              <Button
                type="button"
                className="w-full hover:cursor-pointer"
                onClick={handleAddTextContext}
                disabled={addTextMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addTextMutation.isPending ? "Adding..." : "Add Context"}
              </Button>
            </TabsContent>
            <TabsContent value="document" className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hover:cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hover:cursor-pointer"
                  onClick={() => document.getElementById("file")?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {uploadedFile && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{uploadedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:cursor-pointer"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                type="button"
                className="w-full hover:cursor-pointer"
                onClick={handleAddDocumentContext}
                disabled={addDocumentMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addDocumentMutation.isPending ? "Adding..." : "Add Context"}
              </Button>
            </TabsContent>
          </Tabs>
          
          {/* Lista de contextos existentes */}
          <div className="border-t pt-4">
            {isLoading && (
              <p>Cargando contextos...</p>
            )}

            {error && (
              <p className="text-red-500">Error al cargar contextos: {error.message}</p>
            )}

            {contexts && contexts.length > 0 && (
              <div className="space-y-4">
                {contexts.map((contextItem: any, index: number) => (
                  <ContextDisplay 
                    key={index} 
                    item={contextItem} 
                    onDelete={handleDeleteContext}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
  );
}
