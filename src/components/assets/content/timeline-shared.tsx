import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ExecutionLifecycleState } from "@/types/execution";

// Piezas reutilizadas por los tabs de historial del documento (ciclo de vida
// y log de cambios): ambos comparten el mismo look de timeline.

export const LIFECYCLE_STATES: ExecutionLifecycleState[] = [
  "draft",
  "in_review",
  "in_approval",
  "approved",
  "published",
  "archived",
  "finalized",
];

export function isLifecycleState(state: string | null): state is ExecutionLifecycleState {
  return !!state && (LIFECYCLE_STATES as string[]).includes(state);
}

// ── Skeleton ───────────────────────────────────────────────────────────────

export function TimelineSkeleton() {
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

// ── Comentario expandible ───────────────────────────────────────────────────

export function TimelineComment({ comment }: { comment: string }) {
  const { t } = useTranslation("assets");
  const [expanded, setExpanded] = useState(false);
  const commentIsLong = comment.length > 160;

  return (
    <div className="mt-1.5 bg-gray-50 border border-gray-100 rounded px-2.5 py-1.5">
      <p className={cn("text-xs text-gray-700 whitespace-pre-wrap", !expanded && commentIsLong && "line-clamp-3")}>
        {comment}
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
  );
}
