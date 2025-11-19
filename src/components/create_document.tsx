import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createDocument } from "@/services/documents";
import { getAllTemplates } from "@/services/templates";
import { getAllDocumentTypes } from "@/services/document_type";
import CreateDocumentType from "./create_doc_type";
import { useOrganization } from "@/contexts/organization-context";

interface CreateDocumentProps {
  trigger: React.ReactNode;
}

export default function CreateDocument({ trigger }: CreateDocumentProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedOrganizationId } = useOrganization();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null); // optional
  const [documentTypeId, setDocumentTypeId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const { data: templates } = useQuery({
    queryKey: ["templates", selectedOrganizationId],
    queryFn: () => getAllTemplates(selectedOrganizationId!), // Fetch all templates
    enabled: !!selectedOrganizationId, // Only run this query if an organization is selected
  });

  const { data: fetchedDocumentTypes } = useQuery({
    queryKey: ["documentTypes", selectedOrganizationId],
    queryFn: () => getAllDocumentTypes(selectedOrganizationId!),
    enabled: !!selectedOrganizationId,
  });

  const mutation = useMutation({
    mutationFn: (newDocument: {
      name: string;
      description?: string;
      template_id?: string | null;
      document_type_id?: string;
    }) => createDocument(newDocument, selectedOrganizationId!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate(`/document/${created.id}`);
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message || "An error occurred while creating the document");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setTemplateId(null);
    setDocumentTypeId(undefined);
    setError(null);
  };

  const handleAccept = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    mutation.mutate({
      name,
      description,
      template_id: templateId,
      document_type_id: documentTypeId,
    });
  };

  const handleCancel = () => {
    resetForm();
    setIsDialogOpen(false);
  };

  const handleCreateDocumentType = (newDocumentType: { id: string; name: string; color: string }) => {
    // When a document type is created via API, it will have a real ID
    // We can directly set it as the selected document type
    setDocumentTypeId(newDocumentType.id);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
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
          placeholder="Description (optional)"
          className="w-full border rounded px-2 py-1 mt-2"
        />

        <Select
          onValueChange={(value) =>
            setTemplateId(value === "null" ? null : value)
          }
          value={templateId || "null"}
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select template (optional)" />
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

        <div className="space-y-2 mt-2">
          <label className="text-sm font-medium">Document Type</label>
          <Select
            value={documentTypeId}
            onValueChange={(value) => setDocumentTypeId(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {/* Display existing document types from API */}
              {fetchedDocumentTypes?.map((type: any) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: type.color }}
                    />
                    <span>{type.name}</span>
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1">
                <CreateDocumentType 
                  trigger={
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-blue-600 hover:text-blue-700 hover:cursor-pointer"
                    >
                      + Create new document type
                    </Button>
                  }
                  onDocumentTypeCreated={handleCreateDocumentType}
                />
              </div>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2">
            {error}
          </div>
        )}

        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="hover:cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={mutation.isPending || !name.trim() || !selectedOrganizationId}
            className="hover:cursor-pointer"
          >
            {mutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
