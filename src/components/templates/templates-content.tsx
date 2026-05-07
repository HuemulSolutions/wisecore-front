import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, RefreshCw, Edit3, Trash2, Sparkles } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyActions } from "@/components/ui/empty";
import { getTemplateById, generateTemplateSections } from "@/services/templates";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrganization } from "@/contexts/organization-context";
import { TemplateHeader } from "./templates-header";
import { EditTemplateDialog } from "./templates-edit-dialog";
import { DeleteTemplateDialog } from "./templates-delete-dialog";
import { AddSectionDialog } from "./templates-add-section-dialog";
import { TemplateSectionsList } from "./templates-sections-list";
import { TemplateEmptyState } from "./templates-empty-state";
import { TemplateCustomFields } from "../templates-custom-fields/templates-custom-fields";
import { CreateTemplateDialog } from "./templates-create-dialog";
import { TemplateDocxList } from "./templates-docx-list";

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
}

interface TemplateContentProps {
  selectedTemplate: TemplateItem | null;
  onRefresh: () => void;
  onTemplateDeleted?: () => void;
  onTemplateCreated?: (template: TemplateItem) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canListSections: boolean;
  canCreateSection: boolean;
  canUpdateSection: boolean;
  canDeleteSection: boolean;
}

export function TemplateContent({ 
  selectedTemplate, 
  onRefresh,
  onTemplateDeleted,
  onTemplateCreated,
  onToggleSidebar,
  // canCreate,
  canUpdate,
  canDelete,
  canListSections,
  canCreateSection,
  canUpdateSection,
  canDeleteSection,
}: TemplateContentProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { t } = useTranslation(['templates', 'common']);
  const { selectedOrganizationId } = useOrganization();

  // Estados principales
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [orderedSections, setOrderedSections] = useState<any[]>([]);
  const [isGeneratingIndividual, setIsGeneratingIndividual] = useState(false);
  const [activeTab, setActiveTab] = useState("sections");

  // Fetch template details
  const { data: templateData, isLoading: isLoadingTemplate, error: templateError, isFetching, refetch } = useQuery({
    queryKey: ['template', selectedTemplate?.id],
    queryFn: () => getTemplateById(selectedTemplate!.id, selectedOrganizationId!),
    enabled: !!selectedTemplate?.id && !!selectedOrganizationId,
    retry: false,
  });

  // Actualizar orderedSections cuando cambien las secciones
  useEffect(() => {
    if (templateData?.sections) {
      const sorted = [...templateData.sections].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setOrderedSections(sorted);
    } else {
      setOrderedSections([]);
    }
  }, [templateData?.sections]);

  // Resetear estados de diálogos cuando cambia el template seleccionado
  useEffect(() => {
    setIsDeleteDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsAddingSectionOpen(false);
  }, [selectedTemplate?.id]);

  // Mutation para generar secciones con AI
  const generateSectionsMutation = useMutation({
    mutationFn: (templateId: string) => generateTemplateSections(templateId, selectedOrganizationId!),
    meta: { successMessage: t('templates:content.sectionsGenerated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
    },
  });

  // Combinar ambos estados de generación
  const isGenerating = generateSectionsMutation.isPending || isGeneratingIndividual;

  if (!selectedTemplate) {
    return (
      <>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <Empty>
            <div className="p-8 text-center">
              <EmptyIcon>
                <FileText className="h-12 w-12" />
              </EmptyIcon>
              <EmptyTitle>{t('templates:content.noTemplateSelectedTitle')}</EmptyTitle>
              <EmptyDescription>
                {t('templates:content.noTemplateSelectedDescription')}
              </EmptyDescription>
              <EmptyActions>
                <HuemulButton
                  icon={FileText}
                  iconClassName="h-4 w-4 mr-2"
                  label={t('templates:content.createTemplate')}
                  className="bg-[#4464f7] hover:bg-[#3451e6]"
                  onClick={() => setIsCreateTemplateDialogOpen(true)}
                />
              </EmptyActions>
            </div>
          </Empty>
        </div>

        {/* Create Template Dialog */}
        <CreateTemplateDialog
          open={isCreateTemplateDialogOpen}
          onOpenChange={setIsCreateTemplateDialogOpen}
          organizationId={selectedOrganizationId!}
          onTemplateCreated={(template) => {
            // Don't close dialog here - CreateTemplateDialog handles it
            // Refresh the templates list
            onRefresh();
            // Select the newly created template
            onTemplateCreated?.(template);
          }}
        />
      </>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <TemplateHeader
          templateName={templateData?.name || selectedTemplate.name}
          templateDescription={templateData?.description}
          isMobile={isMobile}
          hasNoSections={!orderedSections || orderedSections.length === 0}
          isGenerating={isGenerating}
          isRefreshing={isFetching}
          activeTab={activeTab}
          onToggleSidebar={onToggleSidebar}
          onAddSection={() => setIsAddingSectionOpen(true)}
          onGenerateWithAI={() => selectedTemplate?.id && generateSectionsMutation.mutate(selectedTemplate.id)}
          onEdit={() => setIsEditDialogOpen(true)}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
            onRefresh();
          }}
        />

        {/* Content Section */}
        <div className="flex-1 bg-white min-w-0 flex flex-col overflow-hidden">
          {templateError ? (
            <div className="flex flex-col items-center justify-center h-full text-center rounded-lg border border-dashed bg-muted/50 p-8 mx-4">
              <p className="text-red-600 mb-4 font-medium">{(templateError as Error).message || t('templates:content.loadError')}</p>
              <p className="text-sm text-muted-foreground mb-6">
                {t('templates:content.loadErrorDescription')}
              </p>
              <HuemulButton
                icon={RefreshCw}
                iconClassName="h-4 w-4 mr-2"
                label={t('common:tryAgain')}
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] })}
              />
            </div>
          ) : isLoadingTemplate ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="ml-2 text-xs text-gray-500">{t('templates:content.loadingTemplate')}</span>
            </div>
          ) : (
            <Tabs defaultValue={canListSections ? "sections" : "custom-fields"} value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 overflow-hidden">
              <div className="border-b border-border shrink-0 px-1.5 sm:px-2 md:px-3">
                <div className="flex items-center justify-between">
                  <TabsList className="h-auto bg-transparent p-0">
                    {canListSections && (
                      <TabsTrigger 
                        value="sections" 
                        className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                      >
                        {t('templates:content.sectionsTab')}
                      </TabsTrigger>
                    )}
                    <TabsTrigger 
                      value="custom-fields" 
                      className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                    >
                      {t('templates:content.customFieldsTab')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="docx-templates" 
                      className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                    >
                      {t('templates:content.docxTemplatesTab')}
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Action Icons */}
                  <div className="flex items-center gap-1 mr-2">
                    <HuemulButton
                      icon={RefreshCw}
                      iconClassName="h-4 w-4 text-gray-600"
                      variant="ghost"
                      size="sm"
                      loading={isFetching}
                      disabled={isGenerating}
                      tooltip={`${t('common:refresh')} ${activeTab === 'custom-fields' ? t('templates:content.customFieldsTab').toLowerCase() : t('templates:content.sectionsTab').toLowerCase()}`}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={() => { refetch(); }}
                    />
                    {canUpdate && (
                      <HuemulButton
                        icon={Edit3}
                        iconClassName="h-4 w-4 text-gray-600"
                        variant="ghost"
                        size="sm"
                        disabled={isGenerating}
                        tooltip={t('templates:content.editTemplate')}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={() => setIsEditDialogOpen(true)}
                      />
                    )}
                    {canDelete && (
                      <HuemulButton
                        icon={Trash2}
                        iconClassName="h-4 w-4 text-red-500"
                        variant="ghost"
                        size="sm"
                        disabled={isGenerating}
                        tooltip={t('templates:content.deleteTemplate')}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {canListSections && (
                <TabsContent value="sections" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                {/* Fixed Header */}
                <div className="px-4 pt-6 pb-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-foreground">{t('templates:content.sectionsTitle')}</h2>
                      <p className="text-xs text-muted-foreground">
                        {t('templates:content.manageSections')}
                      </p>
                    </div>
                    
                    {orderedSections && orderedSections.length > 0 ? (
                      canCreateSection && (
                        <HuemulButton
                          icon={FileText}
                          iconClassName="mr-1.5 h-3.5 w-3.5"
                          label={t('templates:content.addSection')}
                          size="sm"
                          className="h-8 text-xs px-3"
                          disabled={isGenerating}
                          onClick={() => setIsAddingSectionOpen(true)}
                        />
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        {canCreateSection && (
                          <HuemulButton
                            icon={FileText}
                            iconClassName="mr-1.5 h-3.5 w-3.5"
                            label={t('templates:content.addSection')}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs px-3"
                            disabled={isGenerating}
                            onClick={() => setIsAddingSectionOpen(true)}
                          />
                        )}
                        {canCreateSection && (
                          <HuemulButton
                            icon={Sparkles}
                            iconClassName="mr-1.5 h-3.5 w-3.5"
                            label={t('templates:content.generateWithAI')}
                            size="sm"
                            loading={isGenerating}
                            className="h-8 text-xs px-3"
                            onClick={() => { if (selectedTemplate?.id) generateSectionsMutation.mutate(selectedTemplate.id); }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto px-4 py-6">
                  {orderedSections && orderedSections.length > 0 ? (
                    <TemplateSectionsList
                      sections={orderedSections}
                      templateId={selectedTemplate.id}
                      organizationId={selectedOrganizationId!}
                      onSectionsReorder={setOrderedSections}
                      canUpdate={canUpdateSection}
                      canDelete={canDeleteSection}
                    />
                  ) : (
                    <TemplateEmptyState
                      isGenerating={isGenerating}
                      onAddSection={() => setIsAddingSectionOpen(true)}
                      onGenerateWithAI={() => selectedTemplate?.id && generateSectionsMutation.mutate(selectedTemplate.id)}
                      canCreate={canCreateSection}
                    />
                  )}
                </div>
              </TabsContent>
              )}

              <TabsContent value="custom-fields" className="mt-0 flex-1 overflow-auto bg-gray-50">
                {selectedTemplate && (
                  <TemplateCustomFields templateId={selectedTemplate.id} />
                )}
              </TabsContent>

              <TabsContent value="docx-templates" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                {selectedTemplate && (
                  <TemplateDocxList
                    templateId={selectedTemplate.id}
                    organizationId={selectedOrganizationId!}
                    canCreate={canUpdate}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedTemplate && templateData && (
        <EditTemplateDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          templateId={selectedTemplate.id}
          templateName={templateData.name}
          templateDescription={templateData.description}
          organizationId={selectedOrganizationId!}
          onSuccess={() => {
            // Solo refrescar el template actual, no toda la lista
            queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
          }}
        />
      )}

      {selectedTemplate && (
        <>
          <DeleteTemplateDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            templateId={selectedTemplate.id}
            templateName={selectedTemplate.name}
            organizationId={selectedOrganizationId!}
            onSuccess={() => {
              onRefresh();
              onTemplateDeleted?.();
            }}
          />

          <AddSectionDialog
            open={isAddingSectionOpen}
            onOpenChange={setIsAddingSectionOpen}
            templateId={selectedTemplate.id}
            organizationId={selectedOrganizationId!}
            existingSections={orderedSections}
            onGeneratingChange={setIsGeneratingIndividual}
          />
        </>
      )}
    </div>
  );
}