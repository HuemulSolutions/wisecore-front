import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Type } from "lucide-react";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { addTextContext } from "@/services/context";
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

  const { t } = useTranslation('context')
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  const closeDialog = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const resetForm = useCallback(() => {
    setContext("");
    setContextName("");
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

  const handleAddText = async () => {
    if (!contextName.trim() || !context.trim()) {
      toast.error(t('addDialog.validationFillFields'));
      return;
    }
    addTextMutation.mutate({ name: contextName, content: context });
  };

  return (
    <HuemulDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('addDialog.title')}
      description={t('addDialog.description')}
      icon={Type}
      maxWidth="sm:max-w-2xl"
      showFooter={true}
      showCancelButton={true}
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: t('addDialog.addTextButton'),
        onClick: handleAddText,
        disabled: !contextName.trim() || !context.trim() || addTextMutation.isPending,
        loading: addTextMutation.isPending,
        icon: Plus,
        closeOnSuccess: false,
      }}
    >
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
    </HuemulDialog>
  );
}
