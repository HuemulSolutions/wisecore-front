import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HuemulGroupedFeed } from "@/huemul/components/huemul-grouped-feed";
import { HistoryLifecycleSummary } from "./history-lifecycle-summary";
import { HistoryLifecycleRow } from "./history-lifecycle-row";
import { HistoryFeedEmpty } from "./history-feed-empty";
import { HistoryErrorState } from "./history-error-state";
import { groupByConsecutive } from "./history-grouping";
import type { AssetHistoryTabData } from "@/types/assets";
import type { ExecutionEvent } from "@/types/execution-lifecycle";
import type { ExecutionSummary } from "@/types/assets";

/**
 * Cuerpo del tab "Ciclo de vida" del sheet angosto: franja de resumen +
 * grupos por etapa (runs consecutivos — una etapa repetida tras un rechazo
 * sale como dos grupos) + acordeón de una sola fila.
 */
export function HistoryLifecycleFeed({
  data,
  executions,
  viewExecutionId,
  onExecutionChange,
  executionLabel,
}: {
  data: AssetHistoryTabData<ExecutionEvent>;
  executions: ExecutionSummary[];
  viewExecutionId: string;
  onExecutionChange: (id: string) => void;
  executionLabel: string;
}) {
  const { t } = useTranslation("assets");
  const { entries } = data;

  // Tri-estado: `undefined` = nunca tocado (default a la más reciente),
  // `null` = el usuario cerró explícitamente la fila abierta. Sin esto,
  // cerrar la fila abierta la reabre al instante (ver riesgo R1 del plan).
  const [expandedId, setExpandedId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setExpandedId(undefined);
  }, [viewExecutionId]);

  const defaultId = entries[0]?.id ?? null;
  const effectiveId =
    expandedId === undefined ? defaultId : expandedId && entries.some((e) => e.id === expandedId) ? expandedId : null;

  const groups = useMemo(() => groupByConsecutive(entries, (e) => e.raw.step_name ?? ""), [entries]);

  const showSkeleton = data.isLoading;
  const state = data.isError ? "error" : showSkeleton ? "loading" : entries.length === 0 ? "empty" : undefined;

  const renderedGroups = groups.map((group) => ({
    key: group.key,
    label: t("assetHistory.groupHeading", {
      label: group.value || t("assetHistory.summaryStage"),
      count: group.entries.length,
    }),
    rows: group.entries.map((entry) => {
      const flatIndex = entries.findIndex((e) => e.id === entry.id);
      const previousCreatedAt = entries[flatIndex + 1]?.createdAt;
      const isExpanded = entry.id === effectiveId;
      return (
        <HistoryLifecycleRow
          key={entry.id}
          entry={entry}
          previousCreatedAt={previousCreatedAt}
          executionLabel={executionLabel}
          expanded={isExpanded}
          onToggle={() => setExpandedId(isExpanded ? null : entry.id)}
        />
      );
    }),
  }));

  return (
    <HuemulGroupedFeed
      state={state}
      contextStrip={
        <HistoryLifecycleSummary
          latestEvent={entries[0]}
          executions={executions}
          viewExecutionId={viewExecutionId}
          onExecutionChange={onExecutionChange}
        />
      }
      groups={renderedGroups}
      emptyState={<HistoryFeedEmpty title={t("assetHistory.emptyLifecycle.title")} description={t("assetHistory.emptyLifecycle.description")} />}
      errorState={<HistoryErrorState error={data.error} endpoint={data.endpoint} onRetry={data.refetch} />}
    />
  );
}
