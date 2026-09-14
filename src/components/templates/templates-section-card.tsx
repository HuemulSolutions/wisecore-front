import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Edit, ArrowUp, ArrowDown, ArrowRight, Trash2 } from "lucide-react";
import { HuemulOrderedItemCard } from "@/huemul/components/huemul-ordered-item-card";
import type { HuemulOrderedItemCardMenuAction } from "@/types/huemul";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EditSectionDialog } from "@/components/sections/sections-edit-sheet";
import { questionTypeLabel } from "@/components/sections/question-type-meta";
import { SECTION_TYPE_META } from "@/components/sections/section-type-meta";
import { dependencyContextItems, formFieldChips, summarizeTemplateSection } from "@/lib/template-section-summary";
import type { TemplateSectionCardProps } from "@/types/templates";
export type { TemplateSectionCardProps } from "@/types/templates";

/** Estilo fijo de los chips de "usa como contexto" — igual para todos, sin importar el tipo de sección referenciada. */
const CONTEXT_CHIP_STYLE = { backgroundColor: SECTION_TYPE_META.ai.tint, color: SECTION_TYPE_META.ai.color };

/**
 * Fila de sección de la pestaña Estructura — wrapper de dominio de
 * HuemulOrderedItemCard: arma título/resumen/contexto/chips a partir de
 * SortableSectionItem y mantiene el drag&drop (dnd-kit) alrededor. Componente
 * aparte de SortableSectionSheet (ese sigue sirviendo a assets/executions).
 */
export function TemplateSectionCard({
  section,
  index,
  sections,
  templateId,
  templateName,
  hasOwnLifecycleRule = false,
  canUpdate = false,
  canDelete = false,
  isOverlay = false,
  isMenuOpen,
  onMenuOpenChange,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: TemplateSectionCardProps) {
  const { t } = useTranslation(["templates", "sections", "common"]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [propagateDeleteToAssets, setPropagateDeleteToAssets] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: isOverlay || !canUpdate,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const sectionType = section.type ?? "ai";
  const typeMeta = SECTION_TYPE_META[sectionType] ?? SECTION_TYPE_META.ai;
  const typeBadgeLabel = t(typeMeta.nameKey);

  const contextItems = dependencyContextItems(section.dependencies, sections);
  const chipFields = sectionType === "form" ? formFieldChips(section.form_fields) : [];

  const isFirst = index === 0;
  const isLast = index === sections.length - 1;

  const handleOpenConfigure = () => setShowEditDialog(true);

  const menuActions: HuemulOrderedItemCardMenuAction[] = [];
  if (canUpdate) {
    menuActions.push({ key: "configure", label: t("templates:sectionsList.configureLink"), icon: Edit, onClick: handleOpenConfigure });
    menuActions.push({ key: "move-up", label: t("templates:sectionsList.moveUp"), icon: ArrowUp, onClick: onMoveUp, disabled: isFirst });
    menuActions.push({ key: "move-down", label: t("templates:sectionsList.moveDown"), icon: ArrowDown, onClick: onMoveDown, disabled: isLast });
  }
  if (canDelete) {
    menuActions.push({ key: "delete", label: t("common:delete"), icon: Trash2, destructive: true, onClick: () => setShowDeleteDialog(true) });
  }

  const handleEditSave = (sectionData: object) => onSave(section.id, sectionData);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(section.id, propagateDeleteToAssets ? { propagate_to_documents: true } : undefined);
      setShowDeleteDialog(false);
      setPropagateDeleteToAssets(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const title = (
    <>
      <span className="text-[15px] font-semibold text-[#0f172a]">{section.name}</span>
      <span
        className="rounded-[5px] px-2 py-0.75 text-[11px] font-semibold"
        style={{ backgroundColor: typeMeta.tint, color: typeMeta.color }}
      >
        {typeBadgeLabel}
      </span>
      {hasOwnLifecycleRule && (
        <span className="rounded-[5px] border border-[#fbe3b4] bg-[#fef6e7] px-2 py-0.75 text-[11px] font-semibold text-[#b45309]">
          {t("templates:sectionsList.visibleOnlySomeStagesBadge")}
        </span>
      )}
    </>
  );

  const contextBox = contextItems.length > 0 ? (
    <div className="flex w-fit flex-wrap items-center gap-1.5 rounded-lg border border-[#eef1f5] bg-[#f7f8fa] px-2.5 py-1.75 text-[12px] text-[#475569]">
      <ArrowRight className="h-3 w-3 shrink-0 text-[#7c3aed]" />
      <span>{t("templates:sectionsList.usesAsContext")}</span>
      {contextItems.map((item) => (
        <span
          key={item.id}
          className="flex h-5.5 w-fit items-center justify-center rounded-sm px-1.5 text-[11px] font-medium"
          style={CONTEXT_CHIP_STYLE}
        >
          {item.position}. {item.name}
        </span>
      ))}
    </div>
  ) : null;

  const chips = chipFields.length > 0 ? (
    <>
      {chipFields.map((field) => (
        <span
          key={field.id ?? field.field_id}
          className="rounded-full border border-[#eef1f5] bg-[#f7f8fa] px-2.5 py-0.75 text-[11px] text-[#475569]"
        >
          {t("templates:sectionsList.questionChip", { name: field.field_name, type: questionTypeLabel(field.question_type, t) })}
        </span>
      ))}
    </>
  ) : null;

  const dragHandle = !isOverlay && canUpdate ? (
    <div
      className="flex h-5.5 shrink-0 items-center hover:cursor-grab active:cursor-grabbing"
      title={t("sections:sortableSection.dragToReorder")}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-[#cbd5e1]" />
    </div>
  ) : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      <HuemulOrderedItemCard
        orderLabel={index + 1}
        accent={sectionType === "ai"}
        onClick={canUpdate ? handleOpenConfigure : undefined}
        title={title}
        summary={summarizeTemplateSection(section, t)}
        contextBox={contextBox}
        chips={chips}
        configureLabel={canUpdate ? t("templates:sectionsList.configureLink") : undefined}
        onConfigure={canUpdate ? handleOpenConfigure : undefined}
        menuActions={menuActions.length > 0 ? menuActions : undefined}
        menuAriaLabel={t("templates:sectionsList.menuLabel")}
        dragHandle={dragHandle}
        isDragging={isDragging}
        menuOpen={isMenuOpen}
        onMenuOpenChange={onMenuOpenChange}
      />

      {!isOverlay && (
        <>
          <HuemulAlertDialog
            open={showDeleteDialog}
            onOpenChange={(open) => !isDeleting && setShowDeleteDialog(open)}
            title={t("sections:deleteDialog.title")}
            description={
              <div className="space-y-3">
                <p>{t("sections:sortableSection.deleteAlertDescription", { name: section.name })}</p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`propagate-delete-${section.id}`}
                    checked={propagateDeleteToAssets}
                    onCheckedChange={(checked) => setPropagateDeleteToAssets(checked as boolean)}
                    disabled={isDeleting}
                  />
                  <Label
                    htmlFor={`propagate-delete-${section.id}`}
                    className="text-xs font-medium text-gray-700 hover:cursor-pointer"
                  >
                    {t("sections:sortableSection.propagateDeleteToAssets")}
                  </Label>
                </div>
              </div>
            }
            onAction={handleDelete}
            actionLabel={t("common:delete")}
            actionVariant="destructive"
          />

          <EditSectionDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            item={section}
            onSave={handleEditSave}
            existingSections={sections}
            isTemplateSection
            templateId={templateId}
            containerName={templateName}
          />
        </>
      )}
    </div>
  );
}
