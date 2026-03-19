import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Upload,
  Type,
  File,
} from "lucide-react";
import { HuemulField } from "@/huemul/components/huemul-field";
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

  const { t } = useTranslation('context')
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
      toast.success(t('addDialog.toastTextAdded'));
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
      toast.success(t('addDialog.toastDocumentAdded'));
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["contexts", documentId] });
      closeDialog();
    },
  });

  const handleAddText = async () => {
    if (!contextName.trim() || !context.trim()) {
      toast.error(t('addDialog.validationFillFields'));
      return;
    }
    addTextMutation.mutate({ name: contextName, content: context });
  };

  const handleAddDocument = async () => {
    if (!uploadedFile) {
      toast.error(t('addDialog.validationSelectFile'));
      return;
    }
    addDocumentMutation.mutate({ file: uploadedFile });
  };

  const handleFileChange = (files: FileList | null) => {
    setUploadedFile(files?.[0] ?? null);
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
      title={t('addDialog.title')}
      description={t('addDialog.description')}
      icon={Plus}
      maxWidth="sm:max-w-2xl"
      showFooter={true}
      showCancelButton={true}
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: activeTab === "text" ? t('addDialog.addTextButton') : t('addDialog.addDocumentButton'),
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
            {t('addDialog.tabText')}
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2 hover:cursor-pointer">
            <File className="h-4 w-4" />
            {t('addDialog.tabDocument')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="space-y-3">
            <HuemulField
              type="text"
              label={t('addDialog.contextName')}
              id="dialog-text-name"
              placeholder={t('addDialog.contextNamePlaceholder')}
              value={contextName}
              onChange={(val) => setContextName(String(val))}
              disabled={addTextMutation.isPending}
              required
            />

            <HuemulField
              type="textarea"
              label={t('addDialog.contextContent')}
              id="dialog-text-content"
              placeholder={t('addDialog.contextContentPlaceholder')}
              rows={10}
              value={context}
              onChange={(val) => setContext(String(val))}
              disabled={addTextMutation.isPending}
              required
            />
          </div>
        </TabsContent>

        <TabsContent value="document" className="space-y-4">
          <div className="space-y-3">
            <HuemulField
              type="file"
              label={t('addDialog.selectDocument')}
              id="dialog-document-file"
              accept=".txt,.md,.pdf,.doc,.docx"
              disabled={addDocumentMutation.isPending}
              onFileChange={handleFileChange}
              required
            />
          </div>
        </TabsContent>
      </Tabs>
    </HuemulDialog>
  );
}
