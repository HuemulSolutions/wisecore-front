import type { LifecycleStatus } from "@/types/assets";
import type { WorkflowItem } from "@/types/workflow";

/** Etapa que muestra la píldora del ciclo de vida cuando la fila no tiene paso vigente. */
const STAGE_BY_STATE: Record<string, string> = {
  draft: "edit",
  in_review: "review",
  in_approval: "approve",
};

/**
 * Etapa + grupo de una fila del listado, con la forma que consume `HuemulLifecycleStageBadge`
 * (la misma píldora «Etapa · grupo» del panel de detalle). Con paso vigente, la etapa es su
 * `step_type` y el grupo su `step_name`; sin paso (aprobado, publicado, archivado o sin ejecución
 * todavía) la etapa sale de `lifecycle_state`.
 */
export function workflowStageOf(
  item: Pick<WorkflowItem, "lifecycle_state" | "current_lifecycle_step">,
): Pick<LifecycleStatus, "stage" | "current_group"> {
  const step = item.current_lifecycle_step;
  if (step) return { stage: step.step_type, current_group: step.step_name };
  return { stage: STAGE_BY_STATE[item.lifecycle_state] ?? item.lifecycle_state, current_group: null };
}
