import type { TFunction } from "i18next";
import type { HuemulFieldOptionGroup } from "@/types/huemul/field";
import type { QuestionType } from "@/types/question-types";
import { QUESTION_TYPE, questionTypeIcon, questionTypeLabel } from "./question-type-meta";

// Agrupación puramente visual del selector de tipo de pregunta (optgroups). No es
// lógica de dominio — question-type-meta.ts sigue siendo la única fuente de verdad de
// slugs/data_type/icono. Un slug del catálogo que no aparezca acá cae en el grupo "other".
export const QUESTION_TYPE_GROUP_ORDER = ["text", "numbers", "choice", "datetime", "files", "other"] as const;

export type QuestionTypeGroupKey = (typeof QUESTION_TYPE_GROUP_ORDER)[number];

export const QUESTION_TYPE_GROUPS: Record<QuestionTypeGroupKey, string[]> = {
  text: [QUESTION_TYPE.shortAnswer, QUESTION_TYPE.paragraph, QUESTION_TYPE.email],
  numbers: [
    QUESTION_TYPE.number,
    QUESTION_TYPE.decimal,
    QUESTION_TYPE.calculatedFormula,
    QUESTION_TYPE.calculatedConditional,
  ],
  choice: [
    QUESTION_TYPE.yesNo,
    QUESTION_TYPE.multipleChoice,
    QUESTION_TYPE.dropdown,
    QUESTION_TYPE.dropdownMultiple,
    QUESTION_TYPE.linearScale,
    QUESTION_TYPE.rating,
  ],
  datetime: [QUESTION_TYPE.date, QUESTION_TYPE.time],
  files: [QUESTION_TYPE.fileUpload, QUESTION_TYPE.customField],
  other: [QUESTION_TYPE.label],
};

export function questionTypeGroupOf(slug: string): QuestionTypeGroupKey {
  for (const key of QUESTION_TYPE_GROUP_ORDER) {
    if (QUESTION_TYPE_GROUPS[key].includes(slug)) return key;
  }
  return "other";
}

// Arma los optgroups del select de tipo de pregunta a partir del catálogo real
// (/question_types/) — solo agrupa/ordena visualmente, nunca inventa un slug.
export function buildGroupedQuestionTypeOptions(
  questionTypes: QuestionType[],
  t: TFunction,
): HuemulFieldOptionGroup[] {
  const bySlug = new Map(questionTypes.map((qt) => [qt.question_type, qt]));
  return QUESTION_TYPE_GROUP_ORDER.map((groupKey) => ({
    groupLabel: t(`form.formFields.builder.typeGroups.${groupKey}`),
    options: QUESTION_TYPE_GROUPS[groupKey]
      .filter((slug) => bySlug.has(slug))
      .map((slug) => ({
        value: slug,
        label: questionTypeLabel(slug, t),
        icon: questionTypeIcon(slug),
      })),
  })).filter((group) => group.options.length > 0);
}

// Descripción de 12px que se muestra debajo del select al elegir un tipo.
export function questionTypeDescription(slug: string, t: TFunction): string {
  return slug
    ? t(`form.formFields.builder.typeDescriptions.${slug}`, { defaultValue: "" })
    : "";
}
