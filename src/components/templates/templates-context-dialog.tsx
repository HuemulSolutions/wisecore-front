import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Type } from "lucide-react";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";

export interface TemplateContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialValue?: { name: string; content: string | null; required: boolean } | null;
  onSubmit: (values: { name: string; content?: string; required: boolean }) => void;
  isProcessing?: boolean;
}

// Dialog presentacional create+edit para contexto de template. No hace su
// propia mutación (a diferencia de AddContextDialog, que llama directo a
// /context/{documentId}/add_text) — el tab de template decide qué endpoint
// pegar y muestra el toast. Siempre manda { name, required } con .trim() en
// name; content se omite si required=true y quedó vacío (placeholder), así
// nunca dispara el 422 de "PATCH sin campos" (name/required siempre van).
export function TemplateContextDialog({
  open,
  onOpenChange,
  mode,
  initialValue,
  onSubmit,
  isProcessing = false,
}: TemplateContextDialogProps) {
  const { t } = useTranslation('context');
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialValue?.name ?? "");
    setContent(initialValue?.content ?? "");
    setRequired(initialValue?.required ?? false);
  }, [open, initialValue]);

  const resetAndClose = useCallback((next: boolean) => {
    if (!next) {
      setName("");
      setContent("");
      setRequired(false);
    }
    onOpenChange(next);
  }, [onOpenChange]);

  const isValid = !!name.trim() && (required || !!content.trim());

  const handleConfirm = () => {
    if (!isValid) return;
    onSubmit({ name: name.trim(), content: content.trim() || undefined, required });
  };

  const isCreate = mode === 'create';

  return (
    <HuemulDialog
      open={open}
      onOpenChange={resetAndClose}
      title={isCreate ? t('templateTab.createDialog.title') : t('templateTab.editDialog.title')}
      description={isCreate ? t('templateTab.createDialog.description') : t('templateTab.editDialog.description')}
      icon={isCreate ? Type : Pencil}
      maxWidth="sm:max-w-2xl"
      showFooter={true}
      showCancelButton={true}
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: isCreate ? t('templateTab.createDialog.submit') : t('templateTab.editDialog.submit'),
        onClick: handleConfirm,
        disabled: !isValid || isProcessing,
        loading: isProcessing,
        icon: isCreate ? Plus : undefined,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-3">
        <HuemulField
          type="text"
          label={t('templateTab.fields.name')}
          id="template-context-name"
          placeholder={t('templateTab.fields.namePlaceholder')}
          value={name}
          onChange={(val) => setName(String(val))}
          disabled={isProcessing}
          required
        />
        <HuemulField
          type="switch"
          label={t('templateTab.fields.required')}
          id="template-context-required"
          value={required}
          onChange={(val) => setRequired(Boolean(val))}
          description={t('templateTab.fields.requiredDescription')}
          disabled={isProcessing}
          labelFirst
          className="px-4 py-3.5 border rounded-[10px]"
        />
        <HuemulField
          type="textarea"
          label={t('templateTab.fields.content')}
          id="template-context-content"
          placeholder={t('templateTab.fields.contentPlaceholder')}
          rows={10}
          value={content}
          onChange={(val) => setContent(String(val))}
          disabled={isProcessing}
          required={!required}
        />
      </div>
    </HuemulDialog>
  );
}
