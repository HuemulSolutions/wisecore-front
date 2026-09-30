import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContextItem } from "@/types/context";

export interface SourcesTextFormValues {
  name: string;
  content: string;
  required: boolean;
}

interface SourcesTextFormProps {
  /** Presente = edición de un texto existente; ausente = alta. */
  context?: ContextItem;
  isSaving?: boolean;
  onCancel: () => void;
  onSubmit: (values: SourcesTextFormValues) => void;
}

/**
 * Formulario inline de texto (alta y edición). Reglas de `context-add-dialog`: el contenido es
 * obligatorio salvo que la fuente se marque como obligatoria (queda como placeholder sin contenido).
 * El caller lo monta con `key` para reiniciar el estado al cambiar de fuente.
 */
export function SourcesTextForm({ context, isSaving = false, onCancel, onSubmit }: SourcesTextFormProps) {
  const { t } = useTranslation("sources");
  const isEditing = !!context;

  const [name, setName] = useState(context?.name ?? "");
  const [content, setContent] = useState(context?.content ?? "");
  const [required, setRequired] = useState(!!context?.required);
  const [showContentError, setShowContentError] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || isSaving) return;
    if (!required && !content.trim()) {
      setShowContentError(true);
      return;
    }
    onSubmit({ name: name.trim(), content: content.trim(), required });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={isEditing ? t("form.editTitle") : t("form.createTitle")}
      className="flex flex-col gap-2.5 rounded-[10px] p-3.5 ring-1 ring-inset ring-blue-200 shadow-[0_6px_18px_-12px_rgba(37,99,235,0.35)]"
    >
      <h3 className="text-[13px] font-semibold text-slate-900">
        {isEditing ? t("form.editTitle") : t("form.createTitle")}
      </h3>

      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t("form.namePlaceholder")}
        aria-label={t("form.namePlaceholder")}
        disabled={isSaving}
        autoFocus
        className="h-9"
      />

      <div className="flex flex-col gap-1">
        <Textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setShowContentError(false);
          }}
          rows={5}
          placeholder={t("form.contentPlaceholder")}
          aria-label={t("form.contentPlaceholder")}
          aria-invalid={showContentError || undefined}
          disabled={isSaving}
        />
        {showContentError && (
          <p role="alert" className="text-xs text-red-600">
            {t("form.contentRequired")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="sources-text-required"
          checked={required}
          onCheckedChange={(checked) => {
            setRequired(checked === true);
            setShowContentError(false);
          }}
          disabled={isSaving}
        />
        <label htmlFor="sources-text-required" className="text-[13px] text-slate-700">
          <span className="font-medium">{t("form.required")}</span>{" "}
          <span className="text-slate-400">{t("form.requiredHint")}</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hover:cursor-pointer"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t("form.cancel")}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!name.trim() || isSaving}
          className="bg-blue-600 text-white hover:cursor-pointer hover:bg-blue-700 disabled:bg-slate-400 disabled:opacity-100"
        >
          {t("form.save")}
        </Button>
      </div>
    </form>
  );
}
