import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import type { EditContextDialogProps } from '@/types/context';

export type { EditContextDialogProps } from '@/types/context';

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
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (context && open) {
      setName(context.name);
      setContent(context.content ?? "");
      setRequired(!!context.required);
    }
  }, [context, open]);

  const handleConfirm = () => {
    if (!context || !name.trim() || (!required && !content.trim())) return;
    onConfirm(context.id, { name: name.trim(), content: content.trim() || undefined, required });
  };

  const isSaveDisabled = !name.trim() || (!required && !content.trim());

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
          type="switch"
          label={t('editDialog.required')}
          id="edit-required"
          value={required}
          onChange={(val) => setRequired(Boolean(val))}
          description={t('editDialog.requiredDescription')}
          disabled={isProcessing}
          labelFirst
          className="px-4 py-3.5 border rounded-[10px]"
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
