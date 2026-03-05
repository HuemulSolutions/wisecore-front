import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Upload,
  X,
  Type,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { addTextContext, addDocumentContext } from "@/services/context";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";

interface AddContextDialogProps {
  /** Document ID to add context to */
  documentId: string;
  /** Controlled open state */
  open: boolean;
  /** Called when the dialog requests to open or close */
  onOpenChange: (open: boolean) => void;
}

export function AddContextDialog({
  documentId,
  open,
  onOpenChange,
}: AddContextDialogProps) {
  const [context, setContext] = useState("");
  const [contextName, setContextName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("text");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  const closeDialog = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const resetForm = useCallback(() => {
    setContext("");
    setContextName("");
    setUploadedFile(null);
    setActiveTab("text");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Reset form when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetForm();
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, resetForm],
  );

  // Mutation to add text context
  const addTextMutation = useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      addTextContext(documentId, name, content, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Text context added successfully");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["contexts", documentId] });
      closeDialog();
    },
  });

  // Mutation to add document context
  const addDocumentMutation = useMutation({
    mutationFn: ({ file }: { file: File }) =>
      addDocumentContext(documentId, file, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Document context added successfully");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["contexts", documentId] });
      closeDialog();
    },
  });

  const handleAddText = async () => {
    if (!contextName.trim() || !context.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    addTextMutation.mutate({ name: contextName, content: context });
  };

  const handleAddDocument = async () => {
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
      fileInputRef.current.value = "";
    }
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const isPending = addTextMutation.isPending || addDocumentMutation.isPending;

  const isSaveDisabled =
    activeTab === "text"
      ? !contextName.trim() || !context.trim() || addTextMutation.isPending
      : !uploadedFile || addDocumentMutation.isPending;

  return (
    <HuemulDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Add New Context"
      description="Add text or document context to provide additional information for document execution."
      icon={Plus}
      maxWidth="sm:max-w-lg"
      showFooter={true}
      showCancelButton={true}
      cancelLabel="Cancel"
      saveAction={{
        label: activeTab === "text" ? "Add Text Context" : "Add Document Context",
        onClick: activeTab === "text" ? handleAddText : handleAddDocument,
        disabled: isSaveDisabled,
        loading: isPending,
        icon: activeTab === "text" ? Plus : Upload,
        closeOnSuccess: false,
      }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-2 hover:cursor-pointer">
            <Type className="h-4 w-4" />
            Text Context
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2 hover:cursor-pointer">
            <File className="h-4 w-4" />
            Document Context
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label
                htmlFor="dialog-text-name"
                className="text-xs font-medium text-gray-600 uppercase tracking-wide"
              >
                Context Name
              </Label>
              <Input
                id="dialog-text-name"
                placeholder="Enter context name"
                value={contextName}
                onChange={(e) => setContextName(e.target.value)}
                disabled={addTextMutation.isPending}
              />
            </div>

            <div>
              <Label
                htmlFor="dialog-text-content"
                className="text-xs font-medium text-gray-600 uppercase tracking-wide"
              >
                Context Content
              </Label>
              <Textarea
                id="dialog-text-content"
                placeholder="Enter context content"
                rows={4}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={addTextMutation.isPending}
              />
            </div>
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
                        <span className="text-sm font-medium text-blue-900">
                          {uploadedFile.name}
                        </span>
                        <span className="text-xs text-blue-600">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </span>
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
          </div>
        </TabsContent>
      </Tabs>
    </HuemulDialog>
  );
}
