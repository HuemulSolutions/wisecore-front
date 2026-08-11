import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getAllTemplates } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useOrgNavigate } from "@/hooks/useOrgRouter";
import { TemplateContent } from "@/components/templates/templates-content";
import { TemplatesSidebar } from "@/components/templates/templates-sidebar";
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout";
import { HuemulPagination } from "@/huemul/components/huemul-pagination";
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied";
import { PageSkeleton } from "@/components/ui/page-skeleton";

import type { TemplateItem } from "@/types/templates"

export default function Templates() {
  const queryClient = useQueryClient();
    const navigate = useOrgNavigate();
  const { id: templateId } = useParams<{ id?: string }>();
  const { selectedOrganizationId } = useOrganization();

  // Permisos
  // NOTA: NO usar isRootAdmin como bypass — solo isOrgAdmin hace bypass, y ese
  // ya está aplicado dentro de canCreate/canRead/canUpdate/canDelete/canList
  // (ver useUserPermissions.ts). Ver ia context/rbac-permissions-guide.md.
  const {
    hasAnyPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canList,
    isLoading: isLoadingPermissions,
  } = useUserPermissions();

  // Permisos específicos — template
  const canListTemplates = hasAnyPermission(['template:l', 'template:r']);
  const canCreateTemplate = canCreate('template');
  const canUpdateTemplate = canUpdate('template');
  const canDeleteTemplate = canDelete('template');
  const canExportTemplate = canRead('template');
  const canImportTemplate = canCreate('template') && canUpdate('template');

  // Permisos específicos — template_section
  const canListSections = hasAnyPermission(['template_section:l', 'template_section:r']);
  const canCreateSection = canCreate('template_section');
  const canUpdateSection = canUpdate('template_section');
  const canDeleteSection = canDelete('template_section');

  // Permisos específicos — custom_fields (tab "Campos personalizados")
  const canListCustomFields = hasAnyPermission(['custom_fields:l', 'custom_fields:r']);
  const canCreateCustomField = canCreate('custom_fields');
  const canUpdateCustomField = canUpdate('custom_fields');
  const canDeleteCustomField = canDelete('custom_fields');

  // Permisos específicos — docx_template (tab "Plantillas DOCX")
  const canListDocx = hasAnyPermission(['docx_template:l', 'docx_template:r']);
  const canCreateDocx = canCreate('docx_template');
  const canUpdateDocx = canUpdate('docx_template');
  const canDeleteDocx = canDelete('docx_template');

  // Permisos específicos — media (tab "Media")
  const canListMedia = canList('media');
  const canCreateMedia = canCreate('media');
  const canUpdateMedia = canUpdate('media');
  const canDeleteMedia = canDelete('media');

  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const hasRestoredRef = useRef(false);

  // Query para listar templates - solo si tiene permisos
  const { data: templatesData, error: queryError, isFetching } = useQuery({
    queryKey: ["templates", selectedOrganizationId, searchTerm, page, pageSize],
    queryFn: () => getAllTemplates(selectedOrganizationId!, searchTerm || undefined, page, pageSize),
    enabled: !!selectedOrganizationId && canListTemplates,
    retry: false,
  });

  const templates = templatesData?.data || [];

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
    setPage(1);
  }, [selectedOrganizationId]);

  // Loading de permisos
  if (isLoadingPermissions) return <PageSkeleton />;

  // Sin ningún permiso sobre la página -> 403 in-place (no depender solo del route guard)
  if (!canListTemplates) return <HuemulAccessDenied />;

  return (
    <HuemulPageLayout
      columns={[
        {
          content: (
            <TemplatesSidebar
              templates={templates}
              isLoading={isFetching}
              error={queryError}
              selectedTemplateId={selectedTemplate?.id || null}
              onTemplateSelect={handleTemplateSelect}
              onTemplateDeleted={() => {
                setSelectedTemplate(null);
                navigate('/templates', { replace: true });
              }}
              organizationId={selectedOrganizationId}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId, searchTerm, page, pageSize] })}
              onSearch={(term) => { setSearchTerm(term); setPage(1); }}
              searchValue={searchTerm}
              canCreate={canCreateTemplate}
              canUpdate={canUpdateTemplate}
              canDelete={canDeleteTemplate}
              canExport={canExportTemplate}
              canImport={canImportTemplate}
            />
          ),
          defaultSize: 15,
          minSize: 15,
          maxSize: 30,
          footer: {
            content: (
              <HuemulPagination
                page={templatesData?.page ?? page}
                pageSize={templatesData?.page_size ?? pageSize}
                hasNext={templatesData?.has_next ?? false}
                hasPrevious={(templatesData?.page ?? page) > 1}
                onPageChange={setPage}
              />
            ),
          },
        },
        {
          content: (
            <TemplateContent
              selectedTemplate={selectedTemplate}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId] })}
              onTemplateDeleted={() => {
                setSelectedTemplate(null);
                navigate('/templates', { replace: true });
              }}
              onTemplateCreated={(template) => {
                setSelectedTemplate(template);
                navigate(`/templates/${template.id}`, { replace: true });
              }}
              canCreate={canCreateTemplate}
              canUpdate={canUpdateTemplate}
              canDelete={canDeleteTemplate}
              canListSections={canListSections}
              canCreateSection={canCreateSection}
              canUpdateSection={canUpdateSection}
              canDeleteSection={canDeleteSection}
              canListCustomFields={canListCustomFields}
              canCreateCustomField={canCreateCustomField}
              canUpdateCustomField={canUpdateCustomField}
              canDeleteCustomField={canDeleteCustomField}
              canListDocx={canListDocx}
              canCreateDocx={canCreateDocx}
              canUpdateDocx={canUpdateDocx}
              canDeleteDocx={canDeleteDocx}
              canListMedia={canListMedia}
              canCreateMedia={canCreateMedia}
              canUpdateMedia={canUpdateMedia}
              canDeleteMedia={canDeleteMedia}
            />
          ),
          defaultSize: 85,
          minSize: 50,
        },
      ]}
    />
  );
}