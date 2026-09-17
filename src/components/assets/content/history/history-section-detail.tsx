import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import MarkdownDiffViewer from "@/components/MarkdownDiffViewer";
import { HistoryDetailBlock } from "./history-detail-parts";
import type { HistoryEntryVM } from "@/types/assets";
import type { SectionHistoryEntry } from "@/types/section-execution";

/** Cuerpo del panel derecho para una entrada del tab "Contenido de la sección". */
export function HistorySectionDetail({ entry }: { entry: HistoryEntryVM<SectionHistoryEntry> }) {
  const { t } = useTranslation("assets");
  const [copied, setCopied] = useState(false);
  const { raw } = entry;

  const handleCopy = () => {
    if (!raw.user_instruction) return;
    navigator.clipboard.writeText(raw.user_instruction).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col">
      {raw.user_instruction && (
        <HistoryDetailBlock label={t("assetHistory.blockInstruction")}>
          <div className="flex items-start gap-2">
            <p className="flex-1 whitespace-pre-wrap text-xs italic text-[#0f172a]">{raw.user_instruction}</p>
            <button
              type="button"
              onClick={handleCopy}
              title={t("history.copyInstruction")}
              className="shrink-0 rounded p-1 hover:cursor-pointer hover:bg-[#eef2f7]"
            >
              {copied ? <Check className="size-3.5 text-[#15803d]" /> : <Copy className="size-3.5 text-[#64748b]" />}
            </button>
          </div>
        </HistoryDetailBlock>
      )}

      <div className="p-4">
        <MarkdownDiffViewer
          oldContent={raw.previous_text ?? ""}
          newContent={raw.new_text}
          oldLabel={t("history.diffPreviousLabel")}
          newLabel={t("history.diffNewLabel")}
          defaultMode="rendered"
          showModeToggle={false}
          showRenderedDiffPanel={false}
          labels={{
            title: t("assetHistory.diff.title"),
            unchanged: t("assetHistory.diff.unchanged"),
          }}
        />
      </div>
    </div>
  );
}
