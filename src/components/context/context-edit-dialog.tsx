import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";


interface ContextItem {
  id: string;
  name: string;
  content: string;
  context_type?: string;
}

interface EditContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ContextItem | null;
  onConfirm: (id: string, name: string, content: string) => void;
  isProcessing: boolean;
}

export function EditContextDialog({
  open,
  onOpenChange,
  context,
  onConfirm,
  isProcessing,
}: EditContextDialogProps) {
  const { t } = useTranslation('context')
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (context && open) {
      setName(context.name);
      setContent(context.content);
    }
  }, [context, open]);

  const handleConfirm = () => {
    if (!context || !name.trim() || !content.trim()) return;
    onConfirm(context.id, name.trim(), content.trim());
  };

  const isSaveDisabled = !name.trim() || !content.trim();

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('editDialog.title')}
      description={t('editDialog.description')}
      icon={Pencil}
      maxWidth="sm:max-w-2xl"
      showFooter={true}
      showCancelButton={true}
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: t('editDialog.saveChanges'),
        onClick: handleConfirm,
        disabled: isSaveDisabled,
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-4">
        <HuemulField
          type="text"
          label={t('editDialog.contextName')}
          id="edit-name"
          placeholder={t('editDialog.contextNamePlaceholder')}
          value={name}
          onChange={(val) => setName(String(val))}
          disabled={isProcessing}
        />
        <HuemulField
          type="textarea"
          label={t('editDialog.contextContent')}
          id="edit-content"
          placeholder={t('editDialog.contextContentPlaceholder')}
          rows={12}
          value={content}
          onChange={(val) => setContent(String(val))}
          disabled={isProcessing}
        />
      </div>
    </HuemulDialog>
  );
}
