import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { updateTemplateSection, deleteTemplateSection, updateTemplateSectionsOrder } from "@/services/template_section";
import SortableSectionSheet from "@/components/sections/sortable_section_sheet";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TemplateSectionsListProps {
  sections: any[];
  templateId: string;
  organizationId: string;
  onSectionsReorder: (newSections: any[]) => void;
}

export function TemplateSectionsList({
  sections,
  templateId,
  organizationId,
  onSectionsReorder,
}: TemplateSectionsListProps) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<any>(null);
  const [isReordering, setIsReordering] = useState(false);

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
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateTemplateSection(sectionId, sectionData, organizationId),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
    onError: (error: Error) => {
      toast.error("Error updating section: " + error.message);
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteTemplateSection(sectionId, organizationId),
    onSuccess: () => {
      toast.success("Section deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
    onError: (error: Error) => {
      toast.error("Error deleting section: " + error.message);
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sectionsOrder: { section_id: string; order: number }[]) => 
      updateTemplateSectionsOrder(sectionsOrder, organizationId),
    onSuccess: () => {
      toast.success("Sections order updated");
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
    onError: (error: Error) => {
      toast.error("Error updating sections order: " + error.message);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const section = sections.find((s: any) => s.id === active.id);
    setActiveSection(section);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSection(null);
    
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s: any) => s.id === active.id);
    const newIndex = sections.findIndex((s: any) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = [...sections];
    const reordered = arrayMove(sections, oldIndex, newIndex);

    onSectionsReorder(reordered);
    setIsReordering(true);

    // Crear una promesa con delay mínimo de 800ms
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));

    const payload = reordered.map((s: any, idx: number) => ({ section_id: s.id, order: idx + 1 }));
    
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
        minDelay
      ]);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="relative">
      {/* <div className="flex items-center justify-between mb-1.5 sm:mb-2 pb-1.5">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
          Template Sections ({sections.length})
        </h3>
      </div> */}

      <div className="relative isolate">
        {/* Loading Overlay */}
        {isReordering && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-9999 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#4464f7]" />
              <span className="text-sm text-gray-600 font-medium">Reordering sections...</span>
            </div>
          </div>
        )}

        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
            <div className={`space-y-3 sm:space-y-3 ${isReordering ? 'opacity-0' : ''}`}>
              {sections.map((section: any) => (
                <div key={section.id}>
                  <SortableSectionSheet
                    item={section}
                    existingSections={sections}
                    onSave={(sectionId: string, sectionData: object) =>
                      updateSectionMutation.mutate({ sectionId, sectionData })
                    }
                    onDelete={(sectionId: string) => deleteSectionMutation.mutate(sectionId)}
                    isTemplateSection={true}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeSection && !isReordering ? (
              <div className="">
                <SortableSectionSheet
                  item={activeSection}
                  existingSections={sections}
                  onSave={() => {}}
                  onDelete={() => {}}
                  isOverlay={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
