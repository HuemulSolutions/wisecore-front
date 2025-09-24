import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDocument } from "@/services/documents";
import { getAllDocumentTypes } from "@/services/document_type";
import { getAllTemplates } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import CreateDocumentType from "../create_doc_type";
import { AlertCircle } from "lucide-react";

interface CreateDocumentLibProps {
  trigger: React.ReactNode;
  folderId?: string;
  onDocumentCreated?: (createdDocument: { id: string; name: string; type: "document" }) => void;
}

export default function CreateDocumentLib({ trigger, folderId, onDocumentCreated }: CreateDocumentLibProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [documentTypeId, setDocumentTypeId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedOrganizationId } = useOrganization();

  const { data: fetchedDocumentTypes } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: () => getAllDocumentTypes(selectedOrganizationId!),
    enabled: !!selectedOrganizationId,
  });

  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: () => getAllTemplates(selectedOrganizationId!), // Fetch templates for the selected organization
    enabled: !!selectedOrganizationId, // Only run this query if an organization is selected
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim()) {
      setError("Document name is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    if (!documentTypeId) {
      setError("Asset type is required");
      return;
    }

    if (!selectedOrganizationId) {
      setError("No organization selected");
      return;
    }

    setIsLoading(true);
    
    try {
      const documentData = {
        name: name.trim(),
        description: description.trim() || undefined,
        folder_id: folderId,
        template_id: templateId,
        document_type_id: documentTypeId
      };

      const createdDocument = await createDocument(documentData, selectedOrganizationId);
      
      setOpen(false);
      setName("");
      setDescription("");
      setTemplateId(null);
      setDocumentTypeId(undefined);
      setError(null);
      
      // Notify parent component that a document was created
      if (onDocumentCreated && createdDocument) {
        onDocumentCreated({
          id: createdDocument.id,
          name: createdDocument.name,
          type: "document"
        });
      }
    } catch (error: any) {
      console.error("Error creating asset:", error);
      setError(error.message || "Error creating asset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setName("");
      setDescription("");
      setTemplateId(null);
      setDocumentTypeId(undefined);
      setError(null);
    }
  };

  const handleCreateDocumentType = (newDocumentType: { id: string; name: string; color: string }) => {
    // When a document type is created via API, it will have a real ID
    // We can directly set it as the selected document type
    setDocumentTypeId(newDocumentType.id);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Asset</DialogTitle>
            <DialogDescription>
              Create a new asset in the library.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Asset name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Asset description"
                required
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template">Template</Label>
              <Select
                onValueChange={(value) =>
                  setTemplateId(value === "null" ? null : value)
                }
                value={templateId || "null"}
              >
                <SelectTrigger className="w-full">
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="documentType">Asset Type *</Label>
              <Select
                value={documentTypeId}
                onValueChange={(value) => setDocumentTypeId(value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select asset type" />
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
                          + Create new asset type
                        </Button>
                      }
                      onDocumentTypeCreated={handleCreateDocumentType}
                    />
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="hover:cursor-pointer">
              {isLoading ? "Creating..." : "Create Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}