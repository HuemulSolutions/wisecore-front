import { describe, expect, it } from "vitest";
import { workflowStageOf } from "@/components/workflow/workflow-lifecycle-stage";
import type { WorkflowItem } from "@/types/workflow";

type Row = Pick<WorkflowItem, "lifecycle_state" | "current_lifecycle_step">;

describe("workflowStageOf", () => {
  it("con paso vigente usa su tipo como etapa y su nombre como grupo", () => {
    const row: Row = {
      lifecycle_state: "draft",
      current_lifecycle_step: { step_id: "st-1", step_type: "edit", step_name: "Edit" },
    };
    expect(workflowStageOf(row)).toEqual({ stage: "edit", current_group: "Edit" });
  });

  it("con paso sin nombre deja el grupo en null", () => {
    const row: Row = {
      lifecycle_state: "in_review",
      current_lifecycle_step: { step_id: "st-2", step_type: "review", step_name: null },
    };
    expect(workflowStageOf(row)).toEqual({ stage: "review", current_group: null });
  });

  it.each([
    ["draft", "edit"],
    ["in_review", "review"],
    ["in_approval", "approve"],
    ["approved", "approved"],
    ["published", "published"],
    ["archived", "archived"],
  ] as const)("sin paso, el estado %s se muestra como etapa %s", (state, stage) => {
    expect(workflowStageOf({ lifecycle_state: state, current_lifecycle_step: null })).toEqual({
      stage,
      current_group: null,
    });
  });
});
