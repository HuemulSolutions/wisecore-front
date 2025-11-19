import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getAllTemplates, addTemplate, deleteTemplate } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import { Plus, FileText, Loader2, Search, FolderTree, Edit3, Trash2, AlertCircle, FileCode } from "lucide-react";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { TemplateContent } from "@/components/templates/template-content";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";


interface TemplateItem {
  id: string;
  name: string;
  description?: string;
}

export default function Templates() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: templateId } = useParams<{ id?: string }>();
  const { selectedOrganizationId } = useOrganization();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar(); // Hook para controlar el app sidebar

  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasRestoredRef = useRef(false);

  // Query para listar templates
  const { data: templatesData, isLoading, error: queryError } = useQuery({
    queryKey: ["templates", selectedOrganizationId],
    queryFn: () => getAllTemplates(selectedOrganizationId!),
    enabled: !!selectedOrganizationId,
  });

  const templates = templatesData || [];

  // Filtrar templates basado en búsqueda
  const getFilteredTemplates = (): TemplateItem[] => {
    if (!searchTerm) return templates;
    return templates.filter((template: TemplateItem) => 
      template.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredTemplates = getFilteredTemplates();

  // Mutation para crear template
  const createTemplateMutation = useMutation({
    mutationFn: (newData: { name: string; description: string; organization_id: string }) =>
      addTemplate(newData),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId] });
      setSelectedTemplate({ id: created.id, name: created.name, description: created.description });
      navigate(`/templates/${created.id}`, { replace: true });
      setNewName("");
      setNewDescription("");
      setError(null);
      setIsDialogOpen(false);
      toast.success("Template created successfully");
    },
    onError: (error: Error) => {
      setError(error.message || "An error occurred while creating the template");
    },
  });

  // Mutation para eliminar template
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId] });
      setSelectedTemplate(null);
      navigate('/templates', { replace: true });
      toast.success("Template deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Error deleting template: " + error.message);
    },
  });

  // Manejar creación de template
  const handleCreateTemplate = () => {
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }
    if (!selectedOrganizationId) {
      setError("Organization is required");
      return;
    }
    setError(null);
    createTemplateMutation.mutate({
      name: newName,
      description: newDescription,
      organization_id: selectedOrganizationId,
    });
  };

  // Manejar selección de template
  const handleTemplateSelect = (template: TemplateItem) => {
    setSelectedTemplate(template);
    navigate(`/templates/${template.id}`, { replace: true });
  };

  // Manejar eliminación de template
  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  // Inicializar desde URL
  useEffect(() => {
    if (hasRestoredRef.current || !selectedOrganizationId || !templates.length) return;

    if (templateId) {
      const template = templates.find((t: TemplateItem) => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }

    hasRestoredRef.current = true;
  }, [selectedOrganizationId, templates, templateId]);

  // Cerrar app sidebar automáticamente en móvil cuando se accede a Templates
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  // Reset cuando cambia la organización
  useEffect(() => {
    setSelectedTemplate(null);
    hasRestoredRef.current = false;
  }, [selectedOrganizationId]);

  if (isLoading && !templates.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4464f7] mx-auto mb-4" />
          <p className="text-gray-500">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 bg-gray-50">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">Error loading templates</h3>
          <p className="text-sm text-gray-600">{(queryError as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Templates Sidebar */}
      <CollapsibleSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        position="left"
        toggleAriaLabel={isSidebarOpen ? "Hide templates" : "Show templates"}
        mobileTitle="Templates Navigator"
        customToggleIcon={<FolderTree className="h-4 w-4" />}
        customToggleIconMobile={<FolderTree className="h-5 w-5" />}
        showToggleButton={!isMobile}
        header={
          <>
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 pr-12 sm:pr-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-8 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 hover:cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200 flex-shrink-0"
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={(e) => { e.preventDefault(); handleCreateTemplate(); }}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileCode className="h-5 w-5 text-[#4464f7]" />
                          New Template
                        </DialogTitle>
                        <DialogDescription>
                          Complete the fields below to create a new template.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {error && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{error}</span>
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="template-name" className="text-sm font-medium text-gray-900 block mb-2">
                              Template Name *
                            </label>
                            <Input
                              id="template-name"
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Enter template name..."
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="template-description" className="text-sm font-medium text-gray-900 block mb-2">
                              Description
                            </label>
                            <Input
                              id="template-description"
                              type="text"
                              value={newDescription}
                              onChange={(e) => setNewDescription(e.target.value)}
                              placeholder="Enter template description (optional)..."
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNewName("");
                            setNewDescription("");
                            setError(null);
                            setIsDialogOpen(false);
                          }}
                          disabled={createTemplateMutation.isPending}
                          className="hover:cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={!newName.trim() || !selectedOrganizationId || createTemplateMutation.isPending} 
                          className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                        >
                          {createTemplateMutation.isPending ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <FileCode className="mr-2 h-4 w-4" />
                              Create Template
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </>
        }
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm mb-2">
                    {searchTerm ? 'No templates match your search' : 'No templates found'}
                  </p>
                  {!searchTerm && (
                    <p className="text-xs">Create your first template to get started</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTemplates.map((template: TemplateItem) => (
                    <ContextMenu key={template.id}>
                      <ContextMenuTrigger asChild>
                        <div
                          className={`p-2 rounded-md cursor-pointer transition-colors border ${
                            selectedTemplate?.id === template.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                          }`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <FileCode className={`h-4 w-4 ${
                                selectedTemplate?.id === template.id
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className={`font-medium text-sm truncate ${
                                selectedTemplate?.id === template.id
                                  ? 'text-blue-900'
                                  : 'text-gray-900'
                              }`}>
                                {template.name}
                              </h3>
                              {template.description && (
                                <p className={`text-xs truncate mt-0.5 ${
                                  selectedTemplate?.id === template.id
                                    ? 'text-blue-600'
                                    : 'text-gray-500'
                                }`}>
                                  {template.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          className="hover:cursor-pointer"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit Template
                        </ContextMenuItem>
                        <ContextMenuItem
                          className="hover:cursor-pointer text-red-600"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Template
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              className="hover:cursor-pointer"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </CollapsibleSidebar>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0">
        <div className="flex-1 overflow-auto bg-white min-w-0">
          <TemplateContent
            selectedTemplate={selectedTemplate}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId] })}
            onTemplateDeleted={() => {
              setSelectedTemplate(null);
              navigate('/templates', { replace: true });
            }}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>
      </div>
    </div>
  );
}