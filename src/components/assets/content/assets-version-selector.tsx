import { Loader2, Plus, Clock, ChevronDown, CheckCircle, Eye, Pencil, Settings2 } from "lucide-react";
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
import { getExecutionDisplayLabel } from "./utils/version-utils";

interface VersionExecution {
  id: string;
  created_at: string;
  name: string;
  status: string;
  version?: string | null;
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
      {showCreateButton && (
        <HuemulButton
          size="sm"
          variant="ghost"
          onClick={onCreateExecution}
          disabled={isCreatingPending || hasExecutionInProcess || !canGenerate}
          className={`h-8 w-8 p-0 rounded-r-none transition-colors ${
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
            className={`h-8 px-2.5 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors text-xs font-medium hover:cursor-pointer flex items-center gap-1.5 ${
              showCreateButton ? "rounded-l-none" : ""
            }`}
            tooltip={t("content.switchVersion")}
          >
            
            <span className="font-medium">{versionLabel}</span>
            <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
          </HuemulButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={dropdownAlign} className="w-80">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-900">{t("content.documentVersions")}</p>
            <p className="text-xs text-gray-500">{t("content.selectVersion")}</p>
          </div>

          {showCreateButton && (
            <>
              <DropdownMenuItem
                className="hover:cursor-pointer p-2 gap-2 text-[#4464f7] hover:bg-blue-50 hover:text-[#3451e6]"
                onSelect={() => setTimeout(() => onCreateExecution(), 0)}
                disabled={isCreatingPending || hasExecutionInProcess || !canGenerate}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-[#4464f7]">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{t("content.newVersion")}</span>
                  <span className="text-xs text-gray-400">{t("content.createNewVersion")}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <div className="overflow-y-auto max-h-64">
            {sortedExecutions.map((execution, index) => {
              const isSelected = targetId === execution.id;
              const isApproved = execution.status === "approved";
              const isLatest = index === 0;
              const displayName = getExecutionDisplayLabel(execution);
              const canRename =
                !!onRenameVersion &&
                !!lifecyclePermissions?.create &&
                !!lifecyclePermissions?.edit &&
                !execution.version;

              return (
                <DropdownMenuItem
                  key={execution.id}
                  className={`hover:cursor-pointer p-2 transition-colors ${
                    isSelected ? "bg-blue-50 border-l-2 border-[#4464f7]" : "hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectExecution(execution.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? "text-[#4464f7]" : "text-gray-900"
                      }`}
                    >
                      {displayName}
                    </span>
                    <div className="flex items-center gap-1">
                      {canRename && (
                        <button
                          className="p-0.5 rounded hover:bg-gray-200 hover:cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                          title={t("content.renameVersion")}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameVersion!({ id: execution.id, name: execution.name || "" });
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {isLatest && (
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          {t("content.latest")}
                        </div>
                      )}
                      {isApproved && (
                        <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          {t("content.approved")}
                        </div>
                      )}
                      {isSelected && <Eye className="w-3 h-3 text-[#4464f7]" />}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="hover:cursor-pointer p-2 gap-2 text-gray-700 hover:bg-gray-50"
            onSelect={() => setTimeout(() => onOpenVersionManagement(), 0)}
          >
            <Settings2 className="h-4 w-4" />
            <span className="text-xs font-medium">{t("content.manageVersions")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
