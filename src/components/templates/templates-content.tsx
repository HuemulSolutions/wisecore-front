import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTemplateById, generateTemplateSections } from "@/services/templates";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";
import { TemplateHeader } from "./templates-header";
import { EditTemplateDialog } from "./templates-edit-dialog";
import { DeleteTemplateDialog } from "./templates-delete-dialog";
import { AddSectionDialog } from "./templates-add-section-dialog";
import { TemplateSectionsList } from "./templates-sections-list";
import { TemplateEmptyState } from "./templates-empty-state";
import { TemplateCustomFields } from "../templates-custom-fields/templates-custom-fields";

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
  const [orderedSections, setOrderedSections] = useState<any[]>([]);
  const [isGeneratingIndividual, setIsGeneratingIndividual] = useState(false);

  // Fetch template details
  const { data: templateData, isLoading: isLoadingTemplate, error: templateError, isFetching } = useQuery({
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
    onSuccess: () => {
      toast.success("Sections generated successfully with AI");
      queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] });
    },
    onError: (error: Error) => {
      toast.error("Error generating sections with AI: " + error.message);
    }
  });

  // Combinar ambos estados de generación
  const isGenerating = generateSectionsMutation.isPending || isGeneratingIndividual;

  if (!selectedTemplate) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1.5">No Template Selected</h3>
          <p className="text-sm text-gray-500">Select a template from the sidebar to view and edit its sections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <TemplateHeader
          templateName={selectedTemplate.name}
          templateDescription={templateData?.description}
          isMobile={isMobile}
          hasNoSections={!orderedSections || orderedSections.length === 0}
          isGenerating={isGenerating}
          isRefreshing={isFetching}
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
        <div className="flex-1 bg-white min-w-0 overflow-auto">
          <div className="py-1.5 md:py-2 px-1.5 sm:px-2 md:px-3">
            {templateError ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8 mx-4">
                <p className="text-red-600 mb-4 font-medium">{(templateError as Error).message || 'Failed to load template'}</p>
                <p className="text-sm text-muted-foreground mb-6">
                  There was an error loading the template details. Please try again.
                </p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['template', selectedTemplate?.id] })} 
                  variant="outline" 
                  className="hover:cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : isLoadingTemplate ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-xs text-gray-500">Loading template...</span>
              </div>
            ) : (
              <Tabs defaultValue="sections" className="w-full">
                <div className="border-b border-border mb-6">
                  <TabsList className="h-auto w-full justify-start bg-transparent p-0">
                    <TabsTrigger 
                      value="sections" 
                      className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                    >
                      Sections
                    </TabsTrigger>
                    <TabsTrigger 
                      value="custom-fields" 
                      className="relative h-10 px-4 py-2 bg-transparent border-0 rounded-none text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:content-['']"
                    >
                      Custom Fields
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="sections" className="mt-0">
                  <div className="max-w-full">
                    {orderedSections && orderedSections.length > 0 ? (
                      <TemplateSectionsList
                        sections={orderedSections}
                        templateId={selectedTemplate.id}
                        organizationId={selectedOrganizationId!}
                        onSectionsReorder={setOrderedSections}
                      />
                    ) : (
                      <TemplateEmptyState
                        isGenerating={isGenerating}
                        onAddSection={() => setIsAddingSectionOpen(true)}
                        onGenerateWithAI={() => selectedTemplate?.id && generateSectionsMutation.mutate(selectedTemplate.id)}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="custom-fields" className="mt-0">
                  {selectedTemplate && (
                    <TemplateCustomFields templateId={selectedTemplate.id} />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
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
          onSuccess={onRefresh}
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