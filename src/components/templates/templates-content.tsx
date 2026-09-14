import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Loader2, RefreshCw, LayoutList, Settings, Files } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { TemplateInfoSheet } from "./templates-info-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTemplateById, generateTemplateSections, exportTemplates } from "@/services/templates";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrganization } from "@/contexts/organization-context";
import { TemplateHeader } from "./templates-header";
import { EditTemplateDialog } from "./templates-edit-dialog";
import { DeleteTemplateDialog } from "./templates-delete-dialog";
import { CloneTemplateDialog } from "./templates-clone-dialog";
import { AddSectionDialog } from "./templates-add-section-dialog";
import { TemplateStructureTab } from "./templates-structure-tab";
import { TemplateSettingsTab } from "./templates-settings-tab";
import { TemplateDocumentsTab } from "./templates-documents-tab";
import { CreateTemplateDialog } from "./templates-create-dialog";
import { TemplatesImportSheet } from "./templates-import-sheet";
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied";
import type { TemplateContentProps } from '@/types/templates';
import type { SortableSectionItem } from '@/types/sections/core';
export type { TemplateContentProps } from '@/types/templates';

function TabPill({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-[#f1f4f7] px-1.5 py-px text-[11px] text-[#64748b]">
      {count}
    </span>
  );
}

export function TemplateContent({
  selectedTemplate,
  onRefresh,
  onTemplateDeleted,
  onTemplateCreated,
  onToggleSidebar,
  canCreate,
  canUpdate,
  canDelete,
  canExportTemplate,
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
  canListChildDocuments,
}: TemplateContentProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { t } = useTranslation(['templates', 'context', 'dependencies', 'common']);
  const { selectedOrganizationId } = useOrganization();

  // Estados principales
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  const [sectionDefaultType, setSectionDefaultType] = useState<'ai' | 'manual' | 'reference' | 'form' | undefined>(undefined);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [orderedSections, setOrderedSections] = useState<SortableSectionItem[]>([]);
  const [isGeneratingIndividual, setIsGeneratingIndividual] = useState(false);
  const [documentsCount, setDocumentsCount] = useState<number | undefined>(undefined);
  const [settingsCount, setSettingsCount] = useState<number | undefined>(undefined);

  // Pestañas visibles según permisos. `requestedTab` guarda lo que el usuario
  // clickeó; si esa pestaña deja de estar disponible (permisos que llegan
  // async, o el usuario nunca la tuvo) se cae a la primera disponible en vez
  // de dejar un <Tabs> apuntando a un value desmontado.
  const canListSettings = canListCustomFields || canListTemplateContext || canListTemplateDependencies || canListMedia || canListDocx;
  const availableTabs = useMemo(
    () =>
      ([
        canListSections && "structure",
        canListSettings && "settings",
        canListChildDocuments && "documents",
      ].filter(Boolean) as string[]),
    [canListSections, canListSettings, canListChildDocuments]
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
      const sorted = [...templateData.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
    setSectionDefaultType(undefined);
    setDocumentsCount(undefined);
    setSettingsCount(undefined);
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

  const handleExportJson = async () => {
    if (!selectedOrganizationId || !selectedTemplate) return;
    try {
      await exportTemplates(selectedOrganizationId, { template_ids: [selectedTemplate.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('templates:sidebar.exportTemplateError'));
    }
  };

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
                      icon={FileText}
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
                icon={FileText}
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
          isGenerating={isGenerating}
          activeTab={activeTab}
          canCreateSection={canCreateSection}
          onToggleSidebar={onToggleSidebar}
          onAddSection={() => setIsAddingSectionOpen(true)}
          onEdit={() => setIsEditDialogOpen(true)}
          canUpdate={canUpdate}
          onDelete={() => setIsDeleteDialogOpen(true)}
          canDelete={canDelete}
          onInfo={() => setIsInfoSheetOpen(true)}
          onDuplicate={() => setIsCloneDialogOpen(true)}
          canDuplicate={canCreate}
          onExportJson={handleExportJson}
          canExportJson={canExportTemplate}
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
              <div className="border-b border-[#eef1f5] shrink-0 px-8">
                <TabsList className="h-auto gap-6.5 overflow-x-auto bg-transparent p-0">
                  {canListSections && (
                    <TabsTrigger
                      value="structure"
                      className="flex items-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2.75 text-[13px] text-[#64748b] shadow-none transition-colors hover:text-[#0f172a] data-[state=active]:border-[#2563eb] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#2563eb] data-[state=active]:shadow-none"
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                      {t('templates:content.sectionsTab')}
                      <TabPill count={orderedSections.length} />
                    </TabsTrigger>
                  )}
                  {canListSettings && (
                    <TabsTrigger
                      value="settings"
                      className="flex items-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2.75 text-[13px] text-[#64748b] shadow-none transition-colors hover:text-[#0f172a] data-[state=active]:border-[#2563eb] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#2563eb] data-[state=active]:shadow-none"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      {t('templates:content.settingsTab')}
                      {settingsCount !== undefined && <TabPill count={settingsCount} />}
                    </TabsTrigger>
                  )}
                  {canListChildDocuments && (
                    <TabsTrigger
                      value="documents"
                      className="flex items-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2.75 text-[13px] text-[#64748b] shadow-none transition-colors hover:text-[#0f172a] data-[state=active]:border-[#2563eb] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#2563eb] data-[state=active]:shadow-none"
                    >
                      <Files className="h-3.5 w-3.5" />
                      {t('templates:content.documentsTab')}
                      {documentsCount !== undefined && <TabPill count={documentsCount} />}
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {canListSections && (
                <TabsContent value="structure" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                  <TemplateStructureTab
                    templateId={selectedTemplate.id}
                    templateName={selectedTemplate.name}
                    organizationId={selectedOrganizationId!}
                    documentTypeId={templateData?.document_type_id}
                    sections={orderedSections}
                    isGenerating={isGenerating}
                    onGenerateWithAI={() => { if (selectedTemplate?.id) generateSectionsMutation.mutate(selectedTemplate.id); }}
                    onAddSection={() => setIsAddingSectionOpen(true)}
                    onAddSectionWithType={(type) => {
                      setSectionDefaultType(type);
                      setIsAddingSectionOpen(true);
                    }}
                    onSectionsReorder={setOrderedSections}
                    onImportStructure={() => setIsImportSheetOpen(true)}
                    onRefreshTemplate={() => { refetch(); }}
                    isFetchingTemplate={isFetching}
                    canListSections={canListSections}
                    canCreateSection={canCreateSection}
                    canUpdateSection={canUpdateSection}
                    canDeleteSection={canDeleteSection}
                  />
                </TabsContent>
              )}

              {canListSettings && (
                <TabsContent value="settings" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                  <TemplateSettingsTab
                    templateId={selectedTemplate.id}
                    organizationId={selectedOrganizationId!}
                    canListCustomFields={canListCustomFields}
                    canCreateCustomField={canCreateCustomField}
                    canUpdateCustomField={canUpdateCustomField}
                    canDeleteCustomField={canDeleteCustomField}
                    canListTemplateContext={canListTemplateContext}
                    canManageTemplateContext={canManageTemplateContext}
                    canListTemplateDependencies={canListTemplateDependencies}
                    canManageTemplateDependencies={canManageTemplateDependencies}
                    canPickAssetsForDependencies={canPickAssetsForDependencies}
                    canListMedia={canListMedia}
                    canCreateMedia={canCreateMedia}
                    canUpdateMedia={canUpdateMedia}
                    canDeleteMedia={canDeleteMedia}
                    canListDocx={canListDocx}
                    canCreateDocx={canCreateDocx}
                    canUpdateDocx={canUpdateDocx}
                    canDeleteDocx={canDeleteDocx}
                    onCountChange={setSettingsCount}
                  />
                </TabsContent>
              )}

              {canListChildDocuments && (
                <TabsContent value="documents" className="mt-0 flex-1 flex flex-col overflow-hidden bg-gray-50">
                  <TemplateDocumentsTab
                    templateId={selectedTemplate.id}
                    organizationId={selectedOrganizationId!}
                    canList={canListChildDocuments}
                    onCountChange={setDocumentsCount}
                  />
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
            onOpenChange={(open) => {
              setIsAddingSectionOpen(open);
              if (!open) setSectionDefaultType(undefined);
            }}
            templateId={selectedTemplate.id}
            organizationId={selectedOrganizationId!}
            existingSections={orderedSections}
            onGeneratingChange={setIsGeneratingIndividual}
            defaultType={sectionDefaultType}
            containerName={selectedTemplate.name}
          />

          <TemplatesImportSheet
            open={isImportSheetOpen}
            onOpenChange={setIsImportSheetOpen}
            organizationId={selectedOrganizationId}
            onImportSuccess={onRefresh}
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
