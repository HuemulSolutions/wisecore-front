import { FormInput, Sparkles, PenLine, Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TFunction } from "i18next";
import type { SectionType } from "@/types/sections/core";
import type { HuemulOptionCard } from "@/types/huemul/option-card-group";

export interface SectionTypeMeta {
  value: SectionType;
  icon: LucideIcon;
  /** Color de acento (icono, check, texto del badge). */
  color: string;
  /** Fondo tenue del icono/badge y, seleccionada, de la tarjeta. */
  tint: string;
  /**
   * Nombre corto reusado en badges y en el título de la tarjeta del selector
   * ("Formulario", "Generada con IA", "Manual", "Referencia") — misma clave
   * que ya usa el estado vacío de la pestaña Estructura, para no duplicar el
   * texto (ver ia context/i18n-common-refactor-guide.md).
   */
  nameKey: string;
  /** Descripción breve para la tarjeta del selector de tipo del sheet de sección. */
  cardDescriptionKey: string;
}

export const SECTION_TYPE_ORDER: SectionType[] = ["form", "ai", "manual", "reference"];

/**
 * Fuente única de icono/color/nombre por tipo de sección — antes duplicada en
 * templates-section-card.tsx (TYPE_BADGE_STYLES), templates-empty-state.tsx
 * (SECTION_TYPES) y sections-form.tsx (opciones del selector).
 */
export const SECTION_TYPE_META: Record<SectionType, SectionTypeMeta> = {
  form: {
    value: "form",
    icon: FormInput,
    color: "#475569",
    tint: "#f1f4f7",
    nameKey: "templates:emptyState.typeFormName",
    cardDescriptionKey: "sections:form.sectionType.cardFormDescription",
  },
  ai: {
    value: "ai",
    icon: Sparkles,
    color: "#2563eb",
    tint: "#eff4ff",
    nameKey: "templates:emptyState.typeAiName",
    cardDescriptionKey: "sections:form.sectionType.cardAiDescription",
  },
  manual: {
    value: "manual",
    icon: PenLine,
    color: "#16a34a",
    tint: "#eefaf1",
    nameKey: "templates:emptyState.typeManualName",
    cardDescriptionKey: "sections:form.sectionType.cardManualDescription",
  },
  reference: {
    value: "reference",
    icon: Link2,
    color: "#7c3aed",
    tint: "#f4f0ff",
    nameKey: "templates:emptyState.typeReferenceName",
    cardDescriptionKey: "sections:form.sectionType.cardReferenceDescription",
  },
};

/**
 * Arma las 4 tarjetas del selector de tipo de sección. El caller debe tener
 * los namespaces 'sections' y 'templates' cargados en su useTranslation().
 */
export function sectionTypeCards(t: TFunction): HuemulOptionCard<SectionType>[] {
  return SECTION_TYPE_ORDER.map((type) => {
    const meta = SECTION_TYPE_META[type];
    return {
      value: meta.value,
      label: t(meta.nameKey),
      description: t(meta.cardDescriptionKey),
      icon: meta.icon,
      color: meta.color,
      tint: meta.tint,
    };
  });
}

/** Badge de tipo (nombre corto + colores) para filas/chips que referencian una sección. */
export function sectionTypeBadge(
  type: SectionType | undefined,
  t: TFunction,
): { label: string; color: string; tint: string } {
  const meta = SECTION_TYPE_META[type ?? "ai"];
  return { label: t(meta.nameKey), color: meta.color, tint: meta.tint };
}
