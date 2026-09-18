import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { History } from "lucide-react";
import { HuemulMasterDetailPane } from "@/huemul/components/huemul-master-detail-pane";
import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { HistoryErrorState } from "./history-error-state";
import type { AssetHistoryTabData, HistoryEntryVM } from "@/types/assets";

/**
 * Puente dominio → huemul del tab "Contenido de la sección" — único
 * consumidor de `HuemulMasterDetailPane` en el sheet de historial. Los tabs
 * "Ciclo de vida" y "Cambios del activo" usan el feed angosto
 * (`HistoryLifecycleFeed` / `HistoryChangesFeed`), sin selección previa.
 */
export function HistorySectionShell<TRaw>({
  data,
  listLabel,
  listCountLabel,
  loadMoreLabel,
  emptyTitle,
  emptyDescription,
  renderDetail,
  detailHeader,
  /** Cambia si se reabre el sheet para una sección distinta: vuelve a auto-seleccionar la primera fila. */
  resetKey,
}: {
  data: AssetHistoryTabData<TRaw>;
  listLabel: string;
  listCountLabel?: string;
  loadMoreLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  renderDetail: (entry: HistoryEntryVM<TRaw>) => ReactNode;
  detailHeader?: (entry: HistoryEntryVM<TRaw>) => ReactNode;
  resetKey?: string | number;
}) {
  const { t } = useTranslation("assets");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [resetKey]);

  const effectiveSelectedId = selectedId ?? data.entries[0]?.id ?? null;
  const selectedEntry = data.entries.find((e) => e.id === effectiveSelectedId) ?? null;

  const showSkeleton = data.isLoading && data.entries.length === 0;
  const state = data.isError ? "error" : showSkeleton ? "loading" : data.entries.length === 0 ? "empty" : undefined;

  const rows = data.entries.map((entry) => ({
    id: entry.id,
    icon: entry.icon,
    iconClassName: TONE_ICON_CLASS[entry.tone],
    title: entry.typeLabel,
    context: entry.context,
    authorName: entry.authorName,
    timeLabel: formatRelativeTime(entry.createdAt),
  }));

  return (
    <HuemulMasterDetailPane
      state={state}
      listLabel={listLabel}
      rows={rows}
      selectedId={effectiveSelectedId}
      onSelect={setSelectedId}
      listCountLabel={data.entries.length > 0 ? listCountLabel : undefined}
      loadMore={data.hasNext ? { label: loadMoreLabel, loading: data.isFetching, onClick: data.loadMore } : undefined}
      errorState={<HistoryErrorState error={data.error} endpoint={data.endpoint} onRetry={data.refetch} />}
      emptyState={
        <div className="px-3 py-2">
          <HuemulPanelEmptyState icon={History} title={emptyTitle} description={emptyDescription} />
        </div>
      }
      detailHeader={selectedEntry ? detailHeader?.(selectedEntry) : undefined}
      detail={selectedEntry ? renderDetail(selectedEntry) : null}
      detailPlaceholder={
        <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
          <History className="size-8 text-[#cbd5e1]" />
          <p className="text-sm text-[#64748b]">{t("assetHistory.selectEntry")}</p>
        </div>
      }
    />
  );
}

const TONE_ICON_CLASS: Record<HistoryEntryVM["tone"], string> = {
  blue: "text-[#2563eb]",
  violet: "text-[#7c3aed]",
  amber: "text-[#b45309]",
  green: "text-[#15803d]",
  slate: "text-[#475569]",
  red: "text-[#b91c1c]",
};
