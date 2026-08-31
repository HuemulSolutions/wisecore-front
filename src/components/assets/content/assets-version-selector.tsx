import { Loader2, Plus, ChevronDown, Pencil, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { parseApiDate } from "@/lib/utils";
import { formatAbsoluteDate } from "@/lib/format-relative-time";
import { getExecutionDisplayLabel } from "./utils/version-utils";

interface VersionExecution {
  id: string;
  created_at: string;
  name: string;
  status: string;
  version?: string | null;
  created_by_user?: { name: string; last_name: string } | null;
}

interface VersionSelectorDropdownProps {
  allExecutions: VersionExecution[];
  selectedExecutionId: string | null | undefined;
  /** Fallback execution id from documentContent (used to highlight selected item) */
  documentExecutionId?: string;
  lifecyclePermissions: { create?: boolean; edit?: boolean } | undefined;
  isCreatingPending: boolean;
  hasExecutionInProcess: boolean;
  /** false cuando el backend reporta can_generate=false en /content. Ausente/true = sin restricción. */
  canGenerate?: boolean;
  /** Motivo ya traducido, para el tooltip. Solo relevante si canGenerate === false. */
  cannotGenerateReason?: string;
  onCreateExecution: () => void;
  onSelectExecution: (executionId: string) => void;
  onOpenVersionManagement: () => void;
  /** When provided, a rename button appears on each version item */
  onRenameVersion?: (execution: { id: string; name: string }) => void;
  dropdownAlign?: "start" | "end";
  /** true cuando la versión seleccionada es la más reciente — reemplaza al chip "Último" con un punto verde en el trigger. */
  isLatest?: boolean;
  /** false para ocultar el botón "+" embebido en el trigger cuando la superficie ya ofrece uno propio (ej. header móvil). Default true. */
  showTriggerCreateButton?: boolean;
}

/** Línea de metadatos "fecha · autor" de una versión, omitiendo lo que no venga del backend. */
function metaLine(execution: VersionExecution): string {
  const parts = [
    execution.created_at ? formatAbsoluteDate(execution.created_at) : null,
    execution.created_by_user
      ? `${execution.created_by_user.name} ${execution.created_by_user.last_name}`.trim()
      : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function VersionSelectorDropdown({
  allExecutions,
  selectedExecutionId,
  documentExecutionId,
  lifecyclePermissions,
  isCreatingPending,
  hasExecutionInProcess,
  canGenerate = true,
  cannotGenerateReason,
  onCreateExecution,
  onSelectExecution,
  onOpenVersionManagement,
  onRenameVersion,
  dropdownAlign = "end",
  isLatest = false,
  showTriggerCreateButton = true,
}: VersionSelectorDropdownProps) {
  const { t } = useTranslation(["assets"]);

  const showCreateButton = !lifecyclePermissions || lifecyclePermissions.create;
  const targetId = selectedExecutionId || documentExecutionId;

  const versionLabel = (() => {
    if (!allExecutions) return "v1";
    const selectedExecution = allExecutions.find((exec) => exec.id === targetId);
    const label = getExecutionDisplayLabel(selectedExecution);
    if (label) return label.length > 20 ? `${label.substring(0, 20)}...` : label;
    const sorted = [...allExecutions].sort(
      (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
    );
    const index = sorted.findIndex((exec) => exec.id === targetId);
    return index !== -1 ? `v${sorted.length - index}` : "v1";
  })();

  const sortedExecutions = [...allExecutions].sort(
    (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
  );

  return (
    <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
      {showCreateButton && showTriggerCreateButton && (
        <HuemulButton
          size="sm"
          variant="ghost"
          onClick={onCreateExecution}
          disabled={isCreatingPending || hasExecutionInProcess || !canGenerate}
          className={`h-7 w-7 p-0 rounded-r-none transition-colors ${
            isCreatingPending || hasExecutionInProcess || !canGenerate
              ? "text-gray-400 cursor-not-allowed"
              : "text-[#4464f7] hover:bg-gray-200 hover:text-[#3451e6] hover:cursor-pointer"
          }`}
          tooltip={
            isCreatingPending || hasExecutionInProcess
              ? t("content.cannotExecuteInProgress")
              : !canGenerate
                ? cannotGenerateReason
                : t("content.executeNewVersion")
          }
        >
          {isCreatingPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </HuemulButton>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <HuemulButton
            size="sm"
            variant="ghost"
            className={`h-7 px-2.5 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors text-xs font-medium hover:cursor-pointer flex items-center gap-1.5 ${
              showCreateButton && showTriggerCreateButton ? "rounded-l-none" : ""
            }`}
            tooltip={t("content.switchVersion")}
          >
            {isLatest && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"
                title={t("content.latest")}
              />
            )}
            <span className="font-medium">{versionLabel}</span>
            <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
          </HuemulButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={dropdownAlign} className="w-80">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{t("content.documentVersions")}</p>
            <p className="text-xs text-gray-500">
              {isLatest ? t("content.viewingLatest") : t("content.viewingOlderVersion")}
            </p>
          </div>

          <div className="overflow-y-auto max-h-64">
            {sortedExecutions.map((execution, index) => {
              const isSelected = targetId === execution.id;
              const isApproved = execution.status === "approved";
              const isLatestItem = index === 0;
              const displayName = getExecutionDisplayLabel(execution);
              const canRename =
                !!onRenameVersion &&
                !!lifecyclePermissions?.create &&
                !!lifecyclePermissions?.edit &&
                !execution.version;

              return (
                <DropdownMenuItem
                  key={execution.id}
                  className={`hover:cursor-pointer px-2.5 py-2 transition-colors ${
                    isSelected ? "bg-blue-50 border-l-2 border-[#4464f7]" : "hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectExecution(execution.id)}
                >
                  <div className="flex items-start justify-between w-full gap-2 min-w-0">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isSelected ? "text-[#4464f7]" : "text-gray-900"
                          }`}
                        >
                          {displayName}
                        </span>
                        {isLatestItem && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-green-600 shrink-0">
                            {t("content.latest")}
                          </span>
                        )}
                        {isApproved && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-600 shrink-0">
                            {t("content.approved")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 truncate">{metaLine(execution)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canRename && (
                        <button
                          className="p-1 rounded hover:bg-gray-200 hover:cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                          title={t("content.renameVersion")}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameVersion!({ id: execution.id, name: execution.name || "" });
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isSelected && (
                        <span className="text-xs font-medium text-gray-500">
                          {t("content.viewVersion")}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator />
          <div className="flex items-center gap-2 p-1">
            {showCreateButton && (
              <DropdownMenuItem
                className="flex-1 justify-center border border-gray-200 rounded-md py-1.5 text-[#4464f7] hover:bg-blue-50 hover:text-[#3451e6] hover:cursor-pointer"
                onSelect={() => setTimeout(() => onCreateExecution(), 0)}
                disabled={isCreatingPending || hasExecutionInProcess || !canGenerate}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{t("content.newVersion")}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="shrink-0 text-gray-600 hover:bg-gray-50 hover:cursor-pointer"
              onSelect={() => setTimeout(() => onOpenVersionManagement(), 0)}
            >
              <Settings2 className="h-4 w-4" />
              <span className="text-xs font-medium">{t("content.manage")}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
