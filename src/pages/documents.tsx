import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonitorUp } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDocument, getAllDocuments } from "@/services/documents";
import Document from "@/components/document";
import { getAllTemplates } from "@/services/templates";

export default function Documents() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data: documents,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: getAllDocuments,
  });

  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: getAllTemplates,
  });

  const mutation = useMutation({
    mutationFn: (newDocument: {
      name: string;
      description?: string;
      template_id?: string | null;
    }) => createDocument(newDocument),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate(`/document/${created.id}`);
      setName("");
      setDescription("");
      setTemplateId(null);
      setError(null);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message || "Ocurrió un error al crear el documento");
    },
  });

  const handleAccept = () => {
    if (!name.trim()) return;
    setError(null);
    mutation.mutate({ name, description, template_id: templateId });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (queryError) {
    return <div>Error: {(queryError as Error).message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            aria-label="Importar documento"
            className="hover:cursor-pointer"
            title="Importar documento"
            onClick={() => {
              // TODO: Implementar funcionalidad de importar
              console.log("Importar documento");
            }}
          >
            <MonitorUp className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                aria-label="Agregar documento"
                className="hover:cursor-pointer"
                title="Agregar documento"
              >
                +
              </Button>
            </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Document</DialogTitle>
              <DialogDescription>
                Complete the fields below to create a new document.
              </DialogDescription>
            </DialogHeader>

            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full border rounded px-2 py-1"
            />

            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (opcional)"
              className="w-full border rounded px-2 py-1 mt-2"
            />

            <Select
              onValueChange={(value) =>
                setTemplateId(value === "null" ? null : value)
              }
              value={templateId || "null"}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Seleccionar template (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No template</SelectItem>
                {templates?.map((template: any) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2">
                {error}
              </div>
            )}

            <DialogFooter className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setName("");
                  setDescription("");
                  setTemplateId(null);
                  setError(null);
                  setIsDialogOpen(false);
                }}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={mutation.isPending}
                className="hover:cursor-pointer"
              >
                {mutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      <ul className="space-y-4">
        {documents?.map((doc: any) => {
          return <Document key={doc.id} doc={doc} />;
        })}
      </ul>
    </div>
  );
}