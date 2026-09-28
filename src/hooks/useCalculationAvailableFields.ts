import { useQuery } from "@tanstack/react-query";
import { useEffectiveOrgId } from "@/hooks/useOrgRouter";
import { getSectionAvailableFields } from "@/services/section";
import { getTemplateSectionAvailableFields } from "@/services/template_section";
import type { CalculationPickerContext } from "@/types/sections/core";

export const calculationAvailableFieldsQueryKeys = {
  all: ["calculation-available-fields"] as const,
  byContext: (orgId: string, ctx: CalculationPickerContext) =>
    [...calculationAvailableFieldsQueryKeys.all, orgId, ctx.level, ctx.parentId, ctx.order, ctx.excludeSectionId ?? ""] as const,
};

// Picker `@` de campo_calculado_formula: campos numéricos de secciones anteriores, ya
// filtrados por el backend ("anterior" + "sin ambigüedad"). Catálogo de formulario, exento
// de botón de refresh. Sin contexto (builder montado fuera de una sección) no consulta.
export function useCalculationAvailableFields(context: CalculationPickerContext | undefined, enabled = true) {
  const orgId = useEffectiveOrgId();

  return useQuery({
    queryKey: context ? calculationAvailableFieldsQueryKeys.byContext(orgId, context) : calculationAvailableFieldsQueryKeys.all,
    queryFn: () =>
      context!.level === "template"
        ? getTemplateSectionAvailableFields(context!.parentId, context!.order, orgId, context!.excludeSectionId)
        : getSectionAvailableFields(context!.parentId, context!.order, orgId, context!.excludeSectionId),
    enabled: enabled && !!context?.parentId && orgId !== "_",
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  });
}
