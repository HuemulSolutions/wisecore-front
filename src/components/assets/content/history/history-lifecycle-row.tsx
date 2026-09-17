import { ArrowRight, ChevronDown, CheckCircle2, ArrowRightCircle, Undo2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge";
import { HuemulExpandableText } from "@/huemul/components/huemul-expandable-text";
import { isLifecycleState } from "@/lib/lifecycle-access";
import { formatHistoryDateTime, formatDurationCompact } from "@/lib/format-history-date";
import { parseApiDate } from "@/services/utils";
import type { HistoryEntryVM } from "@/types/assets";
import type { ExecutionEvent, ExecutionEventType } from "@/types/execution-lifecycle";

// Círculo de tipo (20px) por `event_type` — vocabulario propio del feed
// narrow, independiente del `tone`/`icon` de `HistoryEntryVM` (que sigue
// sirviendo al tab `section`, con panel de detalle propio).
const LIFECYCLE_MARK: Record<ExecutionEventType, { icon: typeof ArrowRightCircle; bg: string; fg: string }> = {
  advanced: { icon: ArrowRightCircle, bg: "bg-[#eff5ff]", fg: "text-[#2563eb]" },
  auto_advanced: { icon: ArrowRightCircle, bg: "bg-[#eff5ff]", fg: "text-[#2563eb]" },
  step_completed: { icon: CheckCircle2, bg: "bg-[#f0fdf4]", fg: "text-[#16a34a]" },
  rejected: { icon: Undo2, bg: "bg-[#fef2f2]", fg: "text-[#dc2626]" },
  restored: { icon: RotateCcw, bg: "bg-[#f8fafc]", fg: "text-[#64748b]" },
};

/** Texto de contexto de la fila: prioriza la transición de estado; si no hay, cae al nombre de la etapa. */
function rowContext(raw: ExecutionEvent, t: (key: string, opts?: Record<string, unknown>) => string): string | null {
  if (raw.from_state && raw.to_state && raw.from_state !== raw.to_state) {
    const fromLabel = t(`lifecycle.stateLabels.${raw.from_state}`, { defaultValue: raw.from_state });
    const toLabel = t(`lifecycle.stateLabels.${raw.to_state}`, { defaultValue: raw.to_state });
    return `${fromLabel} → ${toLabel}`;
  }
  return raw.step_name ?? null;
}

export function HistoryLifecycleRow({
  entry,
  previousCreatedAt,
  executionLabel,
  expanded,
  onToggle,
}: {
  entry: HistoryEntryVM<ExecutionEvent>;
  /** `created_at` del evento cronológicamente anterior en la lista plana (si lo hay), para "tiempo en etapa". */
  previousCreatedAt?: string;
  executionLabel?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation(["assets", "common"]);
  const { raw } = entry;
  const mark = LIFECYCLE_MARK[raw.event_type] ?? LIFECYCLE_MARK.advanced;
  const MarkIcon = mark.icon;
  const context = rowContext(raw, t);
  const showsTransition = !!(raw.from_state && raw.to_state && raw.from_state !== raw.to_state);
  const isRejection = raw.event_type === "rejected";

  const timeInStage = previousCreatedAt
    ? formatDurationCompact(parseApiDate(entry.createdAt).getTime() - parseApiDate(previousCreatedAt).getTime())
    : null;

  return (
    <div className={cn("border-b border-[#e8ecf2]", expanded && "relative bg-[#eff5ff]")}>
      {expanded && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#2563eb]" aria-hidden="true" />}

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group flex w-full items-center gap-2.5 px-[22px] py-[13px] text-left hover:cursor-pointer",
          !expanded && "hover:bg-[#f8fafc]",
        )}
        aria-expanded={expanded}
        title={expanded ? t("common:collapseRow") : t("common:expandRow")}
      >
        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", mark.bg)}>
          <MarkIcon className={cn("size-2", mark.fg)} />
        </span>

        <span className="min-w-0 flex-1 truncate text-[13.5px]">
          <span className="font-medium text-[#0f172a]">{entry.typeLabel}</span>
          {context && <span className="font-normal text-[#64748b]"> · {context}</span>}
        </span>

        <span className="shrink-0 text-[12px] text-[#64748b]">{formatHistoryDateTime(entry.createdAt)}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-[#94a3b8] transition-transform group-hover:text-[#64748b]",
            expanded && "rotate-180 text-[#2563eb]",
          )}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 pb-3 pl-[30px] pr-[22px]">
          {showsTransition && (
            <div className="flex items-center gap-2">
              <StatePill state={raw.from_state} />
              <ArrowRight className="size-3 shrink-0 text-[#cbd5e1]" />
              {isLifecycleState(raw.to_state) ? (
                <HuemulLifecycleBadge state={raw.to_state} />
              ) : (
                <StatePill state={raw.to_state} destructive={isRejection} />
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Meta label={t("assetHistory.metaAuthor")} value={entry.authorName} />
            {executionLabel && <Meta label={t("assetHistory.metaExecution")} value={executionLabel} />}
            {timeInStage && <Meta label={t("assetHistory.metaTimeInStage")} value={timeInStage} />}
          </div>

          {raw.comment && (
            <HuemulExpandableText
              text={`«${raw.comment}»`}
              collapsedLines={3}
              showMoreLabel={t("lifecycleHistory.showMore")}
              showLessLabel={t("lifecycleHistory.showLess")}
              className="border-l-2 border-[#e8ecf2] pl-2.5"
              textClassName="text-[12.5px] italic text-[#475569]"
            />
          )}
        </div>
      )}
    </div>
  );
}

/** Pastilla neutra para el estado de origen — el destino usa `HuemulLifecycleBadge`. */
function StatePill({ state, destructive }: { state: string | null; destructive?: boolean }) {
  const { t } = useTranslation("assets");
  if (!state) return null;
  const label = t(`lifecycle.stateLabels.${state}`, { defaultValue: state });
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium",
        destructive ? "border-[#fca5a5] text-[#b91c1c]" : "border-[#e2e8f0] bg-white text-[#334155]",
      )}
    >
      <span className={cn("size-1.5 rounded-full", destructive ? "bg-[#dc2626]" : "bg-[#94a3b8]")} />
      {label}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-[#94a3b8]">{label}</p>
      <p className="mt-0.5 truncate text-[12.5px] text-[#475569]">{value}</p>
    </div>
  );
}
