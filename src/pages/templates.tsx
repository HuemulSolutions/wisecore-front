import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getAllTemplates } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { TemplateContent } from "@/components/templates/templates-content";
import { TemplatesSidebar } from "@/components/templates/templates-sidebar";

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

  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile);
  const hasRestoredRef = useRef(false);

  // Query para listar templates
  const { data: templatesData, error: queryError, isFetching } = useQuery({
    queryKey: ["templates", selectedOrganizationId],
    queryFn: () => getAllTemplates(selectedOrganizationId!),
    enabled: !!selectedOrganizationId,
    retry: false,
  });

  const templates = templatesData || [];

  // Manejar selección de template
  const handleTemplateSelect = (template: TemplateItem) => {
    setSelectedTemplate(template);
    navigate(`/templates/${template.id}`, { replace: true });
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

  // Reset cuando cambia la organización
  useEffect(() => {
    setSelectedTemplate(null);
    hasRestoredRef.current = false;
  }, [selectedOrganizationId]);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Templates Sidebar */}
      <TemplatesSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={isMobile}
        templates={templates}
        isLoading={isFetching}
        error={queryError}
        selectedTemplateId={selectedTemplate?.id || null}
        onTemplateSelect={handleTemplateSelect}
        organizationId={selectedOrganizationId}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId] })}
      />

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