import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import {
  HuemulInfoDisplay,
  HuemulInfoSection,
  HuemulInfoItem,
} from "@/huemul/components/huemul-info-display";
import { useObjectTags } from "@/hooks/useTags";
import { HuemulTagChip } from "@/huemul/components/huemul-tag-chip";
import type { TemplateInfoSheetProps } from '@/types/templates';
export type { TemplateInfoSheetProps } from '@/types/templates';

// ── Component ──────────────────────────────────────────────────────────────

export function TemplateInfoSheet({
  open,
  onOpenChange,
  templateData,
  selectedTemplate,
  sectionsCount,
  docxTemplatesCount,
  canViewTags = false,
}: TemplateInfoSheetProps) {
  const { t } = useTranslation(["templates", "tags", "common"]);

  const templateIdForTags = templateData?.id ?? selectedTemplate?.id;
  const { data: assignedTags = [] } = useObjectTags("template", templateIdForTags ?? "", {
    enabled: open && canViewTags && !!templateIdForTags,
  });

  const name = templateData?.name ?? selectedTemplate?.name ?? "—";
  const description = templateData?.description;
  const instructions = templateData?.instructions;
  const templateId = templateData?.id ?? selectedTemplate?.id;
  const organizationId = templateData?.organization_id;
  const assetKind = templateData?.asset_kind;
  const canvasId = templateData?.canvas_id;
  const resolvedDocxCount = docxTemplatesCount ?? templateData?.docx_templates?.length ?? 0;
  const docxTemplates: { id: string; name: string; file_name: string }[] = templateData?.docx_templates ?? [];
  const sections: { id: string; name: string; type: string; order: number }[] = templateData?.sections ?? [];
  const createdAt = templateData?.created_at;
  const updatedAt = templateData?.updated_at;
  const createdBy = templateData?.created_by;
  const updatedBy = templateData?.updated_by;

  const hasMetadata = createdAt || updatedAt || createdBy || updatedBy;

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("templates:infoSheet.title")}
      description={t("templates:infoSheet.description")}
      icon={Info}
      showFooter={false}
      maxWidth="sm:max-w-xl"
    >
      <HuemulInfoDisplay className="pb-4">
          {/* General */}
          <HuemulInfoSection title={t("templates:infoSheet.sectionIdentifiers")}>
            <HuemulInfoItem
              label={t("common:name")}
              value={name}
            />
            <HuemulInfoItem
              label={t("templates:infoSheet.descriptionLabel")}
              value={description}
              emptyText={t("templates:infoSheet.noDescription")}
            />
            <HuemulInfoItem
              label={t("templates:infoSheet.instructionsLabel")}
              value={instructions}
              emptyText={t("templates:infoSheet.none")}
            />
            <HuemulInfoItem
              label={t("templates:infoSheet.id")}
              value={templateId}
              variant="mono"
              copyable
            />
            {organizationId && (
              <HuemulInfoItem
                label={t("templates:infoSheet.organizationId")}
                value={organizationId}
                variant="mono"
                copyable
              />
            )}
            <HuemulInfoItem
              label={t("templates:infoSheet.assetKind")}
              value={assetKind}
              emptyText={t("templates:infoSheet.none")}
            />
            {canvasId && (
              <HuemulInfoItem
                label={t("templates:infoSheet.canvasId")}
                value={canvasId}
                variant="mono"
                copyable
              />
            )}
          </HuemulInfoSection>

          {/* Tags */}
          {canViewTags && assignedTags.length > 0 && (
            <HuemulInfoSection title={t("tags:assign.assignedLabel")}>
              <div className="flex flex-wrap gap-1.5 py-1">
                {assignedTags.map((tag) => (
                  <HuemulTagChip key={tag.id} label={tag.name} color={tag.color} size="sm" />
                ))}
              </div>
            </HuemulInfoSection>
          )}

          {/* Content */}
          <HuemulInfoSection title={t("templates:infoSheet.sectionStats")}>
            <HuemulInfoItem
              label={t("templates:infoSheet.sectionsCount")}
              value={
                <Badge variant="secondary" className="text-xs font-semibold tabular-nums">
                  {sectionsCount}
                </Badge>
              }
            />
            <HuemulInfoItem
              label={t("templates:infoSheet.docxTemplatesCount")}
              value={
                <Badge variant="secondary" className="text-xs font-semibold tabular-nums">
                  {resolvedDocxCount}
                </Badge>
              }
            />
          </HuemulInfoSection>

          {/* Sections list */}
          {sections.length > 0 && (
            <HuemulInfoSection title={t("templates:infoSheet.sectionSectionsList")}>
              {sections
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <HuemulInfoItem
                    key={s.id}
                    label={`${s.order}. ${s.name}`}
                    value={s.id}
                    variant="mono"
                    copyable
                  />
                ))}
            </HuemulInfoSection>
          )}

          {/* DOCX templates list */}
          {docxTemplates.length > 0 && (
            <HuemulInfoSection title={t("templates:infoSheet.sectionDocxTemplatesList")}>
              {docxTemplates.map((d) => (
                <HuemulInfoItem
                  key={d.id}
                  label={d.name}
                  value={d.file_name}
                  variant="mono"
                />
              ))}
            </HuemulInfoSection>
          )}

          {/* Metadata */}
          {hasMetadata && (
            <HuemulInfoSection title={t("templates:infoSheet.sectionMetadata")}>
              {createdAt && (
                <HuemulInfoItem
                  label={t("templates:infoSheet.createdAt")}
                  value={new Date(createdAt).toLocaleString()}
                />
              )}
              {updatedAt && (
                <HuemulInfoItem
                  label={t("templates:infoSheet.updatedAt")}
                  value={new Date(updatedAt).toLocaleString()}
                />
              )}
              {createdBy && (
                <HuemulInfoItem
                  label={t("templates:infoSheet.createdBy")}
                  value={createdBy}
                  variant="mono"
                  copyable
                />
              )}
              {updatedBy && (
                <HuemulInfoItem
                  label={t("templates:infoSheet.updatedBy")}
                  value={updatedBy}
                  variant="mono"
                  copyable
                />
              )}
            </HuemulInfoSection>
          )}
        </HuemulInfoDisplay>
    </HuemulSheet>
  );
}
