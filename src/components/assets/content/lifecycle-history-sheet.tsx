import { useEffect, useMemo, useState } from "react";
import { History, CheckCircle2, ArrowRightCircle, ArrowRight, Undo2, AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { parseApiDate, cn } from "@/lib/utils";
import { useUsers } from "@/hooks/useUsers";
import { useExecutionEvents } from "@/hooks/useExecutionLifecycle";
import { getExecutionDisplayLabel } from "./utils/version-utils";
import type { ExecutionEvent, ExecutionEventType, LifecycleStepKind } from "@/types/execution-lifecycle";
import type { ExecutionSummary } from "@/types/assets";
import type { ExecutionLifecycleState } from "@/types/execution";

const LIFECYCLE_STATES: ExecutionLifecycleState[] = [
  "draft",
  "in_review",
  "in_approval",
  "approved",
  "published",
  "archived",
  "finalized",
];

function isLifecycleState(state: string | null): state is ExecutionLifecycleState {
  return !!state && (LIFECYCLE_STATES as string[]).includes(state);
}

// ── Config ─────────────────────────────────────────────────────────────────

const DEFAULT_EVENT_CONFIG = {
  icon: ArrowRightCircle,
  iconColorClass: "text-gray-500",
  dotClass: "bg-gray-400",
  badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
};

const EVENT_TYPE_CONFIG: Partial<
  Record<
    ExecutionEventType,
    { icon: React.ComponentType<{ className?: string }>; iconColorClass: string; dotClass: string; badgeClass: string }
  >
> = {
  step_completed: {
    icon: CheckCircle2,
    iconColorClass: "text-green-500",
    dotClass: "bg-green-400",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  auto_advanced: {
    icon: ArrowRightCircle,
    iconColorClass: "text-blue-500",
    dotClass: "bg-blue-400",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  advanced: {
    icon: ArrowRightCircle,
    iconColorClass: "text-blue-500",
    dotClass: "bg-blue-400",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  rejected: {
    icon: Undo2,
    iconColorClass: "text-red-500",
    dotClass: "bg-red-400",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
};

interface LifecycleHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executionId: string;
  organizationId: string;
  allExecutions: ExecutionSummary[];
}

// ── Row ──────────────────────────────────────────────────────────────────

function EventRow({
  event,
  isLast,
  userLabel,
}: {
  event: ExecutionEvent;
  isLast: boolean;
  userLabel: string;
}) {
  const { t } = useTranslation("assets");
  const config = EVENT_TYPE_CONFIG[event.event_type] ?? DEFAULT_EVENT_CONFIG;
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(false);

  const stateLabel = (state: string | null) =>
    state ? t(`lifecycle.stateLabels.${state}`, { defaultValue: state }) : null;
  const stepKindLabel = (kind: LifecycleStepKind | null) =>
    kind ? t(`lifecycle.stageLabels.${kind}`, { defaultValue: kind }) : null;

  const showsTransition = event.from_state && event.to_state && event.from_state !== event.to_state;
  const commentIsLong = (event.comment?.length ?? 0) > 160;

  const renderStatePill = (state: string | null) =>
    isLifecycleState(state) ? (
      <HuemulLifecycleBadge state={state} />
    ) : (
      <span className="text-xs font-medium text-gray-700">{stateLabel(state)}</span>
    );

  return (
    <div className="flex gap-3">
      {/* Dot + connecting line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn("h-2.5 w-2.5 rounded-full mt-1.5", config.dotClass)} />
        {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Icon className={cn("h-3.5 w-3.5 shrink-0", config.iconColorClass)} />
          <span className="text-xs font-medium text-gray-900">
            {t(`lifecycleHistory.eventType.${event.event_type}`, { defaultValue: event.event_type })}
          </span>
          {event.step_name && (
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium leading-4", config.badgeClass)}>
              {event.step_name}
              {stepKindLabel(event.step_type) ? ` · ${stepKindLabel(event.step_type)}` : ""}
            </Badge>
          )}
        </div>

        {showsTransition && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {renderStatePill(event.from_state)}
            <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
            {renderStatePill(event.to_state)}
          </div>
        )}

        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{userLabel}</span>
          <span>·</span>
          <span>{formatRelativeTime(event.created_at)}</span>
        </div>

        {event.comment && (
          <div className="mt-1.5 bg-gray-50 border border-gray-100 rounded px-2.5 py-1.5">
            <p className={cn("text-xs text-gray-700 whitespace-pre-wrap", !expanded && commentIsLong && "line-clamp-3")}>
              {event.comment}
            </p>
            {commentIsLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:cursor-pointer"
              >
                {expanded ? t("lifecycleHistory.showLess") : t("lifecycleHistory.showMore")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function LifecycleHistorySheet({
  open,
  onOpenChange,
  executionId,
  organizationId,
  allExecutions,
}: LifecycleHistorySheetProps) {
  const { t } = useTranslation(["assets", "common"]);

  const sortedExecutions = useMemo(
    () => [...(allExecutions ?? [])].sort(
      (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime(),
    ),
    [allExecutions],
  );

  // Local-only version selector — does NOT affect the main viewer's selected execution
  const [viewExecutionId, setViewExecutionId] = useState(executionId);

  useEffect(() => {
    if (open) setViewExecutionId(executionId);
  }, [open, executionId]);

  const { data, isLoading, isError, isFetching, refetch } = useExecutionEvents(organizationId, viewExecutionId, {
    enabled: open,
  });

  const { data: usersData } = useUsers(open, organizationId, 1, 1000);
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    usersData?.data?.forEach((user) => {
      map.set(user.id, [user.name, user.last_name].filter(Boolean).join(" "));
    });
    return map;
  }, [usersData]);

  const events = data?.data?.events ?? [];
  const total = data?.data?.total ?? 0;

  const getLabel = (exec: ExecutionSummary, index: number): string => {
    const label = getExecutionDisplayLabel(exec);
    return label || t("versionManagement.versionFallback", { number: sortedExecutions.length - index });
  };

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("lifecycleHistory.title")}
      description={total > 0 ? t("lifecycleHistory.totalEvents", { count: total }) : t("lifecycleHistory.description")}
      icon={History}
      iconClassName="text-blue-600"
      showFooter={false}
      maxWidth="sm:max-w-xl"
      headerExtra={
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          icon={RefreshCw}
          tooltip={t("common:refresh")}
          loading={isFetching}
          onClick={() => refetch()}
        />
      }
    >
      <div className="flex flex-col gap-5">
        {sortedExecutions.length > 1 && (
          <HuemulField
            type="select"
            label={t("lifecycleHistory.selectVersion")}
            value={viewExecutionId}
            onChange={(val) => setViewExecutionId(String(val))}
            options={sortedExecutions.map((exec, index) => ({
              value: exec.id,
              label: getLabel(exec, index),
            }))}
          />
        )}

        {isLoading && <TimelineSkeleton />}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-xs text-muted-foreground">{t("lifecycleHistory.loadError")}</p>
          </div>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <History className="h-7 w-7 text-gray-200" />
            <p className="text-xs text-muted-foreground">{t("lifecycleHistory.empty")}</p>
          </div>
        )}

        {!isLoading && !isError && events.length > 0 && (
          <div>
            {events.map((event, index) => (
              <EventRow
                key={event.id}
                event={event}
                isLast={index === events.length - 1}
                userLabel={
                  (event.actor_user_id && userMap.get(event.actor_user_id)) ||
                  t("lifecycleHistory.unknownActor")
                }
              />
            ))}
          </div>
        )}
      </div>
    </HuemulSheet>
  );
}
