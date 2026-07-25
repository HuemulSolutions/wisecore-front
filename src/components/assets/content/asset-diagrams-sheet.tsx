"use client"

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Workflow, AlertCircle } from "lucide-react";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiagrams } from "@/hooks/useDiagrams";
import { DiagramEditSheet } from "@/components/diagrams";
import { formatApiDateTime } from "@/lib/utils";
import type { Diagram } from "@/types/diagrams";

export interface AssetDiagramsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  organizationId: string;
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

export function AssetDiagramsSheet({ open, onOpenChange, documentId, organizationId }: AssetDiagramsSheetProps) {
  const { t } = useTranslation("diagrams");
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);

  const { data, isLoading, isError } = useDiagrams(organizationId, {
    enabled: open && !!documentId,
    documentId,
    pageSize: 100,
  });

  const diagrams = data?.data ?? [];

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("relatedSheet.title")}
        description={t("relatedSheet.description")}
        icon={Workflow}
        showFooter={false}
      >
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
      </HuemulSheet>

      <DiagramEditSheet
        open={!!selectedDiagramId}
        onOpenChange={(o) => { if (!o) setSelectedDiagramId(null); }}
        diagramId={selectedDiagramId}
        organizationId={organizationId}
      />
    </>
  );
}
