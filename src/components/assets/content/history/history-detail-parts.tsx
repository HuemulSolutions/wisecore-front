import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { HistoryTone } from "@/types/assets";

// Piezas del panel derecho del tab "Contenido de la sección" (único tab que
// conserva el layout maestro-detalle ancho). No son huemul: conocen el
// vocabulario de historial (chip de tipo) — ver ia context/refactor-file-guide.md §1.

const TONE_PILL_CLASS: Record<HistoryTone, string> = {
  blue: "bg-[#eff5ff] text-[#2563eb]",
  violet: "bg-[#f3e8ff] text-[#7c3aed]",
  amber: "bg-[#fffbeb] text-[#b45309]",
  green: "bg-[#ecfdf3] text-[#15803d]",
  slate: "bg-[#f1f5f9] text-[#475569]",
  red: "bg-[#fef2f2] text-[#b91c1c]",
};

// ── Encabezado del panel derecho ────────────────────────────────────────────

export function HistoryDetailHeader({
  label,
  tone,
  createdAt,
  authorName,
}: {
  label: string;
  tone: HistoryTone;
  createdAt: string;
  authorName: string | null;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-[#e8ecf2] px-5 py-2.5">
      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium leading-5", TONE_PILL_CLASS[tone])}>
        {label}
      </span>
      {authorName && <span className="text-[11px] text-[#64748b]">{authorName}</span>}
      <span className="ml-auto shrink-0 text-[11px] text-[#64748b]">
        {formatRelativeTime(createdAt, { absolute: true, showTime: true })}
      </span>
    </div>
  );
}

// ── Bloque con label uppercase ──────────────────────────────────────────────

export function HistoryDetailBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-[#e8ecf2] px-5 py-3", className)}>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
      {children}
    </div>
  );
}
