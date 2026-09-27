import { Loader2, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulTintedFieldset } from "@/huemul/components/huemul-tinted-fieldset";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SectionPlateEditor from "@/components/plate-editor/section-plate-editor";
import { AiEditSectionDialog } from "@/components/assets/dialogs/assets-ai-edit-section-dialog";
import { SectionContextPicker } from "./section-context-picker";
import { SECTION_TYPE_META } from "./section-type-meta";
import type { SectionAiBlockProps } from "@/types/sections/blocks";
export type { SectionAiBlockProps } from "@/types/sections/blocks";

const AI_META = SECTION_TYPE_META.ai;

/** Bloque de configuración del tipo "Generada con IA" — prompt + contexto que puede leer. */
export function SectionAiBlock({
  editorType,
  editorKey,
  promptEditorRef,
  prompt,
  onPromptChange,
  isPending,
  isGenerating,
  canGeneratePrompt,
  onGeneratePrompt,
  canEditWithAi,
  isEditingWithAi,
  onOpenAiEdit,
  isAiEditOpen,
  onAiEditOpenChange,
  onSendAiEdit,
  promptBeforeAiEdit,
  onUndoAiEdit,
  organizationId,
  documentId,
  mediaUploadTarget,
  contextOptions,
  selectedContextIds,
  onContextChange,
}: SectionAiBlockProps) {
  const { t } = useTranslation(["sections", "templates"]);

  return (
    <HuemulTintedFieldset
      title={t("sections:form.blocks.aiTitle")}
      accent={AI_META.color}
      borderColor="#dbe6ff"
      background="#fbfcff"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-medium text-[#334155]">
            {t("sections:form.prompt.label")} <span className="text-red-500">*</span>
          </Label>
          <button
            type="button"
            onClick={onGeneratePrompt}
            disabled={!canGeneratePrompt || isGenerating || !!prompt.trim() || isPending}
            className="text-xs font-medium text-[#2563eb] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
          >
            {isGenerating ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("sections:form.prompt.generating")}
              </span>
            ) : (
              t("sections:form.prompt.generate")
            )}
          </button>
        </div>

        {promptBeforeAiEdit !== null && !isEditingWithAi && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="text-xs text-amber-800">{t("sections:form.prompt.aiEditApplied")}</span>
            <HuemulButton
              type="button"
              size="sm"
              variant="outline"
              onClick={onUndoAiEdit}
              disabled={isPending}
              className="h-7 text-xs"
              label={t("sections:form.prompt.undo")}
            />
          </div>
        )}

        {editorType === "simple" ? (
          <Textarea
            placeholder={t("sections:form.prompt.placeholder")}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            disabled={isPending || isGenerating}
            rows={8}
            className="resize-none bg-white text-sm"
          />
        ) : (
          <div className="rounded-lg border border-[#e2e8f0] bg-white">
            <SectionPlateEditor
              key={editorKey}
              ref={promptEditorRef}
              content={prompt}
              isEditing={true}
              hideActions={true}
              enableComments={false}
              enableCreateSection={false}
              organizationId={organizationId}
              documentId={documentId}
              mediaUploadTarget={mediaUploadTarget}
              onValueChange={() => {
                const md = promptEditorRef.current?.getMarkdown?.() || "";
                onPromptChange(md);
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 min-h-5">
          {isGenerating ? (
            <div className="flex items-center gap-1 text-xs text-[#2563eb]">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("sections:form.prompt.generatingHint")}
            </div>
          ) : isEditingWithAi ? (
            <div className="flex items-center gap-1 text-xs text-[#2563eb]">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("sections:form.prompt.editingHint")}
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onOpenAiEdit}
            disabled={!canEditWithAi || !prompt.trim() || isGenerating || isPending || isEditingWithAi}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#2563eb] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
          >
            <Bot className="h-3 w-3" />
            {t("sections:form.prompt.edit")}
          </button>
        </div>

        <AiEditSectionDialog
          open={isAiEditOpen}
          onOpenChange={onAiEditOpenChange}
          onSend={onSendAiEdit}
          isProcessing={isEditingWithAi}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-[#334155]">{t("sections:form.aiContext.label")}</Label>
        <p className="text-xs text-[#64748b]">{t("sections:form.aiContext.help")}</p>
        <SectionContextPicker
          options={contextOptions}
          selectedIds={selectedContextIds}
          onChange={onContextChange}
          disabled={isPending}
        />
      </div>
    </HuemulTintedFieldset>
  );
}
