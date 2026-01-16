import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getAllTemplates } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import { TemplateContent } from "@/components/templates/templates-content";
import { TemplatesSidebar } from "@/components/templates/templates-sidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

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
  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
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
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Templates Sidebar */}
        <ResizablePanel defaultSize={15} minSize={15} maxSize={30}>
          <TemplatesSidebar
            templates={templates}
            isLoading={isFetching}
            error={queryError}
            selectedTemplateId={selectedTemplate?.id || null}
            onTemplateSelect={handleTemplateSelect}
            organizationId={selectedOrganizationId}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId] })}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Main Content */}
        <ResizablePanel defaultSize={80}>
          <div className="h-full overflow-auto bg-white">
            <TemplateContent
              selectedTemplate={selectedTemplate}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId] })}
              onTemplateDeleted={() => {
                setSelectedTemplate(null);
                navigate('/templates', { replace: true });
              }}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}