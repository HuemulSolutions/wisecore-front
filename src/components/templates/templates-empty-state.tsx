import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_TYPE_ORDER, SECTION_TYPE_META } from "@/components/sections/section-type-meta";
import type { TemplateEmptyStateProps } from '@/types/templates';
export type { TemplateEmptyStateProps } from '@/types/templates';

// Icono/color por tipo salen de SECTION_TYPE_META (fuente única, ver
// section-type-meta.ts) — nombre/descripción/ejemplo son propios de este
// estado vacío (más largos que la tarjeta compacta del selector de tipo).
const SECTION_TYPES = SECTION_TYPE_ORDER.map((value) => ({
  ...SECTION_TYPE_META[value],
  descriptionKey: `emptyState.type${value[0].toUpperCase()}${value.slice(1)}Description`,
  exampleKey: `emptyState.type${value[0].toUpperCase()}${value.slice(1)}Example`,
}));

// Catálogo de los 4 tipos de sección: cada tarjeta es a la vez la
// explicación y el punto de entrada (crea la sección ya con ese tipo). Sin
// iconografía decorativa aparte de los íconos de tipo — ver
// ia context/diseno-rediseno-pantallas-guide.md.
export function TemplateEmptyState({
  isGenerating,
  onAddSectionWithType,
  onImportStructure,
  onGenerateWithAI,
  canCreate = false,
}: TemplateEmptyStateProps) {
  const { t } = useTranslation('templates');
  const disabled = !canCreate || isGenerating;

  return (
    <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-8">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-[17px] font-semibold text-[#0f172a]">
            {t('emptyState.title')}
          </h3>
          <p className="mt-2 max-w-155 text-pretty text-sm leading-[1.6] text-[#64748b]">
            {t('emptyState.description')}
          </p>
        </div>

        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {SECTION_TYPES.map((sectionType) => {
            const Icon = sectionType.icon;
            return (
              <button
                key={sectionType.value}
                type="button"
                disabled={disabled}
                onClick={() => onAddSectionWithType(sectionType.value)}
                className={cn(
                  "flex items-start gap-3.5 rounded-xl border border-[#e2e8f0] p-4.5 text-left transition-[box-shadow,border-color]",
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-[0_10px_26px_rgba(15,23,42,0.07)]",
                )}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = sectionType.color; }}
                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                <div
                  className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: sectionType.tint }}
                >
                  <Icon className="h-3.75 w-3.75" style={{ color: sectionType.color }} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[15px] font-semibold text-[#0f172a]">
                    {t(sectionType.nameKey)}
                  </span>
                  <span className="text-[13px] leading-normal text-[#64748b]">
                    {t(sectionType.descriptionKey)}
                  </span>
                  <span className="text-xs text-[#94a3b8]">
                    {t('emptyState.exampleLabel')} {t(sectionType.exampleKey)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {canCreate && (
          <div className="flex flex-col gap-4 border-t border-[#eef1f5] pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={disabled}
                onClick={onGenerateWithAI}
                className={cn(
                  "flex h-9.5 shrink-0 items-center gap-1.5 rounded-[9px] border border-[#dbe6ff] bg-[#eff4ff] px-3.5 text-[13px] font-medium text-[#1d4ed8]",
                  disabled ? "cursor-not-allowed opacity-60" : "hover:cursor-pointer hover:bg-[#e3ecff]",
                )}
              >
                <Sparkles className="h-3.75 w-3.75" />
                {t('emptyState.generateWithAiButton')}
              </button>
              <p className="text-[13px] text-[#64748b]">
                {t('emptyState.generateWithAiNote')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-[#64748b]">
                {t('emptyState.footerNote')}
              </p>
              <button
                type="button"
                onClick={onImportStructure}
                className="text-[13px] font-medium text-[#2563eb] hover:underline hover:cursor-pointer"
              >
                {t('emptyState.importStructureLink')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
