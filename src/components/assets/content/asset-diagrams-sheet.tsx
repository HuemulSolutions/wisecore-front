"use client"

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Workflow, AlertCircle, Plus, RefreshCw } from "lucide-react";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiagrams } from "@/hooks/useDiagrams";
import { DiagramViewSheet } from "@/components/diagrams";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useOrgPath } from "@/hooks/useOrgRouter";
import { formatApiDateTime } from "@/lib/utils";
import type { Diagram } from "@/types/diagrams";

export interface AssetDiagramsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  organizationId: string;
  executionId?: string;
}

function DiagramRow({ diagram, documentId, onClick }: { diagram: Diagram; documentId: string; onClick: () => void }) {
  const executionLabel =
    diagram.details.find((d) => d.document_id === documentId)?.execution_name ?? diagram.execution_id.slice(0, 8);

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-start gap-0.5 rounded-md border border-gray-100 px-3 py-2 text-left hover:bg-gray-50 hover:cursor-pointer transition-colors"
    >
      <span className="text-xs font-medium text-foreground">{diagram.name}</span>
      <span className="text-[11px] text-muted-foreground">
        {executionLabel} · {formatApiDateTime(diagram.created_at)}
      </span>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

export function AssetDiagramsSheet({ open, onOpenChange, documentId, organizationId, executionId }: AssetDiagramsSheetProps) {
  const { t } = useTranslation(["diagrams", "common"]);
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);
  const { isOrgAdmin, hasPermission } = useUserPermissions();
  const buildPath = useOrgPath();

  const { data, isLoading, isError, isFetching, refetch } = useDiagrams(organizationId, {
    enabled: open && !!documentId,
    documentId,
    pageSize: 100,
  });

  const diagrams = data?.data ?? [];

  const canCreate = isOrgAdmin || hasPermission("diagram:c");

  const handleCreate = () => {
    if (!documentId) return;
    const params = new URLSearchParams({ diagram: "new", seedAsset: documentId });
    if (executionId) params.set("seedExecution", executionId);
    window.open(buildPath(`/asset?${params}`), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("relatedSheet.title")}
        description={t("relatedSheet.description")}
        icon={Workflow}
        showFooter={false}
        maxWidth="sm:max-w-xl"
      >
        <div className="flex flex-col h-full -mx-6">
          <div className="flex items-center justify-between px-6 pb-3 mb-3 border-b border-gray-100">
            {canCreate && documentId ? (
              <HuemulButton size="sm" icon={Plus} onClick={handleCreate}>
                {t("relatedSheet.createAction")}
              </HuemulButton>
            ) : (
              <span />
            )}
            <HuemulButton
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              icon={RefreshCw}
              tooltip={t("common:refresh")}
              loading={isFetching}
              onClick={() => refetch()}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {isLoading && <ListSkeleton />}

            {!isLoading && isError && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <p className="text-xs text-muted-foreground">{t("relatedSheet.loadingError")}</p>
              </div>
            )}

            {!isLoading && !isError && diagrams.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <Workflow className="h-7 w-7 text-gray-200" />
                <p className="text-xs text-muted-foreground">{t("relatedSheet.empty")}</p>
              </div>
            )}

            {!isLoading && !isError && diagrams.length > 0 && (
              <div className="space-y-2">
                {diagrams.map((diagram) => (
                  <DiagramRow
                    key={diagram.id}
                    diagram={diagram}
                    documentId={documentId}
                    onClick={() => setSelectedDiagramId(diagram.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </HuemulSheet>

      <DiagramViewSheet
        open={!!selectedDiagramId}
        onOpenChange={(o) => { if (!o) setSelectedDiagramId(null); }}
        diagramId={selectedDiagramId}
        organizationId={organizationId}
      />
    </>
  );
}
