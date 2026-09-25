import type { TFunction } from "i18next"
import type { Dependency, SectionFormField, SortableSectionItem } from "@/types/sections/core"

const ELLIPSIS = "…"

/** Corta `text` a `maxLen` caracteres, agregando "…". Vacío/`null` → `null`. */
export function truncate(text: string | null | undefined, maxLen: number): string | null {
  if (!text) return null
  const trimmed = text.trim()
  if (!trimmed) return null
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}${ELLIPSIS}` : trimmed
}

/** Primeras `limit` preguntas de una sección tipo formulario, para los chips de resumen. */
export function formFieldChips(fields: SectionFormField[] | undefined, limit = 5): SectionFormField[] {
  return (fields ?? []).slice(0, limit)
}

export interface DependencyContextItem {
  id: string
  position: number
  name: string
}

/**
 * Datos por chip de "usa como contexto": posición 1-based de la dependencia
 * DENTRO de la lista actual (el mismo número que ve el usuario en el círculo
 * de orden de esa fila, no el `order` crudo del backend).
 */
export function dependencyContextItems(
  dependencies: Dependency[] | undefined,
  sections: SortableSectionItem[],
): DependencyContextItem[] {
  if (!dependencies?.length) return []
  const indexById = new Map(sections.map((s, i) => [s.id, i + 1]))
  return dependencies.map((d) => ({ id: d.id, position: indexById.get(d.id) ?? 0, name: d.name }))
}

/**
 * Resumen de una línea por tipo de sección, ya traducido (`templates:sectionsList.*`).
 *
 * Para `reference`: el backend solo manda el nombre de la sección referenciada
 * (`reference_section_name`) y, en modo específico, el de la ejecución
 * (`reference_execution_name`) — no hay ningún campo con el nombre del
 * documento/activo de origen, así que el resumen no lo menciona (evita
 * inventar un dato que no existe).
 */
export function summarizeTemplateSection(section: SortableSectionItem, t: TFunction): string {
  switch (section.type) {
    case "form": {
      const count = section.form_fields?.length ?? 0
      return t("templates:sectionsList.summaryForm", { count })
    }
    case "manual": {
      const excerpt = truncate(section.manual_input, 90)
      return excerpt
        ? t("templates:sectionsList.summaryManual", { excerpt })
        : t("templates:sectionsList.summaryManualEmpty")
    }
    case "reference": {
      const sectionName = section.reference_section_name
      if (!sectionName) return t("templates:sectionsList.summaryReferenceUnknown")
      // Sin el nombre de la ejecución no hay forma de mostrar una versión fija
      // identificable — cae a la lectura de "siempre la última" en vez de
      // inventar un placeholder.
      if (section.reference_mode === "specific" && section.reference_execution_name) {
        return t("templates:sectionsList.summaryReferenceVersionNoOrigin", {
          section: sectionName,
          version: section.reference_execution_name,
        })
      }
      return t("templates:sectionsList.summaryReferenceLatestNoOrigin", { section: sectionName })
    }
    case "ai":
    default: {
      const excerpt = truncate(section.prompt, 110)
      return excerpt
        ? t("templates:sectionsList.summaryAi", { excerpt })
        : t("templates:sectionsList.summaryAiEmpty")
    }
  }
}
