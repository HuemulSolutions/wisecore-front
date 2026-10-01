import { describe, expect, it } from "vitest";
import { resolveSectionCardState } from "@/components/workflow/workflow-section-card-state";
import type { ContentSection } from "@/types/assets";
import type { FormFieldValue } from "@/types/sections/core";

const field = (id: string, required: boolean, value: unknown): FormFieldValue => ({
  id,
  section_form_id: `sf-${id}`,
  field_name: `Campo ${id}`,
  question_type: "respuesta_corta",
  required,
  order: Number(id),
  value,
});

function makeSection(
  fields: FormFieldValue[],
  extra: Partial<ContentSection> = {},
): ContentSection {
  return { id: "s1", section_type: "form", form_fields: fields, ...extra } as ContentSection;
}

describe("resolveSectionCardState — mensaje de estado", () => {
  it("nada respondido: solo indica las obligatorias pendientes", () => {
    const section = makeSection([field("1", true, null), field("2", true, null), field("3", false, null)], {
      answers_status: "pending",
      missing_required: 2,
    });
    const state = resolveSectionCardState(section, true);
    expect(state.statusTone).toBe("danger");
    expect(state.statusParts).toEqual([{ key: "summary.card.requiredPending", params: { count: 2 } }]);
  });

  it("alguna obligatoria respondida y otras pendientes: indica ambas cantidades", () => {
    const section = makeSection([field("1", true, "a"), field("2", true, null), field("3", true, null)], {
      answers_status: "pending",
      missing_required: 2,
    });
    const state = resolveSectionCardState(section, true);
    expect(state.statusTone).toBe("danger");
    expect(state.statusParts).toEqual([
      { key: "summary.card.requiredAnswered", params: { count: 1 } },
      { key: "summary.card.pendingShort", params: { count: 2 } },
    ]);
  });

  it("obligatorias completas con opcionales pendientes: respondidas + opcionales sin responder", () => {
    const section = makeSection([field("1", true, "a"), field("2", false, null), field("3", false, null)], {
      answers_status: "completed",
      missing_required: 0,
    });
    const state = resolveSectionCardState(section, true);
    expect(state.statusTone).toBe("muted");
    expect(state.statusParts).toEqual([
      { key: "summary.card.requiredAnswered", params: { count: 1 } },
      { key: "summary.card.optionalPending", params: { count: 2 } },
    ]);
  });

  it("completa sin obligatorias y con opcionales pendientes: solo opcionales sin responder", () => {
    const section = makeSection([field("1", false, "a"), field("2", false, null)], {
      answers_status: "completed",
    });
    const state = resolveSectionCardState(section, true);
    expect(state.statusParts).toEqual([{ key: "summary.card.optionalPending", params: { count: 1 } }]);
  });

  it("todo respondido (obligatorias y opcionales): nada pendiente", () => {
    const section = makeSection([field("1", true, "a"), field("2", false, "b")], {
      answers_status: "completed",
    });
    const state = resolveSectionCardState(section, true);
    expect(state.statusTone).toBe("success");
    expect(state.statusParts).toEqual([{ key: "summary.card.allDone" }]);
  });

  it("sin obligatorias y aún pendiente: opcionales sin responder", () => {
    const section = makeSection([field("1", false, null), field("2", false, null)], {
      answers_status: "pending",
      missing_required: 2,
    });
    const state = resolveSectionCardState(section, true);
    expect(state.tone).toBe("info");
    expect(state.statusParts).toEqual([{ key: "summary.card.optionalPending", params: { count: 2 } }]);
  });

  it("faltan obligatorias pero el usuario no puede responder: aviso de pendiente de otros", () => {
    const section = makeSection([field("1", true, null)], { answers_status: "pending", missing_required: 1 });
    const state = resolveSectionCardState(section, false);
    expect(state.statusParts).toEqual([{ key: "summary.card.pendingOthers" }]);
    expect(state.action.kind).toBe("view");
  });

  it("sección inactiva por depends_on: aviso de inactiva", () => {
    const section = makeSection([field("1", true, null)], { is_visible: false });
    const state = resolveSectionCardState(section, true);
    expect(state.isInactive).toBe(true);
    expect(state.statusParts).toEqual([{ key: "summary.card.inactive" }]);
  });
});
