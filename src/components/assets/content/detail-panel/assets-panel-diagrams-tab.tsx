import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Workflow } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DiagramViewSheet } from "@/components/diagrams";
import { useDiagrams } from "@/hooks/useDiagrams";
import { useOrgPath } from "@/hooks/useOrgRouter";
import { formatApiDateTime } from "@/lib/utils";
import { isExecutionDetail } from "@/lib/diagram-utils";
import type { Diagram, DiagramExecutionDetail } from "@/types/diagrams";

export interface AssetsPanelDiagramsTabProps {
  organizationId: string;
  documentId: string;
  executionId?: string;
}

export interface AssetsPanelDiagramsTabHandle {
  refresh: () => void | Promise<unknown>;
  /** Abre el editor de diagramas (pestaña nueva) sembrado con este activo/versión. */
  create: () => void;
}

function DiagramRow({ diagram, documentId, onClick }: { diagram: Diagram; documentId: string; onClick: () => void }) {
  const executionLabel =
    diagram.details.find(
      (d): d is DiagramExecutionDetail => isExecutionDetail(d) && d.document_id === documentId,
    )?.execution_name ?? diagram.execution_id.slice(0, 8);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start gap-0.5 rounded-md border border-border px-3 py-2 text-left transition-colors hover:cursor-pointer hover:bg-muted"
    >
      <span className="text-xs font-medium text-foreground">{diagram.name}</span>
      <span className="text-[11px] text-muted-foreground">
        {executionLabel} · {formatApiDateTime(diagram.created_at)}
      </span>
    </button>
  );
}

/**
 * Tab "Diagramas" del panel de detalle — lista los diagramas que incluyen el activo.
 * El título, el "+" y el refresh los pone `AssetsDetailPanel`.
 */
export const AssetsPanelDiagramsTab = forwardRef<AssetsPanelDiagramsTabHandle, AssetsPanelDiagramsTabProps>(
  function AssetsPanelDiagramsTab({ organizationId, documentId, executionId }, ref) {
    const { t } = useTranslation(["diagrams"]);
    const buildPath = useOrgPath();
    const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);

    const { data, isLoading, isError, refetch } = useDiagrams(organizationId, {
      enabled: !!documentId,
      documentId,
      pageSize: 100,
    });
    const diagrams = data?.data ?? [];

    const create = useCallback(() => {
      if (!documentId) return;
      const params = new URLSearchParams({ diagram: "new", seedAsset: documentId });
      if (executionId) params.set("seedExecution", executionId);
      window.open(buildPath(`/diagrams?${params}`), "_blank", "noopener,noreferrer");
    }, [buildPath, documentId, executionId]);

    useImperativeHandle(ref, () => ({ refresh: () => refetch(), create }), [refetch, create]);

    return (
      <>
        <div className="h-full overflow-y-auto p-2.5">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <p className="text-xs text-muted-foreground">{t("relatedSheet.loadingError")}</p>
            </div>
          )}

          {!isLoading && !isError && diagrams.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Workflow className="h-7 w-7 text-muted-foreground/40" />
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

        <DiagramViewSheet
          open={!!selectedDiagramId}
          onOpenChange={(o) => { if (!o) setSelectedDiagramId(null); }}
          diagramId={selectedDiagramId}
          organizationId={organizationId}
        />
      </>
    );
  },
);
