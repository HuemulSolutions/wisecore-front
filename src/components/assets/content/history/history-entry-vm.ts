import type { TFunction } from "i18next";
import { Bot, FileEdit, Zap, ClipboardList, CheckCircle2, ArrowRightCircle, Undo2, RotateCcw, CalendarClock, UserRound, Pencil } from "lucide-react";
import type { SectionHistoryEntry } from "@/types/section-execution";
import type { ExecutionEvent } from "@/types/execution-lifecycle";
import type { DocumentChangeLogEntry } from "@/types/document-change-log";
import type { HistoryEntryVM, HistoryTone } from "@/types/assets";

// Normalizadores puros (sin React) que traducen cada registro crudo del
// backend a la fila común de historial. Un normalizador por tab; el registro
// original queda en `raw` para que el panel derecho llegue a lo que el VM no
// necesita.

/** Resuelve el nombre contra `userMap`; nunca `null` — cae a "Usuario desconocido" (mismo criterio que el timeline anterior). */
function authorLabel(userId: string | null | undefined, userMap: Map<string, string>, t: TFunction): string {
  return (userId && userMap.get(userId)) || t("assetHistory.unknownActor");
}

// ── Sección ──────────────────────────────────────────────────────────────

const SECTION_ICON: Record<SectionHistoryEntry["change_type"], { icon: HistoryEntryVM["icon"]; tone: HistoryTone }> = {
  manual: { icon: FileEdit, tone: "blue" },
  modify_ai: { icon: Bot, tone: "violet" },
  modify_ai_partial: { icon: Bot, tone: "violet" },
  run_ai: { icon: Zap, tone: "amber" },
  modify_form: { icon: ClipboardList, tone: "green" },
};

export function sectionEntryToHistoryEntry(
  entry: SectionHistoryEntry,
  userMap: Map<string, string>,
  t: TFunction,
): HistoryEntryVM<SectionHistoryEntry> {
  const { icon, tone } = SECTION_ICON[entry.change_type] ?? SECTION_ICON.manual;
  return {
    id: entry.id,
    icon,
    tone,
    typeLabel: t(`history.changeType.${entry.change_type}`),
    context: entry.user_instruction,
    authorName: authorLabel(entry.created_by, userMap, t),
    createdAt: entry.created_at,
    raw: entry,
  };
}

// ── Ciclo de vida ────────────────────────────────────────────────────────

const LIFECYCLE_ICON: Record<ExecutionEvent["event_type"], { icon: HistoryEntryVM["icon"]; tone: HistoryTone }> = {
  step_completed: { icon: CheckCircle2, tone: "green" },
  advanced: { icon: ArrowRightCircle, tone: "blue" },
  auto_advanced: { icon: ArrowRightCircle, tone: "blue" },
  rejected: { icon: Undo2, tone: "red" },
  restored: { icon: RotateCcw, tone: "amber" },
};

export function lifecycleEventToHistoryEntry(
  event: ExecutionEvent,
  userMap: Map<string, string>,
  t: TFunction,
): HistoryEntryVM<ExecutionEvent> {
  const { icon, tone } = LIFECYCLE_ICON[event.event_type] ?? { icon: ArrowRightCircle, tone: "slate" as HistoryTone };
  const stageLabel = event.step_type ? t(`lifecycle.stageLabels.${event.step_type}`, { defaultValue: event.step_type }) : null;
  const context = event.step_name
    ? [event.step_name, stageLabel].filter(Boolean).join(" · ")
    : event.from_state && event.to_state
      ? `${t(`lifecycle.stateLabels.${event.from_state}`, { defaultValue: event.from_state })} → ${t(`lifecycle.stateLabels.${event.to_state}`, { defaultValue: event.to_state })}`
      : null;

  return {
    id: event.id,
    icon,
    tone,
    typeLabel: t(`lifecycleHistory.eventType.${event.event_type}`, { defaultValue: event.event_type }),
    context,
    authorName: authorLabel(event.actor_user_id, userMap, t),
    createdAt: event.created_at,
    raw: event,
  };
}

// ── Cambios del activo ───────────────────────────────────────────────────

const CHANGES_ICON: Record<DocumentChangeLogEntry["change_type"], { icon: HistoryEntryVM["icon"]; tone: HistoryTone }> = {
  date_changed: { icon: CalendarClock, tone: "amber" },
  owner_changed: { icon: UserRound, tone: "violet" },
  lifecycle_state_changed: { icon: ArrowRightCircle, tone: "blue" },
  metadata_changed: { icon: Pencil, tone: "slate" },
};

export function changeLogEntryToHistoryEntry(
  entry: DocumentChangeLogEntry,
  userMap: Map<string, string>,
  t: TFunction,
): HistoryEntryVM<DocumentChangeLogEntry> {
  const { icon, tone } = CHANGES_ICON[entry.change_type];
  return {
    id: entry.id,
    icon,
    tone,
    typeLabel: t(`changeLog.changeType.${entry.change_type}`),
    context: t(`changeLog.fieldName.${entry.field_name}`, { defaultValue: humanizeFieldName(entry.field_name, t) }),
    authorName: authorLabel(entry.actor_user_id, userMap, t),
    createdAt: entry.created_at,
    raw: entry,
  };
}

// `field_name` de un custom field no tiene traducción en `changeLog.fieldName`
// — puede llegar como slug (`monto_estimado`) o como UUID. Nunca dejar el
// identificador crudo a la vista: separar snake_case, o caer a un fallback
// genérico si parece un id.
const UUIDISH = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

function humanizeFieldName(raw: string, t: TFunction): string {
  if (UUIDISH.test(raw) || (!/[_\s-]/.test(raw) && raw.length > 24)) {
    return t("changeLog.fieldNameFallback");
  }
  const text = raw.replace(/_id$/, "").split(/[_-]+/).filter(Boolean).join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ── Formateo de valores del tab Cambios ─────────────────────────────────
// Migrado verbatim de change-log-tab.tsx: el split de string (no `new
// Date()`) es intencional, evita el corrimiento de día por interpretación UTC.

export const DATE_FIELDS = new Set([
  "expiration_date",
  "estimated_publication_date",
  "review_date",
  "audit_date",
]);

export function formatDateValue(value: string): string {
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

// ── Dedup por id (load-more) ─────────────────────────────────────────────

/** Reemplaza en página 1, acumula deduplicando por `id` en el resto. */
export function accumulateById<T extends { id: string }>(prev: T[], incoming: T[], isFirstPage: boolean): T[] {
  if (isFirstPage) return incoming;
  const seen = new Set(prev.map((e) => e.id));
  return [...prev, ...incoming.filter((e) => !seen.has(e.id))];
}
