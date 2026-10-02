import { FileText, Link2, Type, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Dependency, DependencyVersionMode } from "@/types/dependency/sheets";
import type { ContextSourceRow, SourceGroups, SourceRow as SourceRowType, SourceUpload } from "@/types/assets/sources";
import { SOURCES_GRID_COLUMNS, SourceRow } from "./source-row";
import { SourcesUploadRow } from "./sources-upload-row";

interface SourcesTableProps {
  groups: SourceGroups;
  uploads: SourceUpload[];
  narrow: boolean;
  canEdit: boolean;
  onEditText: (row: ContextSourceRow) => void;
  onReplaceFile: (row: ContextSourceRow) => void;
  onRemove: (row: SourceRowType) => void;
  onChangeVersionMode: (dependency: Dependency, mode: DependencyVersionMode) => void;
  onCancelUpload: (id: string) => void;
}

function GroupHeader({
  icon: Icon,
  title,
  count,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
  hint: string;
}) {
  return (
    <div
      role="row"
      className="flex h-[34px] items-center gap-2 border-t border-slate-100 bg-[#fcfdfe] pr-3.5 pl-3.5"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
      <div role="rowheader" className="flex min-w-0 items-baseline gap-1.5">
        <span className="shrink-0 text-[12.5px] font-semibold text-slate-900">{title}</span>
        <span className="shrink-0 text-xs text-slate-400">{count}</span>
        <span className="truncate text-xs text-slate-400">· {hint}</span>
      </div>
    </div>
  );
}

/** Tabla agrupada de fuentes: activos vinculados, archivos y textos (solo los grupos con ítems). */
export function SourcesTable({
  groups,
  uploads,
  narrow,
  canEdit,
  onEditText,
  onReplaceFile,
  onRemove,
  onChangeVersionMode,
  onCancelUpload,
}: SourcesTableProps) {
  const { t } = useTranslation("sources");

  const rowProps = { narrow, canEdit, onEditText, onReplaceFile, onRemove, onChangeVersionMode };
  const showFiles = groups.files.length > 0 || uploads.length > 0;

  return (
    <div role="table" aria-label={t("sheet.title")} className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
      {!narrow && (
        <div
          role="row"
          className="grid h-9 items-center gap-x-3 bg-slate-50 pr-3.5 pl-9 text-xs font-semibold text-slate-500"
          style={{ gridTemplateColumns: SOURCES_GRID_COLUMNS }}
        >
          <span role="columnheader">{t("table.columnSource")}</span>
          <span role="columnheader">{t("table.columnVersion")}</span>
          <span role="columnheader" aria-hidden="true" />
        </div>
      )}

      {groups.assets.length > 0 && (
        <div role="rowgroup">
          <GroupHeader
            icon={Link2}
            title={t("table.groups.assets.title")}
            count={groups.assets.length}
            hint={t("table.groups.assets.hint")}
          />
          {groups.assets.map((row) => (
            <SourceRow key={row.key} row={row} {...rowProps} />
          ))}
        </div>
      )}

      {showFiles && (
        <div role="rowgroup">
          <GroupHeader
            icon={FileText}
            title={t("table.groups.files.title")}
            count={groups.files.length + uploads.length}
            hint={t("table.groups.files.hint")}
          />
          {groups.files.map((row) => (
            <SourceRow key={row.key} row={row} {...rowProps} />
          ))}
          {uploads.map((upload) => (
            <SourcesUploadRow key={upload.id} upload={upload} narrow={narrow} onCancel={onCancelUpload} />
          ))}
        </div>
      )}

      {groups.texts.length > 0 && (
        <div role="rowgroup">
          <GroupHeader
            icon={Type}
            title={t("table.groups.texts.title")}
            count={groups.texts.length}
            hint={t("table.groups.texts.hint")}
          />
          {groups.texts.map((row) => (
            <SourceRow key={row.key} row={row} {...rowProps} />
          ))}
        </div>
      )}
    </div>
  );
}
