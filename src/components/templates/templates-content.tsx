import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, RefreshCw, Edit3, Trash2, Sparkles, Copy, Plus, FileJson } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { TemplateInfoSheet } from "./templates-info-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTemplateById, generateTemplateSections } from "@/services/templates";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrganization } from "@/contexts/organization-context";
import { TemplateHeader } from "./templates-header";
import { EditTemplateDialog } from "./templates-edit-dialog";
import { DeleteTemplateDialog } from "./templates-delete-dialog";
import { CloneTemplateDialog } from "./templates-clone-dialog";
import { AddSectionDialog } from "./templates-add-section-dialog";
import { TemplateSectionsList } from "./templates-sections-list";
import { TemplateEmptyState } from "./templates-empty-state";
import { TemplateCustomFields } from "../templates-custom-fields/templates-custom-fields";
import { CreateTemplateDialog } from "./templates-create-dialog";
import { TemplatesImportSheet } from "./templates-import-sheet";
import { TemplateDocxList } from "./templates-docx-list";
import { TemplateMediaTab } from "./templates-media-tab";
import { TemplateContextTab } from "./templates-context-tab";
import { TemplateDependenciesTab } from "./templates-dependencies-tab";
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied";
import type { TemplateContentProps } from '@/types/templates';
export type { TemplateContentProps } from '@/types/templates';

export function TemplateContent({
  selectedTemplate,
  onRefresh,
  onTemplateDeleted,
  onTemplateCreated,
  onToggleSidebar,
  canCreate,
  canUpdate,
  canDelete,
  canListSections,
  canCreateSection,
  canUpdateSection,
  canDeleteSection,
  canListCustomFields,
  canCreateCustomField,
  canUpdateCustomField,
  canDeleteCustomField,
  canListDocx,
  canCreateDocx,
  canUpdateDocx,
  canDeleteDocx,
  canListMedia,
  canCreateMedia,
  canUpdateMedia,
  canDeleteMedia,
  canViewTags,
  canManageTags,
  canListTemplateContext,
  canManageTemplateContext,
  canListTemplateDependencies,
  canManageTemplateDependencies,
  canPickAssetsForDependencies,
}: TemplateContentProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { t } = useTranslation(['templates', 'context', 'dependencies', 'common']);
  const { selectedOrganizationId } = useOrganization();

  // Estados principales
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [orderedSections, setOrderedSections] = useState<any[]>([]);
  const [isGeneratingIndividual, setIsGeneratingIndividual] = useState(false);

  // Pestañas visibles según permisos. `requestedTab` guarda lo que el usuario
  // clickeó; si esa pestaña deja de estar disponible (permisos que llegan
  // async, o el usuario nunca la tuvo) se cae a la primera disponible en vez
  // de dejar un <Tabs> apuntando a un value desmontado.
  const availableTabs = useMemo(
    () =>
      ([
        canListSections && "sections",
        canListCustomFields && "custom-fields",
        canListTemplateContext && "context",
        canListTemplateDependencies && "dependencies",
        canListMedia && "media",
        canListDocx && "docx-templates",
      ].filter(Boolean) as string[]),
    [canListSections, canListCustomFields, canListTemplateContext, canListTemplateDependencies, canListMedia, canListDocx]
  );
  const [requestedTab, setRequestedTab] = useState<string | null>(null);
  const activeTab = (requestedTab && availableTabs.includes(requestedTab)) ? requestedTab : availableTabs[0];
  const setActiveTab = (tab: string) => setRequestedTab(tab);

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
        <div className="h-full overflow-y-auto bg-[#f7f8fa]">
          <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-8 pt-10 pb-12">
            {/* Introducción */}
            <div>
              <h1 className="text-[25px] font-semibold tracking-[-0.01em] text-slate-900">
                {t('templates:sidebar.title')}
              </h1>
              <p className="mt-2 max-w-[680px] text-pretty text-sm leading-[1.6] text-[#64748b]">
                {t('templates:content.emptyMainDescription')}
              </p>
            </div>

            {/* Tarjeta guía */}
            <div className="flex flex-col gap-5 rounded-[14px] border border-[#e2e8f0] bg-white p-6">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">
                  {t('templates:content.emptyMainGuideTitle')}
                </h2>
                <p className="mt-1 text-[13px] text-[#64748b]">
                  {t('templates:content.emptyMainGuideSubtitle')}
                </p>
              </div>

              <div
                className="grid items-start gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
              >
                {/* Paso 1 */}
                <div className="flex flex-col gap-2">
                  <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-semibold text-white">
                    1
                  </div>
                  <h3 className="text-[13px] font-semibold text-slate-900">
                    {t('templates:content.emptyMainStep1Title')}
                  </h3>
                  <p className="text-[13px] leading-[1.55] text-[#64748b]">
                    {t('templates:content.emptyMainStep1Description')}
                  </p>
                  {canCreate && (
                    <HuemulButton
                      icon={Plus}
                      iconClassName="h-4 w-4 mr-1.5"
                      label={t('templates:sidebar.newTemplate')}
                      className="mt-1 h-[34px] w-fit rounded-lg bg-[#2563eb] px-3 text-sm hover:bg-[#1d4ed8]"
                      onClick={() => setIsCreateTemplateDialogOpen(true)}
                    />
                  )}
                </div>

                {/* Paso 2 */}
                <div className="flex flex-col gap-2">
                  <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#e8edf5] text-[11px] font-semibold text-[#475569]">
                    2
                  </div>
                  <h3 className="text-[13px] font-semibold text-slate-900">
                    {t('templates:content.emptyMainStep2Title')}
                  </h3>
                  <p className="text-[13px] leading-[1.55] text-[#64748b]">
                    {t('templates:content.emptyMainStep2DescriptionPre')}
                    <span className="font-semibold text-[#475569]">
                      {t('templates:content.emptyMainStep2DescriptionHighlight')}
                    </span>
                    {t('templates:content.emptyMainStep2DescriptionPost')}
                  </p>
                </div>

                {/* Paso 3 */}
                <div className="flex flex-col gap-2">
                  <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#e8edf5] text-[11px] font-semibold text-[#475569]">
                    3
                  </div>
                  <h3 className="text-[13px] font-semibold text-slate-900">
                    {t('templates:content.emptyMainStep3Title')}
                  </h3>
                  <p className="text-[13px] leading-[1.55] text-[#64748b]">
                    {t('templates:content.emptyMainStep3DescriptionPre')}
                    <span className="font-semibold text-[#475569]">
                      {t('templates:content.emptyMainStep3DescriptionHighlight')}
                    </span>
                    {t('templates:content.emptyMainStep3DescriptionPost')}
                    <span className="font-semibold text-[#475569]">
                      {t('templates:content.emptyMainStep3DescriptionEnd')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t border-dashed border-[#e2e8f0]" />

              <div>
                <p className="mb-3 text-[13px] font-semibold text-slate-900">
                  {t('templates:content.emptyMainSectionTypesTitle')}
                </p>
                <div
                  className="grid gap-2.5"
                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}
                >
                  <div className="rounded-[10px] border border-[#eef1f5] bg-[#fafbfc] p-3">
                    <p className="text-xs font-semibold text-[#475569]">
                      {t('templates:content.emptyMainTypeFormName')}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {t('templates:content.emptyMainTypeFormDescription')}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-[#eef1f5] bg-[#fafbfc] p-3">
                    <p className="text-xs font-semibold text-[#1d4ed8]">
                      {t('templates:content.emptyMainTypeAiName')}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {t('templates:content.emptyMainTypeAiDescription')}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-[#eef1f5] bg-[#fafbfc] p-3">
                    <p className="text-xs font-semibold text-[#15803d]">
                      {t('templates:content.emptyMainTypeManualName')}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {t('templates:content.emptyMainTypeManualDescription')}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-[#eef1f5] bg-[#fafbfc] p-3">
                    <p className="text-xs font-semibold text-[#6d28d9]">
                      {t('templates:content.emptyMainTypeReferenceName')}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {t('templates:content.emptyMainTypeReferenceDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Salida alternativa */}
            <div className="flex items-center gap-3">
              <p className="text-[13px] text-[#64748b]">
                {t('templates:content.emptyMainImportQuestion')}
              </p>
              <HuemulButton
                icon={FileJson}
                iconClassName="h-4 w-4 mr-1.5"
                label={t('templates:sidebar.footerImport')}
                variant="outline"
                className="h-[34px] rounded-lg border-[#d7dde5] bg-white text-sm hover:bg-[#f4f6f8]"
                onClick={() => setIsImportSheetOpen(true)}
              />
            </div>
          </div>
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

        {/* Import JSON Sheet */}
        <TemplatesImportSheet
          open={isImportSheetOpen}
          onOpenChange={setIsImportSheetOpen}
          organizationId={selectedOrganizationId}
          onImportSuccess={onRefresh}
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
          templateInstructions={templateData?.instructions ?? undefined}
          isMobile={isMobile}
          hasNoSections={!orderedSections || orderedSections.length === 0}
          isGenerating={isGenerating}
          activeTab={activeTab}
          canCreateSection={canCreateSection}
          onToggleSidebar={onToggleSidebar}
          onAddSection={() => setIsAddingSectionOpen(true)}
          onGenerateWithAI={() => selectedTemplate?.id && generateSectionsMutation.mutate(selectedTemplate.id)}
          onEdit={() => setIsEditDialogOpen(true)}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onInfo={() => setIsInfoSheetOpen(true)}
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
          ) : availableTabs.length === 0 ? (
            <HuemulAccessDenied variant="inline" />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 overflow-hidden">
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
                    {canListCustomFields && (
                      <TabsTrigger
                        value="custom-fields"
                        className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                      >
                        {t('templates:content.customFieldsTab')}
                      </TabsTrigger>
                    )}
                    {canListTemplateContext && (
                      <TabsTrigger
                        value="context"
                        className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                      >
                        {t('templates:content.contextTab')}
                      </TabsTrigger>
                    )}
                    {canListTemplateDependencies && (
                      <TabsTrigger
                        value="dependencies"
                        className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                      >
                        {t('templates:content.dependenciesTab')}
                      </TabsTrigger>
                    )}
                    {canListMedia && (
                      <TabsTrigger
                        value="media"
                        className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                      >
                        {t('templates:content.mediaTab')}
                      </TabsTrigger>
                    )}
                    {canListDocx && (
                      <TabsTrigger
                        value="docx-templates"
                        className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                      >
                        {t('templates:content.docxTemplatesTab')}
                      </TabsTrigger>
                    )}
                  </TabsList>
                  
                  {/* Action Icons */}
                  <div className="flex items-center gap-1 mr-2">
                    {/* La pestaña "Secciones" usa los mismos datos del template (sin query propia),
                        así que es la única que se refresca desde aquí; custom-fields/context/
                        dependencies/media/docx ya llevan su propio strip de refresh (§3 refresh-button-guide). */}
                    {activeTab === 'sections' && (
                      <HuemulButton
                        icon={RefreshCw}
                        iconClassName="h-4 w-4 text-gray-600"
                        variant="ghost"
                        size="sm"
                        loading={isFetching}
                        disabled={isGenerating}
                        tooltip={t('common:refresh')}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={() => { refetch(); }}
                      />
                    )}
                    {canCreate && (
                      <HuemulButton
                        icon={Copy}
                        iconClassName="h-4 w-4 text-gray-600"
                        variant="ghost"
                        size="sm"
                        disabled={isGenerating}
                        tooltip={t('templates:content.cloneTemplate')}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={() => setIsCloneDialogOpen(true)}
                      />
                    )}
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

              {canListCustomFields && (
                <TabsContent value="custom-fields" className="mt-0 flex-1 overflow-auto bg-gray-50">
                  {selectedTemplate && (
                    <TemplateCustomFields
                      templateId={selectedTemplate.id}
                      canCreate={canCreateCustomField}
                      canUpdate={canUpdateCustomField}
                      canDelete={canDeleteCustomField}
                    />
                  )}
                </TabsContent>
              )}

              {canListTemplateContext && (
                <TabsContent value="context" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                  {selectedTemplate && (
                    <TemplateContextTab
                      templateId={selectedTemplate.id}
                      organizationId={selectedOrganizationId!}
                      canManage={canManageTemplateContext}
                    />
                  )}
                </TabsContent>
              )}

              {canListTemplateDependencies && (
                <TabsContent value="dependencies" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                  {selectedTemplate && (
                    <TemplateDependenciesTab
                      templateId={selectedTemplate.id}
                      organizationId={selectedOrganizationId!}
                      canManage={canManageTemplateDependencies}
                      canPickAssets={canPickAssetsForDependencies}
                    />
                  )}
                </TabsContent>
              )}

              {canListMedia && (
                <TabsContent value="media" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                  {selectedTemplate && (
                    <TemplateMediaTab
                      templateId={selectedTemplate.id}
                      organizationId={selectedOrganizationId!}
                      canCreate={canCreateMedia}
                      canUpdate={canUpdateMedia}
                      canDelete={canDeleteMedia}
                    />
                  )}
                </TabsContent>
              )}

              {canListDocx && (
                <TabsContent value="docx-templates" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                  {selectedTemplate && (
                    <TemplateDocxList
                      templateId={selectedTemplate.id}
                      organizationId={selectedOrganizationId!}
                      canCreate={canCreateDocx}
                      canUpdate={canUpdateDocx}
                      canDelete={canDeleteDocx}
                    />
                  )}
                </TabsContent>
              )}
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
          templateInstructions={templateData.instructions ?? undefined}
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

          <CloneTemplateDialog
            open={isCloneDialogOpen}
            onOpenChange={setIsCloneDialogOpen}
            templateId={selectedTemplate.id}
            organizationId={selectedOrganizationId!}
            onSuccess={(cloned) => {
              onRefresh();
              onTemplateCreated?.(cloned);
            }}
          />
        </>
      )}

      {/* Info Sheet */}
      <TemplateInfoSheet
        open={isInfoSheetOpen}
        onOpenChange={setIsInfoSheetOpen}
        templateData={templateData}
        selectedTemplate={selectedTemplate}
        sectionsCount={orderedSections.length}
        canViewTags={canViewTags}
        canManageTags={canManageTags}
      />
    </div>
  );
}