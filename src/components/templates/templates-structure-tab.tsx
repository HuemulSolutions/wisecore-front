import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FileText, RefreshCw, Sparkles } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { cn } from "@/lib/utils";
import { useTemplateLifecycleAccessMatrix } from "@/hooks/useTemplateSectionLifecycleAccess";
import { sectionHasOwnRules } from "@/lib/section-lifecycle-own-rules";
import { TemplateSectionsList } from "./templates-sections-list";
import { TemplateEmptyState } from "./templates-empty-state";
import type { TemplateStructureTabProps } from "@/types/templates";
export type { TemplateStructureTabProps } from "@/types/templates";

/**
 * Pestaña "Estructura": header dinámico ("N secciones, en este orden") +
 * lista/estado vacío. Extraída de templates-content.tsx (era el único de los
 * 3 tabs que seguía inline) — ver ia context/huemul-page-layout-guide.md.
 */
export function TemplateStructureTab({
  templateId,
  templateName,
  organizationId,
  documentTypeId,
  sections,
  isGenerating,
  onGenerateWithAI,
  onAddSection,
  onAddSectionWithType,
  onSectionsReorder,
  onImportStructure,
  onRefreshTemplate,
  isFetchingTemplate,
  canListSections,
  canCreateSection,
  canUpdateSection,
  canDeleteSection,
}: TemplateStructureTabProps) {
  const { t } = useTranslation(["templates", "common"]);
  const hasSections = sections.length > 0;

  // La matriz solo hace falta con secciones para mostrar (y solo si hay tipo
  // de activo vinculado) — sin eso, sectionHasOwnRulesFn siempre da `false`.
  const matrixEnabled = canListSections && !!documentTypeId && hasSections;
  const {
    accessBySection,
    roleAccessBySection,
    isFetching: isFetchingMatrix,
    refetchAll: refetchMatrix,
  } = useTemplateLifecycleAccessMatrix(organizationId, templateId, documentTypeId ?? "", matrixEnabled);

  const sectionHasOwnRulesFn = useCallback(
    (sectionId: string) => sectionHasOwnRules(accessBySection, roleAccessBySection, sectionId),
    [accessBySection, roleAccessBySection],
  );

  // Refresh agrupado: template + matriz de lifecycle access (ver
  // ia context/refresh-button-guide.md §1 — un solo botón por superficie).
  const handleRefresh = () => {
    onRefreshTemplate();
    if (matrixEnabled) refetchMatrix();
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pt-6 pb-4">
        {hasSections ? (
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-[#0f172a]">
              {t('templates:sectionsList.title', { count: sections.length })}
            </h2>
            <p className="text-[13px] text-[#64748b]">{t('templates:sectionsList.subtitle')}</p>
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <HuemulButton
            icon={RefreshCw}
            iconClassName="h-4 w-4 text-gray-600"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            loading={isFetchingTemplate || isFetchingMatrix}
            disabled={isGenerating}
            tooltip={t('common:refresh')}
            onClick={handleRefresh}
          />
          {hasSections && canCreateSection && (
            <>
              <HuemulButton
                icon={FileText}
                iconClassName="mr-1.5 h-3.5 w-3.5"
                label={t('templates:content.addSection')}
                size="sm"
                variant="outline"
                className="h-8 text-xs px-3"
                disabled={isGenerating}
                onClick={onAddSection}
              />
              <HuemulButton
                icon={Sparkles}
                iconClassName="mr-1.5 h-3.5 w-3.5"
                label={t('templates:content.generateWithAI')}
                size="sm"
                loading={isGenerating}
                className="h-8 rounded-lg border border-[#dbe6ff] bg-[#eff4ff] px-3 text-xs text-[#1d4ed8] hover:bg-[#e3ecff]"
                onClick={onGenerateWithAI}
              />
            </>
          )}
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto px-4", hasSections ? "py-6" : "pt-2 pb-6")}>
        {hasSections ? (
          <TemplateSectionsList
            sections={sections}
            templateId={templateId}
            templateName={templateName}
            organizationId={organizationId}
            onSectionsReorder={onSectionsReorder}
            canUpdate={canUpdateSection}
            canDelete={canDeleteSection}
            canCreate={canCreateSection}
            onAddSectionAtEnd={canCreateSection ? onAddSection : undefined}
            sectionHasOwnRulesFn={sectionHasOwnRulesFn}
          />
        ) : (
          <TemplateEmptyState
            isGenerating={isGenerating}
            canCreate={canCreateSection}
            onAddSectionWithType={onAddSectionWithType}
            onImportStructure={onImportStructure}
            onGenerateWithAI={onGenerateWithAI}
          />
        )}
      </div>
    </div>
  );
}
