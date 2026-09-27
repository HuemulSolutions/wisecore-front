import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HuemulGroupedFeed } from "@/huemul/components/huemul-grouped-feed";
import { HuemulContextStrip } from "@/huemul/components/huemul-context-strip";
import { HuemulField } from "@/huemul/components/huemul-field";
import { formatHistoryDayHeading } from "@/lib/format-history-date";
import { HistoryChangesRow } from "./history-changes-row";
import { HistoryFeedEmpty, HistoryFeedFilteredEmpty } from "./history-feed-empty";
import { HistoryErrorState } from "./history-error-state";
import { groupByDay } from "./history-grouping";
import type { AssetHistoryTabData } from "@/types/assets";
import type { DocumentChangeLogEntry, DocumentChangeType } from "@/types/document-change-log";

const CHANGE_TYPE_FILTERS: (DocumentChangeType | "all")[] = [
  "all",
  "date_changed",
  "owner_changed",
  "lifecycle_state_changed",
  "metadata_changed",
];

/** Cuerpo del tab "Cambios del activo" del sheet angosto: barra TIPO + grupos por día, sin acordeón. */
export function HistoryChangesFeed({
  data,
  changeType,
  onChangeTypeChange,
}: {
  data: AssetHistoryTabData<DocumentChangeLogEntry>;
  changeType: DocumentChangeType | "all";
  onChangeTypeChange: (value: DocumentChangeType | "all") => void;
}) {
  const { t } = useTranslation("assets");
  const { entries } = data;

  const groups = useMemo(() => groupByDay(entries), [entries]);

  const showSkeleton = data.isLoading;
  const isFiltered = changeType !== "all";
  const state = data.isError ? "error" : showSkeleton ? "loading" : entries.length === 0 ? "empty" : undefined;

  const renderedGroups = groups.map((group) => ({
    key: group.key,
    label: formatHistoryDayHeading(group.entries[0].createdAt),
    rows: group.entries.map((entry) => <HistoryChangesRow key={entry.id} entry={entry} />),
  }));

  return (
    <HuemulGroupedFeed
      state={state}
      contextStrip={
        <HuemulContextStrip
          blocks={[
            {
              key: "type",
              label: t("assetHistory.filterTypeLabel"),
              content: (
                <div className="w-44">
                  <HuemulField
                    type="select"
                    selectSize="sm"
                    value={changeType}
                    onChange={(val) => onChangeTypeChange(val as DocumentChangeType | "all")}
                    options={CHANGE_TYPE_FILTERS.map((filter) => ({
                      value: filter,
                      label: filter === "all" ? t("changeLog.filterAll") : t(`changeLog.changeType.${filter}`),
                    }))}
                  />
                </div>
              ),
            },
          ]}
        />
      }
      groups={renderedGroups}
      emptyState={
        isFiltered ? (
          <HistoryFeedFilteredEmpty
            title={t("assetHistory.emptyFilteredTitle")}
            chips={[{ key: "changeType", label: t(`changeLog.changeType.${changeType}`) }]}
            onClear={() => onChangeTypeChange("all")}
          />
        ) : (
          <HistoryFeedEmpty title={t("assetHistory.emptyChanges.title")} description={t("assetHistory.emptyChanges.description")} />
        )
      }
      errorState={<HistoryErrorState error={data.error} endpoint={data.endpoint} onRetry={data.refetch} />}
    />
  );
}
