import { Check, ChevronDown, ChevronRight, Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { cn, parseApiDate } from "@/lib/utils";
import { lifecycleStateDot } from "@/lib/lifecycle-colors";
import { isLifecycleState } from "@/lib/lifecycle-access";
import type { ExecutionLifecycleState } from "@/types/execution";
import { formatAbsoluteDate } from "@/lib/format-relative-time";
import { getExecutionDisplayLabel } from "./utils/version-utils";

interface VersionExecution {
  id: string;
  created_at: string;
  name: string;
  status: string;
  lifecycle_state?: string | null;
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
  /** When provided, a rename action appears in the menu footer for the selected draft version */
  onRenameVersion?: (execution: { id: string; name: string }) => void;
  dropdownAlign?: "start" | "end";
  /** Se conserva por compatibilidad con los callers; el estado de cada versión sale de `execution.lifecycle_state`. */
  isLatest?: boolean;
  /** false para ocultar el botón "+" embebido cuando la superficie ya ofrece uno propio (ej. header móvil). Default true. */
  showTriggerCreateButton?: boolean;
}

/** Estado de ciclo de vida de la versión; ausente o desconocido ⇒ borrador. */
function versionLifecycleState(state: string | null | undefined): ExecutionLifecycleState {
  return isLifecycleState(state) ? state : "draft";
}

function StatusDot({ state }: { state: ExecutionLifecycleState }) {
  return (
    <span
      className={cn("h-[7px] w-[7px] shrink-0 rounded-full", lifecycleStateDot(state))}
      aria-hidden="true"
    />
  );
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
  dropdownAlign = "start",
  showTriggerCreateButton = true,
}: VersionSelectorDropdownProps) {
  const { t } = useTranslation(["assets"]);

  const showCreateButton = !lifecyclePermissions || lifecyclePermissions.create;
  const targetId = selectedExecutionId || documentExecutionId;

  const sortedExecutions = [...allExecutions].sort(
    (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime()
  );
  const selectedExecution = allExecutions.find((exec) => exec.id === targetId);
  const selectedState = versionLifecycleState(selectedExecution?.lifecycle_state);

  const versionLabel = (() => {
    const label = getExecutionDisplayLabel(selectedExecution);
    if (label) return label.length > 20 ? `${label.substring(0, 20)}...` : label;
    const index = sortedExecutions.findIndex((exec) => exec.id === targetId);
    return index !== -1 ? `v${sortedExecutions.length - index}` : "v1";
  })();

  const statusLabel = (state: ExecutionLifecycleState) => t(`lifecycle.stateLabels.${state}`);

  const createBlocked = isCreatingPending || hasExecutionInProcess || !canGenerate;
  const createTitle =
    isCreatingPending || hasExecutionInProcess
      ? t("content.executionInProgress")
      : !canGenerate
        ? cannotGenerateReason || t("content.cannotGenerateVersion")
        : t("content.newVersion");

  // Renombrar solo aplica al borrador seleccionado y con las mismas reglas que tenía el lápiz por fila.
  const canRenameSelected =
    !!onRenameVersion &&
    !!selectedExecution &&
    selectedState === "draft" &&
    !!lifecyclePermissions?.create &&
    !!lifecyclePermissions?.edit &&
    !selectedExecution.version;

  return (
    <div className="flex h-8 items-stretch rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={t("content.switchVersion")}
            className="flex items-center gap-2 rounded-l-[7px] px-2.5 text-[13px] outline-none transition-colors hover:cursor-pointer hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40 data-[state=open]:bg-slate-50"
          >
            <StatusDot state={selectedState} />
            <span className="font-semibold text-slate-900">{versionLabel}</span>
            <span className="font-medium text-slate-500">{statusLabel(selectedState)}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={dropdownAlign} className="w-[300px] rounded-xl p-1.5">
          <div className="max-h-64 overflow-y-auto">
            {sortedExecutions.map((execution) => {
              const isSelected = targetId === execution.id;
              const state = versionLifecycleState(execution.lifecycle_state);
              const meta = [
                statusLabel(state),
                execution.created_at ? formatAbsoluteDate(execution.created_at) : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <DropdownMenuItem
                  key={execution.id}
                  className={cn(
                    "gap-2.5 rounded-[7px] px-2 py-1.5 hover:cursor-pointer",
                    isSelected && "bg-slate-50"
                  )}
                  onSelect={() => onSelectExecution(execution.id)}
                  aria-current={isSelected ? "true" : undefined}
                >
                  <StatusDot state={state} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-semibold text-slate-900">
                      {getExecutionDisplayLabel(execution)}
                    </span>
                    <span className="truncate text-[11.5px] text-slate-500">{meta}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />}
                </DropdownMenuItem>
              );
            })}
          </div>

          <div className="mt-1 flex items-center justify-between gap-2 border-t border-[#eef1f6] pt-1">
            {canRenameSelected ? (
              <DropdownMenuItem
                className="h-8 rounded-[7px] px-2 text-[12.5px] font-medium text-slate-600 hover:cursor-pointer"
                onSelect={() =>
                  onRenameVersion!({ id: selectedExecution!.id, name: selectedExecution!.name || "" })
                }
              >
                {t("content.renameVersion")}
              </DropdownMenuItem>
            ) : (
              <span />
            )}
            <DropdownMenuItem
              className="h-8 rounded-[7px] px-2 text-[12.5px] font-semibold text-blue-700 hover:cursor-pointer focus:text-blue-700"
              onSelect={() => setTimeout(() => onOpenVersionManagement(), 0)}
            >
              {t("content.manageVersions")}
              <ChevronRight className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {showCreateButton && showTriggerCreateButton && (
        <>
          <span className="w-px bg-slate-200" aria-hidden="true" />
          <HuemulButton
            size="sm"
            variant="ghost"
            onClick={onCreateExecution}
            disabled={createBlocked}
            aria-label={createTitle}
            className={cn(
              "h-full w-8 rounded-l-none rounded-r-[7px] p-0 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40",
              createBlocked
                ? "cursor-not-allowed text-slate-300 disabled:opacity-100"
                : "text-blue-600 hover:bg-slate-50 hover:text-blue-700"
            )}
            tooltip={createTitle}
          >
            {isCreatingPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </HuemulButton>
        </>
      )}
    </div>
  );
}
