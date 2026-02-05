import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { List, PlusCircle, Sparkles, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentActionButton } from "@/components/assets/content/assets-access-control";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import SortableSectionSheet from "@/components/sections/sortable_section_sheet";
import { AddSectionForm } from "@/components/sections/sections-add";
import { createTemplateSection, updateTemplateSection, updateSectionsOrder, deleteTemplateSection, deleteTemplateSectionWithPropagation } from "@/services/template_section";
import { generateTemplateSections } from "@/services/templates";
import { toast } from "sonner";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useOrganization } from "@/contexts/organization-context";

interface TemplateConfigSheetProps {
  template: {
    id: string;
    name: string;
    description?: string;
    template_sections?: any[];
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateConfigSheet({
  template,
  isOpen,
  onOpenChange
}: TemplateConfigSheetProps) {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [orderedSections, setOrderedSections] = useState<any[]>([]);

  // Configurar sensores para drag & drop
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 }
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  // Actualizar orderedSections cuando cambie template
  useEffect(() => {
    if (template?.template_sections) {
      const sorted = [...template.template_sections].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setOrderedSections(sorted);
    } else {
      setOrderedSections([]);
    }
  }, [template?.template_sections]);

  // Mutations for template sections management
  const addSectionMutation = useMutation({
    mutationFn: (sectionData: { name: string; template_id: string; prompt: string; dependencies: string[] }) =>
      createTemplateSection(sectionData, selectedOrganizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', template?.id] });
      setIsAddingSection(false);
      toast.success("Template section created successfully");
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateTemplateSection(sectionId, sectionData, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Template section updated successfully");
      queryClient.invalidateQueries({ queryKey: ['template', template?.id] });
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
        ? deleteTemplateSectionWithPropagation(sectionId, options, selectedOrganizationId!)
        : deleteTemplateSection(sectionId, selectedOrganizationId!),
    onSuccess: (data: any) => {
      if (data?.propagated && data?.deleted_document_sections_count) {
        toast.success(`Template section deleted and propagated to ${data.deleted_document_sections_count} asset sections`);
      } else {
        toast.success("Template section deleted successfully");
      }
      queryClient.invalidateQueries({ queryKey: ['template', template?.id] });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sections: { section_id: string; order: number }[]) => updateSectionsOrder(sections, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Template sections order updated");
      queryClient.invalidateQueries({ queryKey: ['template', template?.id] });
    },
  });

  // Función para manejar el final del drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSections.findIndex((s: any) => s.id === active.id);
    const newIndex = orderedSections.findIndex((s: any) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = [...orderedSections];
    const reordered = arrayMove(orderedSections, oldIndex, newIndex);

    // Actualización optimista en UI
    setOrderedSections(reordered);

    const payload = reordered.map((s: any, idx: number) => ({ section_id: s.id, order: idx + 1 }));
    reorderSectionsMutation.mutate(payload, {
      onError: () => setOrderedSections(prev),
    });
  };

  // Mutation para generar secciones con AI
  const generateSectionsMutation = useMutation({
    mutationFn: (templateId: string) => generateTemplateSections(templateId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Template sections generated successfully with AI");
      queryClient.invalidateQueries({ queryKey: ['template', template?.id] });
    },
  });

  // Función para generar secciones con IA
  const handleGenerateWithAI = async () => {
    if (!template?.id) return;
    generateSectionsMutation.mutate(template.id);
  };



  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[90vw] lg:max-w-[800px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <FileCode className="h-4 w-4" />
                  Configure Template
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Add sections to your template "{template?.name}" to define its structure.
                </SheetDescription>
              </div>
              <div className="flex items-center h-full gap-2">
                <DocumentActionButton
                  accessLevels={[]}  // Templates don't have document-level access
                  requiredAccess="create"
                  checkGlobalPermissions={true}
                  resource="template"
                  type="button"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                  onClick={() => setIsAddingSection(true)}
                  disabled={isAddingSection}
                  style={{ alignSelf: 'center' }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Section
                </DocumentActionButton>
                {(!orderedSections || orderedSections.length === 0) && !isAddingSection && (
                  <DocumentActionButton
                    accessLevels={[]}  // Templates don't have document-level access
                    requiredAccess="create"
                    checkGlobalPermissions={true}
                    resource="template"
                    type="button"
                    variant="outline"
                    className="hover:cursor-pointer"
                    onClick={handleGenerateWithAI}
                    disabled={generateSectionsMutation.isPending}
                    style={{ alignSelf: 'center' }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generateSectionsMutation.isPending ? "Generating..." : "Generate with AI"}
                  </DocumentActionButton>
                )}
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="space-y-6">
              {/* Template Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-1">Template: {template?.name}</h3>
                {template?.description && (
                  <p className="text-xs text-blue-700 mb-2">{template.description}</p>
                )}
                <p className="text-xs text-blue-600">Define reusable sections that will be available when creating documents from this template.</p>
              </div>

              {/* Add Section Area */}
              {isAddingSection && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Add New Template Section</h3>
                      <p className="text-xs text-gray-600 mt-0.5">Create a reusable section for this template</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingSection(false)}
                        className="hover:cursor-pointer text-sm h-8"
                        size="sm"
                        disabled={addSectionMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        form="add-template-section-form"
                        type="submit"
                        className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
                        size="sm"
                        disabled={addSectionMutation.isPending}
                      >
                        {addSectionMutation.isPending ? "Adding..." : "Save Section"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <AddSectionForm
                      templateId={template!.id}
                      onSubmit={(values: { name: string; template_id: string; prompt: string; dependencies: string[] }) => addSectionMutation.mutate(values)}
                      onCancel={() => setIsAddingSection(false)}
                      isPending={addSectionMutation.isPending}
                      existingSections={template?.template_sections || []}
                    />
                  </div>
                </div>
              )}

              {/* Existing Sections */}
              {orderedSections && orderedSections.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Template Sections ({orderedSections.length})</h3>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedSections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {orderedSections.map((section: any) => (
                          <div key={section.id} className="border rounded-lg bg-white">
                            <SortableSectionSheet
                              item={section}
                              existingSections={orderedSections}
                              onSave={(sectionId: string, sectionData: object) =>
                                updateSectionMutation.mutate({ sectionId, sectionData })
                              }
                              onDelete={(sectionId: string, options?: { propagate_to_documents?: boolean }) =>
                                deleteSectionMutation.mutate({ sectionId, options })
                              }
                              isTemplateSection={true}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {(!orderedSections || orderedSections.length === 0) && !isAddingSection && (
                <div className="p-4 sm:p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                  <List className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-gray-700 mb-1">No Template Sections Yet</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Start by adding sections to define the structure of documents created from this template.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
