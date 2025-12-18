import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, List, PlusCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentActionButton } from "@/components/document-access-control";
import { useOrganization } from "@/contexts/organization-context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SortableSectionSheet from "@/components/sortable_section_sheet";
import { AddSectionFormSheet } from "@/components/add_section_form_sheet";
import { createSection, updateSection, updateSectionsOrder, deleteSection } from "@/services/section";
import { generateDocumentStructure } from "@/services/documents";
import { toast } from "sonner";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface SectionSheetProps {
  selectedFile: {
    id: string;
    name: string;
    type: "folder" | "document";
    access_levels?: string[];
  } | null;
  fullDocument?: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile?: boolean;
  accessLevels?: string[];
}

export function SectionSheet({
  selectedFile,
  fullDocument,
  isOpen,
  onOpenChange,
  isMobile = false,
  accessLevels
}: SectionSheetProps) {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [orderedSections, setOrderedSections] = useState<any[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  // Configurar sensores para drag & drop
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 }
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  // Actualizar orderedSections cuando cambie fullDocument
  useEffect(() => {
    if (fullDocument?.sections) {
      const sorted = [...fullDocument.sections].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setOrderedSections(sorted);
    } else {
      setOrderedSections([]);
    }
  }, [fullDocument?.sections]);

  // Mutations for sections management
  const addSectionMutation = useMutation({
    mutationFn: (sectionData: { name: string; document_id: string; prompt: string; dependencies: string[] }) =>
      createSection(sectionData, selectedOrganizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      setIsAddingSection(false);
      setIsFormValid(false);
      toast.success("Section created successfully");
    },
    onError: (error) => {
      console.error("Error creating section:", error);
      toast.error("Error creating section: " + (error as Error).message);
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateSection(sectionId, sectionData, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
    },
    onError: (error) => {
      console.error("Error updating section:", error);
      toast.error("Error updating section: " + (error as Error).message);
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteSection(sectionId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Section deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
    },
    onError: (error) => {
      console.error("Error deleting section:", error);
      toast.error("Error deleting section: " + (error as Error).message);
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sections: { section_id: string; order: number }[]) => updateSectionsOrder(sections, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Sections order updated");
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
    },
    onError: (error) => {
      console.error("Error updating sections order:", error);
      toast.error("Error updating sections order: " + (error as Error).message);
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
    mutationFn: (documentId: string) => generateDocumentStructure(documentId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Sections generated successfully with AI");
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
    },
    onError: (error) => {
      console.error("Error generating sections with AI:", error);
      toast.error("Error generating sections with AI: " + (error as Error).message);
    }
  });

  // Función para generar secciones con IA
  const handleGenerateWithAI = async () => {
    if (!selectedFile?.id) return;
    generateSectionsMutation.mutate(selectedFile.id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <DocumentActionButton
          accessLevels={accessLevels || selectedFile?.access_levels}
          requiredAccess={["edit", "create"]}
          requireAll={false}
          size="sm"
          variant="ghost"
          className={isMobile 
            ? "h-8 w-8 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors rounded-full" 
            : "h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
          }
          title="Add Section"
        >
          <Plus className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5 mr-1.5"} />
          {!isMobile && "Section"}
        </DocumentActionButton>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-[90vw] lg:max-w-[800px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <Plus className="h-4 w-4" />
                  Manage Document Sections
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Add, edit, and organize sections to structure your document content.
                </SheetDescription>
              </div>
              <div className="flex items-center h-full gap-2 ml-4">
                <DocumentActionButton
                  accessLevels={accessLevels || selectedFile?.access_levels}
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                  type="button"
                  size="sm"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-8"
                  onClick={() => {
                    setIsAddingSection(true);
                    setIsFormValid(false);
                  }}
                  disabled={isAddingSection}
                  style={{ alignSelf: 'center' }}
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  Add Section
                </DocumentActionButton>
                {(!orderedSections || orderedSections.length === 0) && !isAddingSection && (
                  <DocumentActionButton
                    accessLevels={accessLevels || selectedFile?.access_levels}
                    requiredAccess={["edit", "create"]}
                    requireAll={false}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="hover:cursor-pointer h-8"
                    onClick={handleGenerateWithAI}
                    disabled={generateSectionsMutation.isPending}
                    style={{ alignSelf: 'center' }}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    {generateSectionsMutation.isPending ? "Generating..." : "Generate with AI"}
                  </DocumentActionButton>
                )}
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="space-y-6">
              {/* Document Info */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Document: {selectedFile?.name}</h3>
                <p className="text-xs text-gray-600">Organize your document with structured sections that can contain text, code, and other content types.</p>
              </div>

              {/* Add Section Area */}
              {isAddingSection && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Add New Section</h3>
                      <p className="text-xs text-gray-600 mt-0.5">Create a structured section for your document with AI assistance</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingSection(false);
                          setIsFormValid(false);
                        }}
                        className="hover:cursor-pointer text-sm h-8"
                        size="sm"
                        disabled={addSectionMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        form="add-section-form"
                        type="submit"
                        className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
                        size="sm"
                        disabled={addSectionMutation.isPending || !isFormValid}
                      >
                        {addSectionMutation.isPending ? "Adding..." : "Save Section"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <AddSectionFormSheet
                      documentId={selectedFile!.id}
                      onSubmit={(values) => {
                        // Ensure we have the required fields for document sections
                        const sectionData = {
                          name: values.name,
                          document_id: values.document_id || selectedFile!.id,
                          prompt: values.prompt,
                          dependencies: values.dependencies,
                          type: values.type || "text"
                        };
                        addSectionMutation.mutate(sectionData);
                      }}
                      isPending={addSectionMutation.isPending}
                      existingSections={fullDocument?.sections || []}
                      onValidationChange={setIsFormValid}
                    />
                  </div>
                </div>
              )}

              {/* Existing Sections */}
              {orderedSections && orderedSections.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Existing Sections ({orderedSections.length})</h3>
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
                              onDelete={(sectionId: string) => deleteSectionMutation.mutate(sectionId)}
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
                  <h3 className="text-sm font-medium text-gray-700 mb-1">No Sections Yet</h3>
                  <p className="text-xs text-gray-500">
                    Start by adding sections to structure your document content.
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