import { HuemulInitialsAvatar } from "@/huemul/components/huemul-initials-avatar";
import { formatHistoryDateTime } from "@/lib/format-history-date";
import { HistoryChangeValue } from "./history-change-value";
import type { HistoryEntryVM } from "@/types/assets";
import type { DocumentChangeLogEntry } from "@/types/document-change-log";

/** Fila del tab "Cambios del activo": campo + hora, valor, línea de autor. Todo visible, sin expandir. */
export function HistoryChangesRow({ entry }: { entry: HistoryEntryVM<DocumentChangeLogEntry> }) {
  return (
    <div className="flex flex-col gap-[9px] border-b border-[#eef1f6] px-[22px] py-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13.5px] font-semibold text-[#0f172a]">{entry.context}</p>
        <span className="shrink-0 text-[12px] text-[#64748b]">{formatHistoryDateTime(entry.createdAt)}</span>
      </div>

      <HistoryChangeValue entry={entry.raw} />

      {entry.authorName && (
        <div className="flex items-center gap-1.5">
          <HuemulInitialsAvatar name={entry.authorName} size={18} />
          <span className="text-[12.5px] text-[#64748b]">{entry.authorName}</span>
        </div>
      )}
    </div>
  );
}
