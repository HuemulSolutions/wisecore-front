import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  FileCode, 
  FileText, 
  Loader2,
  List,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getTemplateById, updateTemplate, deleteTemplate, generateTemplateSections } from "@/services/templates";
import { createTemplateSection, updateTemplateSection, deleteTemplateSection, updateTemplateSectionsOrder } from "@/services/template_section";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableSectionSheet from "@/components/sortable_section_sheet";
import { AddSectionFormSheet } from "@/components/add_section_form_sheet";
import { useOrganization } from "@/contexts/organization-context";

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
}

interface TemplateContentProps {
  selectedTemplate: TemplateItem | null;
  onRefresh: () => void;
  onTemplateDeleted?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function TemplateContent({ 
  selectedTemplate, 
  onRefresh,
  onTemplateDeleted,
  onToggleSidebar
}: TemplateContentProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { selectedOrganizationId } = useOrganization();

  // Estados principales
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
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

  // Fetch template details
  const { data: templateData, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['template', selectedTemplate?.id],
    queryFn: () => getTemplateById(selectedTemplate!.id, selectedOrganizationId!),
    enabled: !!selectedTemplate?.id && !!selectedOrganizationId,
  });

  // Actualizar orderedSections cuando cambien las secciones
  useEffect(() => {
    if (templateData?.template_sections) {
      const sorted = [...templateData.template_sections].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setOrderedSections(sorted);
    } else {
      setOrderedSections([]);
    }
  }, [templateData?.template_sections]);

  // Mutations para manejo de template
  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) =>
      updateTemplate(templateId, data, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Template updated successfully");
      queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
      onRefresh();
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Error updating template: " + error.message);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Template deleted successfully");
      onRefresh();
      onTemplateDeleted?.();
    },
    onError: (error: Error) => {
      toast.error("Error deleting template: " + error.message);
    },
  });

  // Mutations para manejo de secciones
  const addSectionMutation = useMutation({
    mutationFn: (sectionData: any) => createTemplateSection(sectionData, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Section created successfully");
      queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
      setIsAddingSectionOpen(false);
      setIsFormValid(false);
    },
    onError: (error: Error) => {
      toast.error("Error creating section: " + error.message);
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateTemplateSection(sectionId, sectionData, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
    },
    onError: (error: Error) => {
      toast.error("Error updating section: " + error.message);
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteTemplateSection(sectionId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Section deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
    },
    onError: (error: Error) => {
      toast.error("Error deleting section: " + error.message);
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sectionsOrder: { section_id: string; order: number }[]) => 
      updateTemplateSectionsOrder(sectionsOrder, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Sections order updated");
      queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
    },
    onError: (error: Error) => {
      toast.error("Error updating sections order: " + error.message);
    },
  });

  // Mutation para generar secciones con AI
  const generateSectionsMutation = useMutation({
    mutationFn: (templateId: string) => generateTemplateSections(templateId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Sections generated successfully with AI");
      queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
    },
    onError: (error: Error) => {
      toast.error("Error generating sections with AI: " + error.message);
    }
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

  // Handlers
  const handleEditTemplate = () => {
    if (templateData) {
      setEditName(templateData.name);
      setEditDescription(templateData.description || "");
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate?.id) return;
    updateTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      data: {
        name: editName.trim(),
        description: editDescription.trim() || null
      }
    });
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate?.id) return;
    deleteTemplateMutation.mutate(selectedTemplate.id);
  };

  const handleGenerateWithAI = () => {
    if (!selectedTemplate?.id) return;
    generateSectionsMutation.mutate(selectedTemplate.id);
  };

  if (!selectedTemplate) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
          <p className="text-gray-500">Select a template from the sidebar to view and edit its sections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Toggle */}
        {isMobile && (
          <div className="bg-white border-b border-gray-200 shadow-sm py-1.5 px-4 z-20 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button
                  onClick={onToggleSidebar}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 hover:cursor-pointer flex-shrink-0"
                >
                  <List className="h-5 w-5" />
                </Button>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {selectedTemplate.name}
                </span>
              </div>
              <Button
                onClick={() => setIsAddingSectionOpen(true)}
                size="sm"
                className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-8 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Header Section */}
        {!isMobile && (
          <div className="bg-white border-b border-gray-200 shadow-sm p-4 md:px-7 z-10 flex-shrink-0">
            <div className="space-y-3 md:space-y-4">
              {/* Title Section */}
              <div className="flex items-start md:items-center gap-3 md:gap-4 flex-col md:flex-row">
                <h1 className="text-lg md:text-xl font-bold text-gray-900 break-words min-w-0 flex-1">
                  {selectedTemplate.name}
                </h1>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                  <FileCode className="w-2.5 h-2.5" />
                  Template
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="flex items-start gap-2 flex-wrap">
                {/* Primary Actions Group */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg flex-wrap min-w-0">
                  <Button
                    onClick={() => {
                      setIsAddingSectionOpen(true);
                      setIsFormValid(false);
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Section
                  </Button>
                  
                  {(!orderedSections || orderedSections.length === 0) && (
                    <Button
                      onClick={handleGenerateWithAI}
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
                      disabled={generateSectionsMutation.isPending}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      {generateSectionsMutation.isPending ? "Generating..." : "Generate with AI"}
                    </Button>
                  )}
                </div>

                {/* Secondary Actions Group */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg flex-wrap min-w-0">
                  <Button
                    onClick={handleEditTemplate}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 bg-white min-w-0 overflow-auto" style={{ scrollPaddingTop: '100px' }}>
            <div className="py-4 md:py-5 px-2 sm:px-4 md:px-6">
          {isLoadingTemplate ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading template...</span>
            </div>
          ) : (
            <div className="prose prose-gray max-w-full prose-sm md:prose-base">
              {/* Template Description - Main Content */}
              {templateData?.description && (
                <div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Description
                    </h2>
                    <div className="prose prose-sm max-w-full">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {templateData.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Separator */}
              {orderedSections && orderedSections.length > 0 && templateData?.description && (
                <div className="flex items-center my-8">
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
              )}

              {/* Add Section Form */}
              {isAddingSectionOpen && (
                <div className="p-2 sm:p-4 md:p-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 sm:px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg gap-3 sm:gap-0">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">Add New Section</h3>
                      <p className="text-xs text-gray-600 mt-0.5">Create a structured section for your template</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingSectionOpen(false);
                          setIsFormValid(false);
                        }}
                        className="hover:cursor-pointer text-sm h-8"
                        size="sm"
                        disabled={addSectionMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        form="add-section-form"
                        className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
                        size="sm"
                        disabled={addSectionMutation.isPending || !isFormValid}
                      >
                        {addSectionMutation.isPending ? "Adding..." : "Save Section"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 sm:p-4">
                    <AddSectionFormSheet
                      templateId={selectedTemplate.id}
                      onSubmit={(values: any) => addSectionMutation.mutate(values)}
                      isPending={addSectionMutation.isPending}
                      existingSections={orderedSections}
                      onValidationChange={setIsFormValid}
                    />
                  </div>
                </div>
                </div>
              )}

              {/* Sections List */}
              {orderedSections && orderedSections.length > 0 ? (
                <div>
                  <div className="p-2 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        Template Sections ({orderedSections.length})
                      </h3>
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={orderedSections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 sm:space-y-4 overflow-auto max-h-[45vh]">
                          {orderedSections.map((section: any) => (
                            <div key={section.id} className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
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
                </div>
              ) : (
                <>
                  {/* Separator for empty sections */}
                  {templateData?.description && (
                    <div className="flex items-center my-8">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <div className="px-4 text-sm font-medium text-gray-500 bg-gray-50 rounded-full py-2">
                        TEMPLATE SECTIONS
                      </div>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}
                  
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-8 text-center">
                      <List className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Start building your template by adding structured sections.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => setIsAddingSectionOpen(true)}
                          className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Section
                        </Button>
                        <Button
                          onClick={handleGenerateWithAI}
                          variant="outline"
                          className="hover:cursor-pointer"
                          disabled={generateSectionsMutation.isPending}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {generateSectionsMutation.isPending ? "Generating..." : "Generate with AI"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateTemplate(); }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#4464f7]" />
                Edit Template
              </DialogTitle>
              <DialogDescription>
                Update the template name and description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Template Name *
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter template name..."
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Description
                  </label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter template description (optional)..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateTemplateMutation.isPending}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleUpdateTemplate}
                disabled={!editName.trim() || updateTemplateMutation.isPending}
                className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              >
                {updateTemplateMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FileCode className="mr-2 h-4 w-4" />
                    Update Template
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate.name}"? This action cannot be undone and will remove all template sections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deleteTemplateMutation.isPending}
              className="bg-red-600 hover:bg-red-700 hover:cursor-pointer"
            >
              {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}