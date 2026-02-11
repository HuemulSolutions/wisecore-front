import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, List, PlusCircle, Sparkles, BetweenHorizontalStart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentActionButton } from "@/components/assets/content/assets-access-control";
import { useOrganization } from "@/contexts/organization-context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import SortableSectionSheet from "@/components/sections/sortable_section_sheet";
import { AddSectionFormSheet } from "@/components/sections/sections-add-form-sheet";
import { createSection, updateSection, updateSectionsOrder, deleteSection } from "@/services/section";
import { linkSectionToExecution } from "@/services/section_execution";
import { generateDocumentStructure, getDocumentSectionsConfig, syncDocumentsFromTemplate, syncTemplateFromDocument } from "@/services/assets";
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
  executionId?: string | null;
  executionInfo?: {
    id: string;
    name: string;
    status: string;
    created_at: string;
    formattedDate?: string;
    isLatest?: boolean;
  } | null;
}

interface SectionsConfigExecution {
  id: string;
  name?: string;
  status?: string;
  created_at?: string;
}

interface SectionsConfigSection {
  id: string;
  name: string;
  type?: "ai" | "manual" | "reference";
  prompt?: string;
  order?: number;
  dependencies?: Array<{ id: string; name: string }>;
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
  not_in_execution?: boolean | null;
}

interface SectionsConfigResponse {
  template_id?: string | null;
  document?: {
    id: string;
    name: string;
    description?: string;
    template_id?: string | null;
  };
  executions?: {
    active?: SectionsConfigExecution | null;
    others?: SectionsConfigExecution[];
  };
  sections?: SectionsConfigSection[];
}

export function SectionSheet({
  selectedFile,
  fullDocument,
  isOpen,
  onOpenChange,
  isMobile = false,
  accessLevels,
  executionId,
  executionInfo
}: SectionSheetProps) {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();
  const [isAddingSectionDialogOpen, setIsAddingSectionDialogOpen] = useState(false);
  const [orderedSections, setOrderedSections] = useState<any[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkingSectionId, setLinkingSectionId] = useState<string | null>(null);
  const [selectedConfigExecutionId, setSelectedConfigExecutionId] = useState<string | null>(executionInfo?.id || executionId || null);

  useEffect(() => {
    setSelectedConfigExecutionId(executionInfo?.id || executionId || null);
  }, [selectedFile?.id, executionInfo?.id, executionId]);

  const { data: sectionsConfig } = useQuery<SectionsConfigResponse>({
    queryKey: ['document-sections-config', selectedFile?.id, selectedConfigExecutionId],
    queryFn: () => getDocumentSectionsConfig(selectedFile!.id, selectedOrganizationId!, selectedConfigExecutionId || undefined),
    enabled: isOpen && selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId,
    staleTime: 30000,
  });
  const templateId = sectionsConfig?.document?.template_id ?? sectionsConfig?.template_id ?? null;
  const hasTemplateId = !!templateId;

  const availableExecutions = useMemo(() => {
    const active = sectionsConfig?.executions?.active;
    const others = sectionsConfig?.executions?.others || [];
    const executionMap = new Map<string, SectionsConfigExecution>();

    if (active?.id) {
      executionMap.set(active.id, active);
    }

    others.forEach((execution) => {
      if (execution?.id) {
        executionMap.set(execution.id, execution);
      }
    });

    return Array.from(executionMap.values());
  }, [sectionsConfig?.executions]);

  useEffect(() => {
    if (selectedConfigExecutionId || !sectionsConfig?.executions?.active?.id) {
      return;
    }
    setSelectedConfigExecutionId(sectionsConfig.executions.active.id);
  }, [sectionsConfig?.executions?.active?.id, selectedConfigExecutionId]);

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
    if (sectionsConfig?.sections) {
      const sorted = [...sectionsConfig.sections].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setOrderedSections(sorted);
    } else {
      setOrderedSections([]);
    }
  }, [sectionsConfig?.sections]);

  // Mutations for sections management
  const addSectionMutation = useMutation({
    mutationFn: (sectionData: any) =>
      createSection(sectionData, selectedOrganizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
      setIsAddingSectionDialogOpen(false);
      setIsFormValid(false);
      setIsGenerating(false);
      toast.success("Section created successfully");
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateSection(sectionId, sectionData, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: ({ sectionId, executionId }: { sectionId: string; executionId?: string }) =>
      deleteSection(sectionId, selectedOrganizationId!, { executionId }),
    onSuccess: () => {
      toast.success("Section deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sections: { section_id: string; order: number }[]) => updateSectionsOrder(sections, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Sections order updated");
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  const linkSectionToCurrentVersionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const currentVersionId = executionInfo?.id || executionId;

      if (!currentVersionId) {
        throw new Error("No current version available");
      }

      setLinkingSectionId(sectionId);
      return linkSectionToExecution(currentVersionId, sectionId, selectedOrganizationId || undefined);
    },
    onSuccess: () => {
      toast.success("Section added to current version");
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
    onError: () => {
      toast.error("Could not add section to current version");
    },
    onSettled: () => {
      setLinkingSectionId(null);
    },
  });

  const syncTemplateToDocumentMutation = useMutation({
    mutationFn: ({ templateId, documentId }: { templateId: string; documentId: string }) =>
      syncDocumentsFromTemplate(templateId, [documentId], selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Document synced from template");
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  const syncDocumentToTemplateMutation = useMutation({
    mutationFn: ({ templateId, documentId }: { templateId: string; documentId: string }) =>
      syncTemplateFromDocument(templateId, documentId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success("Template synced from document");
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  // Función para generar secciones con IA
  const handleGenerateWithAI = async () => {
    if (!selectedFile?.id) return;
    generateSectionsMutation.mutate(selectedFile.id);
  };

  const handleTemplateUpdateAction = (action: "document_to_template" | "template_to_document") => {
    if (action === "document_to_template") {
      if (!templateId || !selectedFile?.id || !selectedOrganizationId) {
        return;
      }

      syncDocumentToTemplateMutation.mutate({
        templateId,
        documentId: selectedFile.id,
      });
      return;
    }

    if (action === "template_to_document") {
      if (!templateId || !selectedFile?.id || !selectedOrganizationId) {
        return;
      }

      syncTemplateToDocumentMutation.mutate({
        templateId,
        documentId: selectedFile.id,
      });
      return;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <DocumentActionButton
          accessLevels={accessLevels || selectedFile?.access_levels}
          requiredAccess={["edit", "create"]}
          requireAll={false}
          checkGlobalPermissions={true}
          resource="asset"
          size="sm"
          variant="ghost"
          className={isMobile 
            ? "h-8 w-8 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors rounded-full" 
            : "h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
          }
          title="Add Section"
        >
          <BetweenHorizontalStart className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5 mr-1.5"} />
          {!isMobile && "Sections"}
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
                {hasTemplateId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <DocumentActionButton
                        accessLevels={accessLevels || selectedFile?.access_levels}
                        requiredAccess={["edit", "create"]}
                        requireAll={false}
                        checkGlobalPermissions={true}
                        resource="asset"
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 hover:cursor-pointer text-gray-700"
                        style={{ alignSelf: "center" }}
                      >
                        Template
                        <ChevronDown className="h-4 w-4 ml-1.5" />
                      </DocumentActionButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-0">
                      <DropdownMenuLabel className="text-sm font-semibold px-4 py-3">
                        Update
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="hover:cursor-pointer px-4 py-3"
                        onSelect={() => {
                          setTimeout(() => handleTemplateUpdateAction("document_to_template"), 0);
                        }}
                        disabled={syncDocumentToTemplateMutation.isPending}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{"Document -> Template"}</span>
                          <span className="text-xs text-gray-500">
                            {syncDocumentToTemplateMutation.isPending ? "Syncing..." : "Update the template"}
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="hover:cursor-pointer px-4 py-3"
                        onSelect={() => {
                          setTimeout(() => handleTemplateUpdateAction("template_to_document"), 0);
                        }}
                        disabled={syncTemplateToDocumentMutation.isPending}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{"Template -> Document"}</span>
                          <span className="text-xs text-gray-500">
                            {syncTemplateToDocumentMutation.isPending ? "Syncing..." : "Update the document"}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <DocumentActionButton
                  accessLevels={accessLevels || selectedFile?.access_levels}
                  requiredAccess={["edit", "create"]}
                  requireAll={false}
                  checkGlobalPermissions={true}
                  resource="asset"
                  type="button"
                  size="sm"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-8"
                  onClick={() => {
                    setIsAddingSectionDialogOpen(true);
                    setIsFormValid(false);
                    setIsGenerating(false);
                  }}
                  style={{ alignSelf: 'center' }}
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  Add Section
                </DocumentActionButton>
                {(!orderedSections || orderedSections.length === 0) && (
                  <DocumentActionButton
                    accessLevels={accessLevels || selectedFile?.access_levels}
                    requiredAccess={["edit", "create"]}
                    requireAll={false}
                    checkGlobalPermissions={true}
                    resource="asset"
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
              {/* Asset Info */}
              <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Asset: {selectedFile?.name}</h3>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Description:</span>{" "}
                    {sectionsConfig?.document?.description || "-"}
                  </p>
                </div>
                {availableExecutions.length > 0 && (
                  <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="font-medium whitespace-nowrap">Version:</span>
                      <Select
                        value={selectedConfigExecutionId || undefined}
                        onValueChange={(value) => setSelectedConfigExecutionId(value)}
                      >
                        <SelectTrigger className="h-8 w-[240px] text-xs bg-white hover:border-[#4464f7] focus:border-[#4464f7] focus:ring-2 focus:ring-[#4464f7]/20 transition-colors">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableExecutions.map((execution, index) => (
                            <SelectItem key={execution.id} value={execution.id} className="cursor-pointer">
                              {execution.name || `Version ${availableExecutions.length - index}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

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
                              onDelete={async (sectionId: string, options?: { executionId?: string }) => {
                                await deleteSectionMutation.mutateAsync({
                                  sectionId,
                                  executionId: options?.executionId,
                                });
                              }}
                              currentExecutionId={selectedConfigExecutionId}
                              useExecutionDeleteDialog={true}
                              hasTemplate={!!fullDocument?.template_id}
                              isDisabledSection={section.not_in_execution === true}
                              isAddToCurrentVersionPending={linkingSectionId === section.id && linkSectionToCurrentVersionMutation.isPending}
                              onAddToCurrentVersion={(sectionId: string) => {
                                if (!executionInfo?.id && !executionId) {
                                  toast.error("No current version available for this asset");
                                  return;
                                }

                                linkSectionToCurrentVersionMutation.mutate(sectionId);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {(!orderedSections || orderedSections.length === 0) && (
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

      {/* Add Section Dialog */}
      <ReusableDialog
        open={isAddingSectionDialogOpen}
        onOpenChange={setIsAddingSectionDialogOpen}
        title="Add New Section"
        description="Create a structured section for your document with AI assistance"
        icon={PlusCircle}
        maxWidth="xl"
        maxHeight="90vh"
        formId="add-section-form"
        isValid={isFormValid && !isGenerating}
        isSubmitting={addSectionMutation.isPending || isGenerating}
        submitLabel="Save Section"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingSectionDialogOpen(false);
                setIsFormValid(false);
                setIsGenerating(false);
              }}
              className="hover:cursor-pointer"
              disabled={addSectionMutation.isPending || isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-section-form"
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              disabled={!isFormValid || addSectionMutation.isPending || isGenerating}
            >
              {addSectionMutation.isPending ? "Adding..." : isGenerating ? "Generating..." : "Save Section"}
            </Button>
          </>
        }
      >
        <AddSectionFormSheet
          documentId={selectedFile!.id}
          onSubmit={(values) => {
            addSectionMutation.mutate(values);
          }}
          isPending={addSectionMutation.isPending}
          existingSections={fullDocument?.sections || []}
          onValidationChange={setIsFormValid}
          onGeneratingChange={setIsGenerating}
        />
      </ReusableDialog>
    </Sheet>
  );
}
