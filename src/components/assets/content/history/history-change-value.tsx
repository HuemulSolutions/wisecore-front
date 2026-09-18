import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge";
import { isLifecycleState } from "@/lib/lifecycle-access";
import { DATE_FIELDS, formatDateValue } from "./history-entry-vm";
import type { DocumentChangeLogEntry } from "@/types/document-change-log";

const SHORT_VALUE_THRESHOLD = 40;

/**
 * Valor de una fila del tab "Cambios del activo": pastillas `antes → después`
 * para valores cortos, bloques `−`/`+` apilados para texto largo — nunca las
 * dos formas mezcladas, y sin diff a nivel de palabra en esta vista.
 */
export function HistoryChangeValue({ entry }: { entry: DocumentChangeLogEntry }) {
  const isLongText = (entry.old_value?.length ?? 0) > SHORT_VALUE_THRESHOLD || (entry.new_value?.length ?? 0) > SHORT_VALUE_THRESHOLD;

  if (isLongText) {
    return <StackedTextValue oldValue={entry.old_value} newValue={entry.new_value} />;
  }
  return <PillValue entry={entry} />;
}

function StackedTextValue({ oldValue, newValue }: { oldValue: string | null; newValue: string | null }) {
  return (
    <div className="flex flex-col gap-[5px]">
      {oldValue ? (
        <p className="whitespace-pre-wrap break-words rounded-[6px] bg-[#fef6f6] px-2.5 py-2 text-[12.5px] leading-relaxed text-[#475569]">
          <span className="mr-1 font-medium text-[#dc2626]">−</span>
          {oldValue}
        </p>
      ) : (
        <UnassignedPill tone="red" />
      )}
      {newValue ? (
        <p className="whitespace-pre-wrap break-words rounded-[6px] bg-[#f2fbf5] px-2.5 py-2 text-[12.5px] leading-relaxed text-[#475569]">
          <span className="mr-1 font-medium text-[#16a34a]">+</span>
          {newValue}
        </p>
      ) : (
        <UnassignedPill tone="green" />
      )}
    </div>
  );
}

function PillValue({ entry }: { entry: DocumentChangeLogEntry }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ValuePill fieldName={entry.field_name} value={entry.old_value} tone="red" />
      <span className="text-[11px] text-[#cbd5e1]">→</span>
      <ValuePill fieldName={entry.field_name} value={entry.new_value} tone="green" />
    </div>
  );
}

function ValuePill({ fieldName, value, tone }: { fieldName: string; value: string | null; tone: "red" | "green" }) {
  const { t } = useTranslation(["assets", "common"]);

  if (value === null) return <UnassignedPill tone={tone === "red" ? "red" : "green"} />;
  if (fieldName === "lifecycle_state" && isLifecycleState(value)) return <HuemulLifecycleBadge state={value} />;
  if (fieldName === "context_required") return <Pill tone={tone}>{value === "True" ? t("common:yes") : t("common:no")}</Pill>;
  if (DATE_FIELDS.has(fieldName)) return <Pill tone={tone}>{formatDateValue(value)}</Pill>;
  return <Pill tone={tone}>{value}</Pill>;
}

function UnassignedPill({ tone }: { tone: "red" | "green" }) {
  const { t } = useTranslation("assets");
  return <Pill tone={tone}>{t("changeLog.unassignedValue")}</Pill>;
}

function Pill({ tone, children }: { tone: "red" | "green"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs",
        tone === "red" ? "bg-[#fee2e2] font-medium text-[#b91c1c]" : "bg-[#dcfce7] font-semibold text-[#15803d]",
      )}
    >
      {children}
    </span>
  );
}
