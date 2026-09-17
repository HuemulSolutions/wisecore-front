import { useTranslation } from "react-i18next";
import { HuemulContextStrip } from "@/huemul/components/huemul-context-strip";
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge";
import { HuemulField } from "@/huemul/components/huemul-field";
import { isLifecycleState } from "@/lib/lifecycle-access";
import { formatHistoryDateTime } from "@/lib/format-history-date";
import { getExecutionDisplayLabel } from "@/components/assets/content/utils/version-utils";
import type { HistoryEntryVM, ExecutionSummary } from "@/types/assets";
import type { ExecutionEvent } from "@/types/execution-lifecycle";

/** Franja de resumen del tab "Ciclo de vida": estado actual / etapa / desde, derivados del evento más reciente, + selector de versión. */
export function HistoryLifecycleSummary({
  latestEvent,
  executions,
  viewExecutionId,
  onExecutionChange,
}: {
  latestEvent: HistoryEntryVM<ExecutionEvent> | undefined;
  executions: ExecutionSummary[];
  viewExecutionId: string;
  onExecutionChange: (id: string) => void;
}) {
  const { t } = useTranslation(["assets", "common"]);

  if (!latestEvent) return null;
  const { raw } = latestEvent;
  const currentState = raw.to_state ?? raw.from_state;

  return (
    <HuemulContextStrip
      blocks={[
        {
          key: "state",
          label: t("assetHistory.summaryCurrentState"),
          content: isLifecycleState(currentState) ? (
            <HuemulLifecycleBadge state={currentState} />
          ) : (
            <span className="text-[12.5px] text-[#475569]">{currentState ?? "—"}</span>
          ),
        },
        {
          key: "stage",
          label: t("assetHistory.summaryStage"),
          content: <span className="text-[12.5px] text-[#475569]">{raw.step_name ?? "—"}</span>,
        },
        {
          key: "since",
          label: t("assetHistory.summarySince"),
          content: <span className="text-[12.5px] text-[#475569]">{formatHistoryDateTime(latestEvent.createdAt)}</span>,
        },
        ...(executions.length > 1
          ? [
              {
                key: "version",
                label: t("lifecycleHistory.selectVersion"),
                grow: true,
                content: (
                  <div className="w-36">
                    <HuemulField
                      type="select"
                      selectSize="sm"
                      value={viewExecutionId}
                      onChange={(val) => onExecutionChange(String(val))}
                      options={executions.map((exec, index) => ({
                        value: exec.id,
                        label: getExecutionDisplayLabel(exec) || t("versionManagement.versionFallback", { number: executions.length - index }),
                      }))}
                    />
                  </div>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
