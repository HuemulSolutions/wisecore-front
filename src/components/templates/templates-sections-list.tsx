import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Loader2, Plus } from "lucide-react";
import { updateTemplateSection, deleteTemplateSection, deleteTemplateSectionWithPropagation, updateTemplateSectionsOrder } from "@/services/template_section";
import { TemplateSectionCard } from "./templates-section-card";
import { toast } from "sonner";
import type { SortableSectionItem } from "@/types/sections/core";
import type { TemplateSectionsListProps } from '@/types/templates';
export type { TemplateSectionsListProps } from '@/types/templates';

export function TemplateSectionsList({
  sections,
  templateId,
  templateName,
  organizationId,
  onSectionsReorder,
  canUpdate = false,
  canDelete = false,
  onAddSectionAtEnd,
  canCreate = false,
  sectionHasOwnRulesFn,
}: TemplateSectionsListProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['sections', 'templates']);
  const [activeSection, setActiveSection] = useState<SortableSectionItem | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [openMenuSectionId, setOpenMenuSectionId] = useState<string | null>(null);

  // Un solo menú de tres puntos abierto a la vez — se resetea al cambiar de
  // plantilla (cambiar de pestaña ya desmonta este componente).
  useEffect(() => {
    setOpenMenuSectionId(null);
  }, [templateId]);

  // Configurar sensores para drag & drop
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 }
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: Parameters<typeof updateTemplateSection>[1] }) =>
      updateTemplateSection(sectionId, sectionData, organizationId),
    meta: { successMessage: t('sections:toast.sectionUpdated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: ({
      sectionId,
      options,
    }: {
      sectionId: string;
      options?: { propagate_to_documents?: boolean };
    }) =>
      options?.propagate_to_documents
        ? deleteTemplateSectionWithPropagation(sectionId, options, organizationId)
        : deleteTemplateSection(sectionId, organizationId),
    meta: { showSuccessToast: false },
    onSuccess: (data: { propagated?: boolean; deleted_document_sections_count?: number } | undefined) => {
      if (data?.propagated && data?.deleted_document_sections_count) {
        toast.success(t('sections:toast.sectionDeletedPropagated', { count: data.deleted_document_sections_count }));
      } else {
        toast.success(t('sections:toast.sectionDeleted'));
      }
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sectionsOrder: { section_id: string; order: number }[]) =>
      updateTemplateSectionsOrder(sectionsOrder, organizationId),
    meta: { successMessage: t('sections:toast.orderUpdated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
  });

  // Optimista + rollback + overlay de 800ms mínimo, compartido por el
  // drag&drop y por Subir/Bajar del menú de cada fila.
  const applyReorder = async (prev: SortableSectionItem[], reordered: SortableSectionItem[]) => {
    onSectionsReorder(reordered);
    setIsReordering(true);

    const minDelay = new Promise((resolve) => setTimeout(resolve, 800));
    const payload = reordered.map((s, idx) => ({ section_id: s.id, order: idx + 1 }));

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          reorderSectionsMutation.mutate(payload, {
            onSuccess: () => resolve(),
            onError: (error) => {
              onSectionsReorder(prev);
              reject(error);
            },
          });
        }),
        minDelay,
      ]);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const section = sections.find((s) => s.id === active.id);
    setActiveSection(section ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSection(null);

    if (!canUpdate) return;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = [...sections];
    const reordered = arrayMove(sections, oldIndex, newIndex);
    await applyReorder(prev, reordered);
  };

  const moveSection = async (sectionId: string, direction: "up" | "down") => {
    if (!canUpdate) return;
    const index = sections.findIndex((s) => s.id === sectionId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= sections.length) return;

    const prev = [...sections];
    const reordered = arrayMove(sections, index, targetIndex);
    await applyReorder(prev, reordered);
  };

  return (
    <div className="relative">
      <div className="relative isolate">
        {/* Loading Overlay */}
        {isReordering && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-9999 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#4464f7]" />
              <span className="text-sm text-gray-600 font-medium">{t('templates:sectionsList.reordering')}</span>
            </div>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className={`space-y-2.5 ${isReordering ? 'opacity-0' : ''}`}>
              {sections.map((section, index) => (
                <TemplateSectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  sections={sections}
                  templateId={templateId}
                  templateName={templateName}
                  hasOwnLifecycleRule={sectionHasOwnRulesFn?.(section.id)}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  isMenuOpen={openMenuSectionId === section.id}
                  onMenuOpenChange={(open) => setOpenMenuSectionId(open ? section.id : null)}
                  onSave={(sectionId, sectionData) => updateSectionMutation.mutate({ sectionId, sectionData })}
                  onDelete={async (sectionId, options) => {
                    await deleteSectionMutation.mutateAsync({ sectionId, options });
                  }}
                  onMoveUp={() => moveSection(section.id, "up")}
                  onMoveDown={() => moveSection(section.id, "down")}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeSection && !isReordering ? (
              <TemplateSectionCard
                section={activeSection}
                index={sections.findIndex((s) => s.id === activeSection.id)}
                sections={sections}
                templateId={templateId}
                templateName={templateName}
                isMenuOpen={false}
                onMenuOpenChange={() => {}}
                onSave={() => {}}
                onDelete={async () => {}}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {canCreate && onAddSectionAtEnd && (
        <button
          type="button"
          onClick={onAddSectionAtEnd}
          className="mt-2.5 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#cbd5e1] text-[13px] text-[#64748b] hover:cursor-pointer hover:border-[#2563eb] hover:bg-[#fafbfd] hover:text-[#2563eb]"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('templates:sectionsList.addSectionAtEnd')}
        </button>
      )}
    </div>
  );
}
