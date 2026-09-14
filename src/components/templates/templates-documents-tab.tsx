import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ExternalLink } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulTable } from "@/huemul/components/huemul-table";
import { useOrgPath } from "@/hooks/useOrgRouter";
import { getTemplateChildDocuments } from "@/services/templates";
import type { ChildDocument } from "@/types/templates";
import type { HuemulTableColumn } from "@/types/huemul";
import type { TemplateDocumentsTabProps } from '@/types/templates';
export type { TemplateDocumentsTabProps } from '@/types/templates';

// Pestaña de solo lectura: los documentos ya vienen agrupados por carpeta
// desde el backend (ChildDocumentFolder[]), se aplanan para HuemulTable y se
// reconstruye la lista de carpetas desde la misma respuesta — ver
// ia context/tabla-agrupada-drag-and-drop-guide.md.
export function TemplateDocumentsTab({ templateId, organizationId, canList, onCountChange }: TemplateDocumentsTabProps) {
  const { t } = useTranslation(['templates', 'common']);
  const buildPath = useOrgPath();
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['template-child-documents', templateId],
    queryFn: () => getTemplateChildDocuments(templateId, organizationId),
    enabled: !!templateId && !!organizationId && canList,
    retry: false,
  });

  const folders = useMemo(() => data?.data ?? [], [data]);
  const documents = useMemo(() => folders.flatMap((f) => f.documents), [folders]);

  useEffect(() => {
    onCountChange?.(documents.length);
  }, [documents.length, onCountChange]);

  const columns: HuemulTableColumn<ChildDocument>[] = [
    {
      key: "name",
      label: t('templates:documentsTab.columnName'),
      primary: true,
      render: (doc) => <span className="font-medium text-foreground">{doc.name}</span>,
    },
    {
      key: "internal_code",
      label: t('templates:documentsTab.columnInternalCode'),
      render: (doc) => <span className="text-muted-foreground">{doc.internal_code ?? '—'}</span>,
    },
    {
      key: "versions",
      label: t('templates:documentsTab.columnVersions'),
      render: (doc) => <span>{doc.executions.length}</span>,
    },
    {
      key: "updated_at",
      label: t('templates:documentsTab.columnUpdatedAt'),
      render: (doc) => <span className="text-muted-foreground">{new Date(doc.updated_at).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <div className="flex shrink-0 items-center justify-end px-4 py-2">
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          icon={RefreshCw}
          tooltip={t('common:refresh')}
          loading={isFetching}
          onClick={() => refetch()}
        />
      </div>
      <div className="flex-1 overflow-auto px-4 pb-4">
        <HuemulTable
          data={documents}
          columns={columns}
          getRowKey={(doc) => doc.id}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error as Error | null}
          onRetry={() => refetch()}
          actions={[
            {
              key: "open",
              label: t('templates:documentsTab.openDocument'),
              icon: ExternalLink,
              onClick: (doc) => window.open(buildPath(`/asset/${doc.id}`), '_blank', 'noopener,noreferrer'),
            },
          ]}
          emptyState={{
            title: t('templates:documentsTab.emptyTitle'),
            description: t('templates:documentsTab.emptyDescription'),
          }}
          folders={{
            folders: folders.map((f) => ({ id: f.folder_id, name: f.folder_name, itemCount: f.documents.length })),
            getFolderId: (doc) => doc.folder_id ?? null,
            openFolders,
            onOpenFoldersChange: setOpenFolders,
            onMoveRow: () => {},
            onCreateFolder: () => {},
            canDragRows: false,
            canCreateFolder: false,
            canMoveRows: false,
          }}
        />
      </div>
    </div>
  );
}
