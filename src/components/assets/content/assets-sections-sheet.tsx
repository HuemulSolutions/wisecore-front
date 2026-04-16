import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, List, PlusCircle, Sparkles, BetweenHorizontalStart, ChevronDown } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { useOrganization } from "@/contexts/organization-context";
import type { LifecyclePermissions } from "@/types/assets";
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
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import SortableSectionSheet from "@/components/sections/sortable_section_sheet";
import { AddSectionFormSheet } from "@/components/sections/sections-add-form-sheet";
import { createSection, updateSection, updateSectionsOrder, deleteSection } from "@/services/section";
import { linkSectionToExecution } from "@/services/section_execution";
import { generateDocumentStructure, getDocumentSectionsConfig, syncDocumentsFromTemplate, syncTemplateFromDocument } from "@/services/assets";
import { toast } from "sonner";
import { withRefresh } from "@/lib/query-utils";
import { handleApiError } from "@/lib/error-utils";
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
  documentName?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile?: boolean;
  executionId?: string | null;
  executionInfo?: {
    id: string;
    name: string;
    status: string;
    created_at: string;
    formattedDate?: string;
    isLatest?: boolean;
  } | null;
  lifecyclePermissions?: LifecyclePermissions;
  stage?: string;
  showTrigger?: boolean;
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
  documentName,
  isOpen,
  onOpenChange,
  isMobile = false,
  executionId,
  executionInfo,
  lifecyclePermissions,
  stage,
  showTrigger = true,
}: SectionSheetProps) {
  const { t } = useTranslation('sections');
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();
  const [isAddingSectionDialogOpen, setIsAddingSectionDialogOpen] = useState(false);
  const [orderedSections, setOrderedSections] = useState<any[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkingSectionId, setLinkingSectionId] = useState<string | null>(null);
  const [selectedConfigExecutionId, setSelectedConfigExecutionId] = useState<string | null>(executionInfo?.id || executionId || null);

  // Whether the current user can edit (add / update / delete / reorder) sections
  // Requires edit/create permission AND the document must be in the 'edit' stage
  const canEditSections = !!(lifecyclePermissions?.edit || lifecyclePermissions?.create) && stage === 'edit';

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

    // Sort by creation date (descending) to maintain consistent order
    return Array.from(executionMap.values()).sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Most recent first
    });
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
    mutationFn: withRefresh(
      (sectionData: any) => {
        const payload = selectedConfigExecutionId
          ? { ...sectionData, execution_id: selectedConfigExecutionId }
          : sectionData;

        return createSection(payload, selectedOrganizationId!);
      },
      queryClient,
      () => [['document', selectedFile?.id], ['document-content', selectedFile?.id], ['document-sections-config', selectedFile?.id]],
    ),
    onSuccess: () => {
      setIsAddingSectionDialogOpen(false);
      setIsFormValid(false);
      setIsGenerating(false);
      toast.success(t('toast.sectionCreated'));
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateSection(sectionId, sectionData, selectedOrganizationId!),
    onSuccess: () => {
      toast.success(t('toast.sectionUpdated'));
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: ({ sectionId, executionId }: { sectionId: string; executionId?: string }) =>
      deleteSection(sectionId, selectedOrganizationId!, { executionId }),
    onSuccess: () => {
      toast.success(t('toast.sectionDeleted'));
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sections: { section_id: string; order: number }[]) => updateSectionsOrder(sections, selectedOrganizationId!, selectedConfigExecutionId || undefined),
    onSuccess: () => {
      toast.success(t('toast.orderUpdated'));
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
      toast.success(t('toast.generatedWithAI'));
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  const linkSectionToCurrentVersionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const currentVersionId = executionInfo?.id || executionId;

      if (!currentVersionId) {
        throw new Error(t('toast.noCurrentVersion'));
      }

      setLinkingSectionId(sectionId);
      return linkSectionToExecution(currentVersionId, sectionId, selectedOrganizationId || undefined);
    },
    onSuccess: () => {
      toast.success(t('toast.addedToVersion'));
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
    onError: (error) => {
      handleApiError(error, { fallbackMessage: t('toast.linkError') });
    },
    onSettled: () => {
      setLinkingSectionId(null);
    },
  });

  const syncTemplateToDocumentMutation = useMutation({
    mutationFn: ({ templateId, documentId }: { templateId: string; documentId: string }) =>
      syncDocumentsFromTemplate(templateId, [documentId], selectedOrganizationId!),
    onSuccess: () => {
      toast.success(t('toast.documentSynced'));
      queryClient.invalidateQueries({ queryKey: ['document', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-content', selectedFile?.id] });
      queryClient.invalidateQueries({ queryKey: ['document-sections-config', selectedFile?.id] });
    },
  });

  const syncDocumentToTemplateMutation = useMutation({
    mutationFn: ({ templateId, documentId }: { templateId: string; documentId: string }) =>
      syncTemplateFromDocument(templateId, documentId, selectedOrganizationId!),
    onSuccess: () => {
      toast.success(t('toast.templateSynced'));
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
    <>
      {showTrigger && (
        <HuemulButton
          size="sm"
          variant="ghost"
          icon={BetweenHorizontalStart}
          iconClassName={isMobile ? "h-4 w-4" : "h-3.5 w-3.5"}
          label={isMobile ? undefined : t('button.label')}
          title={t('button.title')}
          className={isMobile
            ? "h-7 w-7 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors rounded-full"
            : "h-7 px-2 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
          }
          onClick={() => onOpenChange(true)}
        />
      )}

      <HuemulSheet
        open={isOpen}
        onOpenChange={onOpenChange}
        title={t('sheet.title')}
        description={t('sheet.description')}
        icon={Plus}
        side="right"
        maxWidth="sm:max-w-[90vw] lg:max-w-[800px]"
        showFooter={false}
        headerExtra={
          canEditSections ? (
          <div className="flex items-center gap-2">
            {hasTemplateId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <HuemulButton
                    requiredAccess={["edit", "create"]}
                    requireAll={false}
                    checkGlobalPermissions={true}
                    resource="section"
                    lifecyclePermissions={lifecyclePermissions}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 hover:cursor-pointer text-gray-700"
                  >
                    {t('update.label')}
                    <ChevronDown className="h-4 w-4 ml-1.5" />
                  </HuemulButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-0">
                  <DropdownMenuLabel className="text-sm font-semibold px-4 py-3">
                    {t('update.label')}
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
                      <span className="text-sm font-semibold text-gray-900">{t('update.documentToTemplate')}</span>
                      <span className="text-xs text-gray-500">
                        {syncDocumentToTemplateMutation.isPending ? t('update.syncing') : t('update.documentToTemplateDesc')}
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
                      <span className="text-sm font-semibold text-gray-900">{t('update.templateToDocument')}</span>
                      <span className="text-xs text-gray-500">
                        {syncTemplateToDocumentMutation.isPending ? t('update.syncing') : t('update.templateToDocumentDesc')}
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <HuemulButton
              requiredAccess={["edit", "create"]}
              requireAll={false}
              checkGlobalPermissions={true}
              resource="section"
              lifecyclePermissions={lifecyclePermissions}
              type="button"
              size="sm"
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-8"
              onClick={() => {
                setIsAddingSectionDialogOpen(true);
                setIsFormValid(false);
                setIsGenerating(false);
              }}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              {t('header.addSection')}
            </HuemulButton>
            {(!orderedSections || orderedSections.length === 0) && (
              <HuemulButton
                requiredAccess={["edit", "create"]}
                requireAll={false}
                checkGlobalPermissions={true}
                resource="section"
                lifecyclePermissions={lifecyclePermissions}
                type="button"
                size="sm"
                variant="outline"
                className="hover:cursor-pointer h-8"
                onClick={handleGenerateWithAI}
                disabled={generateSectionsMutation.isPending}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {generateSectionsMutation.isPending ? t('header.generating') : t('header.generateWithAI')}
              </HuemulButton>
            )}
          </div>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {/* Asset Info */}
          <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">{t('assetInfo.asset')} {documentName || sectionsConfig?.document?.name || selectedFile?.name}</h3>
              <p className="text-xs text-gray-600">
                <span className="font-medium">{t('assetInfo.description')}</span>{" "}
                {sectionsConfig?.document?.description || "-"}
              </p>
            </div>
            {availableExecutions.length > 0 && (
              <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="font-medium whitespace-nowrap">{t('assetInfo.version')}</span>
                  <Select
                    value={selectedConfigExecutionId || undefined}
                    onValueChange={(value) => setSelectedConfigExecutionId(value)}
                  >
                    <SelectTrigger className="h-8 w-[240px] text-xs bg-white hover:border-[#4464f7] focus:border-[#4464f7] focus:ring-2 focus:ring-[#4464f7]/20 transition-colors">
                      <SelectValue placeholder={t('assetInfo.selectVersion')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExecutions.map((execution, index) => (
                        <SelectItem key={execution.id} value={execution.id} className="cursor-pointer">
                          {execution.name || t('assetInfo.versionNumber', { number: availableExecutions.length - index })}
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
              <h3 className="text-sm font-medium text-gray-900">{t('sections.title', { count: orderedSections.length })}</h3>
              <DndContext sensors={canEditSections ? sensors : []} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                          canUpdate={canEditSections}
                          canDelete={canEditSections}
                          isAddToCurrentVersionPending={linkingSectionId === section.id && linkSectionToCurrentVersionMutation.isPending}
                          onAddToCurrentVersion={(sectionId: string) => {
                            if (!executionInfo?.id && !executionId) {
                              toast.error(t('toast.noVersionForAsset'));
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
              <h3 className="text-sm font-medium text-gray-700 mb-1">{t('emptyState.title')}</h3>
              <p className="text-xs text-gray-500">
                {t('emptyState.description')}
              </p>
            </div>
          )}
        </div>
      </HuemulSheet>

      {/* Add Section Dialog */}
      <HuemulDialog
        open={isAddingSectionDialogOpen}
        onOpenChange={(open) => {
          setIsAddingSectionDialogOpen(open);
          if (!open) {
            setIsFormValid(false);
            setIsGenerating(false);
          }
        }}
          title={t('addDialog.title')}
        description={t('addDialog.description')}
        icon={PlusCircle}
        maxWidth="sm:max-w-3xl"
        maxHeight="max-h-[90vh]"
        saveAction={{
          label: addSectionMutation.isPending ? t('addDialog.adding') : isGenerating ? t('addDialog.generating') : t('addDialog.save'),
          disabled: !isFormValid || addSectionMutation.isPending || isGenerating,
          loading: addSectionMutation.isPending,
          closeOnSuccess: false,
          onClick: () => {
            (document.getElementById("add-section-form") as HTMLFormElement)?.requestSubmit();
          },
        }}
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
      </HuemulDialog>
    </>
  );
}
