import { Check, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text";
import { cn } from "@/lib/utils";
import type { Dependency, DependencyVersionMode } from "@/types/dependency/sheets";
import type { ContextSourceRow, SourceRow } from "@/types/assets/sources";
import { SourcesVersionMenu } from "./sources-version-menu";

/** Columnas de la tabla en ancho normal: fuente · versión/detalle · acciones. */
export const SOURCES_GRID_COLUMNS = "minmax(0,1fr) 150px 72px";

interface SourceRowProps {
  row: SourceRow;
  narrow: boolean;
  canEdit: boolean;
  onEditText: (row: ContextSourceRow) => void;
  onReplaceFile: (row: ContextSourceRow) => void;
  onRemove: (row: SourceRow) => void;
  onChangeVersionMode: (dependency: Dependency, mode: DependencyVersionMode) => void;
}

const ACTION_BUTTON = "h-7 w-7 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500/40";

export function SourceRow({
  row,
  narrow,
  canEdit,
  onEditText,
  onReplaceFile,
  onRemove,
  onChangeVersionMode,
}: SourceRowProps) {
  const { t } = useTranslation("sources");
  const isContext = row.kind !== "asset";
  const pending = isContext && row.pending;

  // ── Meta bajo el nombre ──
  let meta = "";
  if (row.kind === "asset") {
    meta = [row.dependency.document_type?.name, row.dependency.section_name].filter(Boolean).join(" · ");
  } else if (row.kind === "file") {
    meta = t(`row.fileType.${row.fileType ?? "other"}`);
  } else {
    meta = t("row.characters", { count: row.characters });
  }

  // ── Columna versión / detalle ──
  const detail =
    row.kind === "asset" ? (
      <SourcesVersionMenu dependency={row.dependency} canEdit={canEdit} onSelectMode={onChangeVersionMode} />
    ) : (
      <span className="truncate text-[12.5px] text-slate-600">
        {row.kind === "file" ? t(`row.fileType.${row.fileType ?? "other"}`) : t("row.pastedText")}
      </span>
    );

  // ── Acciones: Editar / Reemplazar / Completar (según tipo) + Quitar ──
  const primaryActionLabel = pending
    ? t("row.complete")
    : row.kind === "file"
      ? t("row.replace")
      : t("row.edit");
  const actions = canEdit && (
    <div className="flex items-center justify-end gap-1">
      {isContext && (
        <HuemulButton
          variant="ghost"
          size="icon"
          icon={pending ? Check : row.kind === "file" ? RefreshCw : Pencil}
          iconClassName="h-3.5 w-3.5"
          aria-label={`${primaryActionLabel}: ${row.name}`}
          tooltip={primaryActionLabel}
          className={cn(ACTION_BUTTON, pending && "bg-blue-600 text-white hover:bg-blue-700 hover:text-white")}
          onClick={() => (row.kind === "file" ? onReplaceFile(row) : onEditText(row))}
        />
      )}
      <HuemulButton
        variant="ghost"
        size="icon"
        icon={Trash2}
        iconClassName="h-3.5 w-3.5"
        aria-label={`${t("row.remove")}: ${row.name}`}
        tooltip={t("row.remove")}
        className={cn(ACTION_BUTTON, "text-red-600 hover:bg-red-50 hover:text-red-700")}
        onClick={() => onRemove(row)}
      />
    </div>
  );

  const nameCell = (
    <div className="min-w-0">
      <div className="flex items-center gap-1">
        <HuemulTruncatedText text={row.name} className="text-sm font-medium text-slate-900" />
        {isContext && row.required && (
          <span className="shrink-0 font-semibold text-red-500" title={t("row.requiredMark")}>
            <span aria-hidden="true">*</span>
            <span className="sr-only">{t("row.requiredMark")}</span>
          </span>
        )}
      </div>
      {pending ? (
        <p className="truncate text-xs italic text-amber-700">{t("row.missingMeta")}</p>
      ) : (
        meta && <p className="truncate text-xs text-slate-400">{meta}</p>
      )}
    </div>
  );

  return (
    <div
      role="row"
      data-testid="source-row"
      data-pending={pending || undefined}
      className={cn(
        "border-t border-slate-100 py-2.5 pr-3.5 transition-colors",
        narrow ? "grid items-center gap-x-2 gap-y-1.5 pl-3.5" : "grid min-h-[52px] items-center gap-x-3 pl-9",
        pending ? "bg-[#fffdf5] hover:bg-[#fff9e6]" : "hover:bg-slate-50"
      )}
      style={
        narrow
          ? {
              gridTemplateColumns: "minmax(0,1fr) auto",
              gridTemplateAreas: '"name act" "ver ver"',
            }
          : { gridTemplateColumns: SOURCES_GRID_COLUMNS }
      }
    >
      <div role="cell" style={narrow ? { gridArea: "name" } : undefined} className="min-w-0">
        {nameCell}
      </div>
      <div role="cell" style={narrow ? { gridArea: "ver" } : undefined} className="min-w-0">
        {detail}
      </div>
      <div role="cell" style={narrow ? { gridArea: "act" } : undefined}>
        {actions}
      </div>
    </div>
  );
}
