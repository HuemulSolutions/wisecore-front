import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, RefreshCw, FileSliders, MessageSquareText, GitBranch, Paperclip, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { useCustomFieldTemplatesByTemplate } from "@/hooks/useCustomFieldTemplates";
import { useTemplateContexts } from "@/hooks/useTemplateContext";
import { useTemplateDependencies } from "@/hooks/useTemplateDependencies";
import { useMediaList } from "@/hooks/useMedia";
import { useDocxTemplatesForTemplate } from "@/hooks/useDocxTemplates";
import type { TemplateSettingsGroupsListProps, TemplateSettingsSection } from "@/types/templates";
export type { TemplateSettingsGroupsListProps } from "@/types/templates";

// Nivel 1 de la pestaña "Configuración": una tarjeta con una fila por grupo,
// contador real y chevron. El contador reusa los mismos hooks que ya usa
// cada componente real del grupo (sin endpoints nuevos) — para Campos
// personalizados y Dependencias el backend no expone `total`, así que se
// aproxima contando la página cargada (1000/100 ítems respectivamente, ver
// ia context/refresh-button-guide.md sobre no inventar estados de carga).
export function TemplateSettingsGroupsList({
  templateId,
  organizationId,
  canListCustomFields,
  canListTemplateContext,
  canListTemplateDependencies,
  canListMedia,
  canListDocx,
  onSelect,
  onCountsChange,
}: TemplateSettingsGroupsListProps) {
  const { t } = useTranslation(['templates']);

  const customFields = useCustomFieldTemplatesByTemplate(templateId, { enabled: canListCustomFields });
  const context = useTemplateContexts(organizationId, templateId, { enabled: canListTemplateContext });
  const dependencies = useTemplateDependencies(organizationId, templateId, { enabled: canListTemplateDependencies });
  const media = useMediaList(organizationId, "template", { enabled: canListMedia && !!templateId, parentId: templateId });
  const docx = useDocxTemplatesForTemplate(organizationId, templateId, { enabled: canListDocx });

  const counts = useMemo(() => ({
    "custom-fields": customFields.data?.data?.length ?? 0,
    context: context.data?.length ?? 0,
    dependencies: dependencies.data?.data?.length ?? 0,
    media: media.data?.total ?? 0,
    "docx-templates": docx.data?.data?.length ?? 0,
  }), [customFields.data, context.data, dependencies.data, media.data, docx.data]);

  const total = useMemo(
    () => (canListCustomFields ? counts["custom-fields"] : 0)
      + (canListTemplateContext ? counts.context : 0)
      + (canListTemplateDependencies ? counts.dependencies : 0)
      + (canListMedia ? counts.media : 0)
      + (canListDocx ? counts["docx-templates"] : 0),
    [counts, canListCustomFields, canListTemplateContext, canListTemplateDependencies, canListMedia, canListDocx],
  );

  useEffect(() => { onCountsChange?.(total); }, [total, onCountsChange]);

  const groups = useMemo(
    () => ([
      canListCustomFields && {
        key: "custom-fields" as TemplateSettingsSection,
        title: t('templates:content.customFieldsTab'),
        description: t('templates:settingsGroups.customFields.description'),
        icon: FileSliders,
        kind: "inUse" as const,
      },
      canListTemplateContext && {
        key: "context" as TemplateSettingsSection,
        title: t('templates:content.contextTab'),
        description: t('templates:settingsGroups.context.description'),
        icon: MessageSquareText,
        kind: "inUse" as const,
      },
      canListTemplateDependencies && {
        key: "dependencies" as TemplateSettingsSection,
        title: t('templates:content.dependenciesTab'),
        description: t('templates:settingsGroups.dependencies.description'),
        icon: GitBranch,
        kind: "inUse" as const,
      },
      canListMedia && {
        key: "media" as TemplateSettingsSection,
        title: t('templates:content.mediaTab'),
        description: t('templates:settingsGroups.media.description'),
        icon: Paperclip,
        kind: "inUse" as const,
      },
      canListDocx && {
        key: "docx-templates" as TemplateSettingsSection,
        title: t('templates:content.docxTemplatesTab'),
        description: t('templates:settingsGroups.docxTemplates.description'),
        icon: Settings2,
        kind: "file" as const,
      },
    ].filter(Boolean) as { key: TemplateSettingsSection; title: string; description: string; icon: LucideIcon; kind: "inUse" | "file" }[]),
    [canListCustomFields, canListTemplateContext, canListTemplateDependencies, canListMedia, canListDocx, t],
  );

  const isFetching = customFields.isFetching || context.isFetching || dependencies.isFetching || media.isFetching || docx.isFetching;
  const handleRefresh = () => {
    if (canListCustomFields) customFields.refetch();
    if (canListTemplateContext) context.refetch();
    if (canListTemplateDependencies) dependencies.refetch();
    if (canListMedia) media.refetch();
    if (canListDocx) docx.refetch();
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-3.5 px-8 py-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0f172a]">
              {t('templates:settingsGroups.title')}
            </h2>
            <p className="mt-0.5 text-[13px] text-[#64748b]">
              {t('templates:settingsGroups.subtitle')}
            </p>
          </div>
          <HuemulButton
            icon={RefreshCw}
            iconClassName="h-3.5 w-3.5"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            tooltip={t('common:refresh')}
            loading={isFetching}
            onClick={handleRefresh}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
          {groups.map((group, index) => {
            const count = counts[group.key];
            const countLabel = count === 0
              ? t('templates:settingsGroups.countEmpty')
              : t(group.kind === "file" ? 'templates:settingsGroups.countFile' : 'templates:settingsGroups.countInUse', { count });

            return (
              <button
                key={group.key}
                type="button"
                onClick={() => onSelect(group.key)}
                className={cn(
                  "flex w-full items-start gap-3.5 p-4.5 text-left transition-colors hover:cursor-pointer hover:bg-[#fafbfd]",
                  index < groups.length - 1 && "border-b border-[#eef1f5]",
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f1f4f7] text-[#475569]">
                  <group.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0f172a]">{group.title}</p>
                  <p className="text-pretty text-[13px] leading-[1.55] text-[#64748b]">{group.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 pt-0.5">
                  <span className="text-xs text-[#64748b]">{countLabel}</span>
                  <ChevronRight className="h-4 w-4 text-[#94a3b8]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
