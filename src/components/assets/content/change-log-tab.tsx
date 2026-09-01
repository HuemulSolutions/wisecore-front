import { useEffect, useState } from "react";
import { CalendarClock, UserRound, ArrowRightCircle, Pencil, ArrowRight, AlertCircle, History, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import { useDocumentChangeLog } from "@/hooks/useDocumentChangeLog";
import { TimelineSkeleton, TimelineComment, isLifecycleState } from "./timeline-shared";
import type { DocumentChangeLogEntry, DocumentChangeType } from "@/types/document-change-log";

// Campos que llegan como fecha YYYY-MM-DD (ver formatChangeValue: no pasar
// por `new Date()`, se interpreta en UTC y corre el día en zonas negativas).
const DATE_FIELDS = new Set([
  "expiration_date",
  "estimated_publication_date",
  "review_date",
  "audit_date",
]);

const CHANGE_TYPE_FILTERS: (DocumentChangeType | "all")[] = [
  "all",
  "date_changed",
  "owner_changed",
  "lifecycle_state_changed",
  "metadata_changed",
];

// ── Config ─────────────────────────────────────────────────────────────────

const CHANGE_TYPE_CONFIG: Record<
  DocumentChangeType,
  { icon: React.ComponentType<{ className?: string }>; iconColorClass: string; dotClass: string; badgeClass: string }
> = {
  date_changed: {
    icon: CalendarClock,
    iconColorClass: "text-amber-500",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  owner_changed: {
    icon: UserRound,
    iconColorClass: "text-purple-500",
    dotClass: "bg-purple-400",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  lifecycle_state_changed: {
    icon: ArrowRightCircle,
    iconColorClass: "text-blue-500",
    dotClass: "bg-blue-400",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  metadata_changed: {
    icon: Pencil,
    iconColorClass: "text-gray-500",
    dotClass: "bg-gray-400",
    badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
  },
};

// ── Formateo de valores ─────────────────────────────────────────────────────

function formatDateValue(value: string): string {
  // "2026-08-28" -> "28/08/2026", sin construir un Date (evita el corrimiento
  // de día por interpretación UTC).
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function ChangeValue({ value, fieldName, emptyLabel }: { value: string | null; fieldName: string; emptyLabel: string }) {
  const { t } = useTranslation("assets");

  if (value === null) {
    return <span className="italic text-muted-foreground">{emptyLabel}</span>;
  }
  if (fieldName === "context_required") {
    return <span>{value === "True" ? t("common:yes") : t("common:no")}</span>;
  }
  if (fieldName === "lifecycle_state" && isLifecycleState(value)) {
    return <HuemulLifecycleBadge state={value} />;
  }
  if (DATE_FIELDS.has(fieldName)) {
    return <span>{formatDateValue(value)}</span>;
  }
  return <span className="truncate">{value}</span>;
}

// ── Row ──────────────────────────────────────────────────────────────────

function ChangeRow({
  entry,
  isLast,
  userLabel,
}: {
  entry: DocumentChangeLogEntry;
  isLast: boolean;
  userLabel: string;
}) {
  const { t } = useTranslation("assets");
  const config = CHANGE_TYPE_CONFIG[entry.change_type];
  const Icon = config.icon;
  const emptyLabel = t("changeLog.emptyValue");

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
            {t(`changeLog.changeType.${entry.change_type}`)}
          </span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium leading-4", config.badgeClass)}>
            {t(`changeLog.fieldName.${entry.field_name}`, { defaultValue: entry.field_name })}
          </Badge>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-xs">
          <ChangeValue value={entry.old_value} fieldName={entry.field_name} emptyLabel={emptyLabel} />
          <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
          <ChangeValue value={entry.new_value} fieldName={entry.field_name} emptyLabel={emptyLabel} />
        </div>

        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{userLabel}</span>
          <span>·</span>
          <span>{formatRelativeTime(entry.created_at)}</span>
        </div>

        {entry.comment && <TimelineComment comment={entry.comment} />}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

interface ChangeLogTabProps {
  open: boolean;
  documentId: string;
  organizationId: string;
  userMap: Map<string, string>;
}

export function ChangeLogTab({ open, documentId, organizationId, userMap }: ChangeLogTabProps) {
  const { t } = useTranslation(["assets", "common"]);

  const [changeType, setChangeType] = useState<DocumentChangeType | "all">("all");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<DocumentChangeLogEntry[]>([]);

  const { data, isLoading, isError, isFetching, refetch } = useDocumentChangeLog(organizationId, documentId, {
    enabled: open,
    page,
    pageSize: 100,
    changeType: changeType === "all" ? undefined : changeType,
  });

  // Reset al abrir o al cambiar el filtro
  useEffect(() => {
    if (open) {
      setPage(1);
      setEntries([]);
    }
  }, [open, changeType]);

  useEffect(() => {
    if (!data) return;
    setEntries((prev) => {
      if (data.page === 1) return data.data;
      const seen = new Set(prev.map((e) => e.id));
      return [...prev, ...data.data.filter((e) => !seen.has(e.id))];
    });
  }, [data]);

  const hasNext = data?.has_next ?? false;

  return (
    <div className="flex flex-col gap-4">
      {/* Filtro por tipo de cambio + refresh */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md flex-wrap">
          {CHANGE_TYPE_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setChangeType(filter)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded hover:cursor-pointer transition-colors",
                changeType === filter ? "bg-white text-gray-900 shadow-sm" : "text-muted-foreground hover:text-gray-700",
              )}
            >
              {filter === "all" ? t("changeLog.filterAll") : t(`changeLog.changeType.${filter}`)}
            </button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:cursor-pointer transition-colors rounded shrink-0"
          title={t("common:refresh")}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
        </button>
      </div>

      {isLoading && <TimelineSkeleton />}

      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <p className="text-xs text-muted-foreground">{t("changeLog.loadError")}</p>
        </div>
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <History className="h-7 w-7 text-gray-200" />
          <p className="text-xs text-muted-foreground">
            {changeType === "all" ? t("changeLog.empty") : t("changeLog.emptyFiltered")}
          </p>
        </div>
      )}

      {!isLoading && !isError && entries.length > 0 && (
        <>
          <div>
            {entries.map((entry, index) => (
              <ChangeRow
                key={entry.id}
                entry={entry}
                isLast={index === entries.length - 1}
                userLabel={userMap.get(entry.actor_user_id) || t("lifecycleHistory.unknownActor")}
              />
            ))}
          </div>

          {hasNext && (
            <div className="flex justify-center pb-2">
              <HuemulButton
                variant="outline"
                size="sm"
                label={t("common:loadMore")}
                loading={isFetching}
                onClick={() => setPage((p) => p + 1)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
