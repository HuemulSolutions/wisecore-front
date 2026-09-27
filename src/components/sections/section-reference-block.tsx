import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HuemulTintedFieldset } from "@/huemul/components/huemul-tinted-fieldset";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulAssetTreePickerDialog } from "@/huemul/components/huemul-asset-tree-picker";
import { Label } from "@/components/ui/label";
import Markdown from "@/components/ui/markdown";
import { SECTION_TYPE_META } from "./section-type-meta";
import type { SectionReferenceBlockProps } from "@/types/sections/blocks";
export type { SectionReferenceBlockProps } from "@/types/sections/blocks";

const REFERENCE_META = SECTION_TYPE_META.reference;

/**
 * Bloque de configuración del tipo "Referencia" — el documento de origen se
 * elige con el picker genérico de biblioteca en popup
 * (`HuemulAssetTreePickerDialog`, `mode="document"`, `container="sheet"`
 * porque este bloque vive dentro de otro HuemulSheet), no con un árbol
 * inline — ver ia context/arbol-biblioteca-activos-guide.md §0.
 */
export function SectionReferenceBlock({
  isPending,
  organizationId,
  selectedAsset,
  onAssetPick,
  onClearAsset,
  assetSections,
  isLoadingSections,
  referenceSectionId,
  onReferenceSectionChange,
  referenceMode,
  onReferenceModeChange,
  availableExecutions,
  isLoadingExecutions,
  referenceExecutionId,
  onReferenceExecutionChange,
  previewContent,
  isLoadingPreview,
  onRefreshPreview,
}: SectionReferenceBlockProps) {
  const { t } = useTranslation("sections");
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <HuemulTintedFieldset
      title={t("form.blocks.referenceTitle")}
      accent={REFERENCE_META.color}
      borderColor="#e5dcff"
      background="#fdfcff"
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-[#334155]">
          {t("form.reference.selectAssetLabel")} <span className="text-red-500">*</span>
        </Label>

        {selectedAsset ? (
          <div className="flex items-center gap-2 rounded-md border border-[#e2e8f0] bg-white p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0f172a]">{selectedAsset.name}</p>
              <p className="text-xs text-[#64748b]">{t("form.reference.selectedAsset")}</p>
            </div>
            <HuemulButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAsset}
              disabled={isPending}
              icon={X}
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setPickerOpen(true)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border border-dashed border-[#cbd5e1] bg-white p-3 text-left",
              isPending
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:border-[#7c3aed] hover:bg-[#faf7ff]",
            )}
          >
            <span className="text-sm text-[#64748b]">{t("form.reference.chooseAssetButton")}</span>
            <Search className="h-4 w-4 shrink-0 text-[#94a3b8]" />
          </button>
        )}
        <p className="text-xs text-[#64748b]">{t("form.reference.selectAssetHint")}</p>

        <HuemulAssetTreePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          organizationId={organizationId}
          mode="document"
          container="sheet"
          title={t("form.reference.pickerTitle")}
          description={t("form.reference.pickerDescription")}
          onSelect={(id, label) => onAssetPick(id, label)}
        />
      </div>

      {selectedAsset && (
        <HuemulField
          type="select"
          label={t("form.reference.sectionLabel")}
          required
          options={assetSections.map((s) => ({ value: s.id, label: s.name }))}
          value={referenceSectionId}
          onChange={(val) => {
            const sectionId = val as string;
            const section = assetSections.find((s) => s.id === sectionId);
            onReferenceSectionChange(sectionId, section?.name ?? "");
          }}
          disabled={isPending || isLoadingSections}
          placeholder={
            isLoadingSections ? t("form.reference.sectionPlaceholderLoading") : t("form.reference.sectionPlaceholder")
          }
          error={
            !isLoadingSections && assetSections.length === 0 ? t("form.reference.sectionErrorEmpty") : undefined
          }
        />
      )}

      {selectedAsset && referenceSectionId && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-[#334155]">{t("form.reference.versionLabel")}</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(["latest", "specific"] as const).map((mode) => {
              const selected = referenceMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={isPending}
                  onClick={() => onReferenceModeChange(mode)}
                  className={cn(
                    "flex items-start gap-2 rounded-[10px] border p-3 text-left",
                    isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  )}
                  style={{
                    borderColor: selected ? REFERENCE_META.color : "#e2e8f0",
                    backgroundColor: selected ? "#faf7ff" : "#ffffff",
                  }}
                >
                  <span
                    className="mt-0.5 flex h-3.75 w-3.75 shrink-0 items-center justify-center rounded-full border-2"
                    style={{ borderColor: selected ? REFERENCE_META.color : "#cbd5e1" }}
                  >
                    {selected && <span className="h-1.75 w-1.75 rounded-full" style={{ backgroundColor: REFERENCE_META.color }} />}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-[#0f172a]">
                      {mode === "latest" ? t("form.reference.versionLatestTitle") : t("form.reference.versionPinnedTitle")}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      {mode === "latest" ? t("form.reference.versionLatestHelp") : t("form.reference.versionPinnedHelp")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {referenceMode === "specific" && selectedAsset && (
        <HuemulField
          type="select"
          label={t("form.reference.executionLabel")}
          required
          options={availableExecutions.map((exec) => ({ value: exec.id, label: exec.name }))}
          value={referenceExecutionId}
          onChange={(val) => onReferenceExecutionChange(val as string)}
          disabled={isPending || isLoadingExecutions}
          placeholder={
            isLoadingExecutions ? t("form.reference.executionPlaceholderLoading") : t("form.reference.executionPlaceholder")
          }
          error={
            !isLoadingExecutions && availableExecutions.length === 0 ? t("form.reference.executionErrorEmpty") : undefined
          }
        />
      )}

      {referenceSectionId && (referenceMode === "latest" || (referenceMode === "specific" && referenceExecutionId)) && (
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase text-[#64748b]" style={{ letterSpacing: "0.06em" }}>
              {t("form.reference.previewTitle")}
            </span>
            <HuemulButton
              icon={RefreshCw}
              iconClassName="h-3.5 w-3.5 text-[#64748b]"
              variant="ghost"
              size="icon"
              className="h-6.5 w-6.5"
              loading={isLoadingPreview}
              tooltip={t("form.reference.refreshPreview")}
              onClick={onRefreshPreview}
            />
          </div>

          {isLoadingPreview ? (
            <div className="flex items-center gap-2 py-2 text-xs text-[#64748b]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("form.reference.previewLoading")}
            </div>
          ) : previewContent ? (
            <div className="mt-2 max-h-75 overflow-y-auto text-[12px] leading-[1.6] text-[#475569]">
              <Markdown>{previewContent}</Markdown>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#64748b]">{t("form.reference.previewEmpty")}</p>
          )}

          <p className="mt-2 text-xs text-[#64748b]">{t("form.reference.previewReadOnly")}</p>
        </div>
      )}
    </HuemulTintedFieldset>
  );
}
