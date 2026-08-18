import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getAllTemplates } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useOrgNavigate } from "@/hooks/useOrgRouter";
import { useTag } from "@/hooks/useTags";
import { TemplateContent } from "@/components/templates/templates-content";
import { TemplatesSidebar } from "@/components/templates/templates-sidebar";
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout";
import { HuemulPagination } from "@/huemul/components/huemul-pagination";
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied";
import { HuemulTagChip } from "@/huemul/components/huemul-tag-chip";
import { PageSkeleton } from "@/components/ui/page-skeleton";

import type { TemplateItem } from "@/types/templates"

export default function Templates() {
  const { t } = useTranslation('templates');
  const queryClient = useQueryClient();
    const navigate = useOrgNavigate();
  const { id: templateId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tagId = searchParams.get("tag_id") || undefined;
  const { data: activeTag } = useTag(tagId ?? "", !!tagId);
  const { selectedOrganizationId } = useOrganization();

  // Permisos
  // NOTA: NO usar isRootAdmin como bypass — solo isOrgAdmin hace bypass, y ese
  // ya está aplicado dentro de canCreate/canRead/canUpdate/canDelete/canList
  // (ver useUserPermissions.ts). Ver ia context/rbac-permissions-guide.md.
  const {
    hasAnyPermission,
    hasPermission,
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

  // Permisos específicos — tag (sheet de etiquetas asignadas al template)
  const canViewTags = hasPermission('tag:r');
  const canManageTags = hasPermission('tag:u');

  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const hasRestoredRef = useRef(false);

  const clearTagFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("tag_id");
      return next;
    });
    setPage(1);
  };

  // Query para listar templates - solo si tiene permisos
  const { data: templatesData, error: queryError, isFetching } = useQuery({
    queryKey: ["templates", selectedOrganizationId, searchTerm, page, pageSize, tagId],
    queryFn: () => getAllTemplates(selectedOrganizationId!, searchTerm || undefined, page, pageSize, { tag_id: tagId }),
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
      header={
        activeTag ? (
          <div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-2">
            <span className="text-xs text-muted-foreground">{t('filters.filteredByTag')}</span>
            <HuemulTagChip label={activeTag.name} color={activeTag.color} size="sm" onRemove={clearTagFilter} />
          </div>
        ) : undefined
      }
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
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ["templates", selectedOrganizationId, searchTerm, page, pageSize, tagId] })}
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
              canViewTags={canViewTags}
              canManageTags={canManageTags}
            />
          ),
          defaultSize: 85,
          minSize: 50,
        },
      ]}
    />
  );
}