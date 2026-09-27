import type {
  Dependency,
  FieldDependencyCondition,
  SectionFormField,
} from "@/types/sections/core";

/**
 * Sección de plantilla tal como llega en `getTemplateById` (`template.sections`).
 * Solo se declaran los campos que participan del PUT.
 */
export interface TemplateSectionSnapshot {
  id: string;
  name: string;
  type?: "ai" | "manual" | "reference" | "form";
  order?: number;
  prompt?: string;
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
  dependencies?: Dependency[];
  form_fields?: SectionFormField[];
}

export interface TemplateSectionUpdatePayload {
  name: string;
  type?: "ai" | "manual" | "reference" | "form";
  order?: number;
  prompt?: string;
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: string;
  reference_execution_id?: string;
  dependencies?: string[];
  form_fields?: SectionFormField[];
  propagate_to_sections?: boolean;
  depends_on: FieldDependencyCondition[];
  show_when_inactive: boolean;
}

/**
 * Arma el body de `PUT /template_section/{id}` para editar SOLO la dependencia
 * condicional de la sección (`depends_on`/`show_when_inactive`) desde una superficie
 * que no es el formulario de sección — hoy el bloque "Condiciones" de la pestaña
 * Plantillas en la configuración de un tipo de activo.
 *
 * El endpoint NO soporta un PUT parcial: mandar solo `name` + `depends_on` responde
 * 500 (y antes, sin `name`, 422). Por eso se replica el payload completo que ya arma
 * `sections-form.tsx` en modo edit — el único camino probado — reenviando los valores
 * actuales de la sección tal como vinieron del GET del template.
 */
export function buildTemplateSectionUpdatePayload(
  section: TemplateSectionSnapshot,
  overrides: {
    depends_on: FieldDependencyCondition[];
    show_when_inactive: boolean;
  },
): TemplateSectionUpdatePayload {
  const payload: TemplateSectionUpdatePayload = {
    name: section.name,
    // `order` real del backend: nunca un índice fabricado, o el PUT reescribiría
    // el orden de la plantilla como efecto colateral de guardar una condición.
    ...(section.order !== undefined ? { order: section.order } : {}),
    ...(section.type ? { type: section.type } : {}),
    // Paridad con sections-form.tsx (isTemplateSection): esta superficie no propaga.
    propagate_to_sections: false,
    // Se envían siempre, también vacíos: el backend conserva el valor previo si las
    // claves no viajan (ver ia context/dependencias-condicionales-formularios-guide.md §3.2).
    depends_on: overrides.depends_on,
    show_when_inactive: overrides.show_when_inactive,
  };

  switch (section.type) {
    case "ai":
      payload.prompt = section.prompt ?? "";
      payload.dependencies = (section.dependencies ?? []).map((dep) => dep.id);
      break;
    case "manual":
      if (section.manual_input) payload.manual_input = section.manual_input;
      break;
    case "reference":
      if (section.reference_section_id) payload.reference_section_id = section.reference_section_id;
      if (section.reference_mode) payload.reference_mode = section.reference_mode;
      if (section.reference_mode === "specific" && section.reference_execution_id) {
        payload.reference_execution_id = section.reference_execution_id;
      }
      break;
    case "form":
      if (section.form_fields) payload.form_fields = section.form_fields;
      break;
  }

  return payload;
}
