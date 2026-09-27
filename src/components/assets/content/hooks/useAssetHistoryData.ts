import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseApiDate } from "@/services/utils";
import { useSectionHistory } from "@/hooks/useSectionHistory";
import { useExecutionEvents } from "@/hooks/useExecutionLifecycle";
import { useDocumentChangeLog } from "@/hooks/useDocumentChangeLog";
import {
  sectionEntryToHistoryEntry,
  lifecycleEventToHistoryEntry,
  changeLogEntryToHistoryEntry,
  accumulateById,
} from "@/components/assets/content/history/history-entry-vm";
import type { ExecutionEvent } from "@/types/execution-lifecycle";
import type { DocumentChangeLogEntry, DocumentChangeType } from "@/types/document-change-log";
import type { SectionHistoryEntry } from "@/types/section-execution";
import type { AssetHistoryTabData } from "@/types/assets";

/** Page size de los dos tabs paginados. Decisión de cliente (el backend acepta cualquier valor). */
const PAGE_SIZE = 25;

// ── Sección: sin paginación ni filtro — el endpoint devuelve todo de una vez ──

export function useSectionHistorySource(params: {
  enabled: boolean;
  sectionExecutionId: string | undefined;
  organizationId: string;
  userMap: Map<string, string>;
}) {
  const { t } = useTranslation("assets");
  const { enabled, sectionExecutionId, organizationId, userMap } = params;

  const { data, isLoading, isFetching, isError, error, refetch } = useSectionHistory(
    sectionExecutionId ?? "",
    organizationId,
    { enabled: enabled && !!sectionExecutionId },
  );

  const historyData: AssetHistoryTabData<SectionHistoryEntry> = {
    entries: (data?.items ?? []).map((entry) => sectionEntryToHistoryEntry(entry, userMap, t)),
    isLoading,
    isLoadingMore: false, // sin paginación: el endpoint devuelve todo de una vez
    isFetching,
    isError,
    error,
    refetch,
    total: data?.total,
    hasNext: false,
    loadMore: () => {},
    endpoint: `/section_executions/${sectionExecutionId ?? ""}/history`,
  };

  return { data: historyData };
}

// ── Ciclo de vida: paginación real (page/page_size + has_next) ──────────────

export function useLifecycleHistorySource(params: {
  enabled: boolean;
  organizationId: string;
  executionId: string | undefined;
  userMap: Map<string, string>;
}) {
  const { t } = useTranslation("assets");
  const { enabled, organizationId, executionId, userMap } = params;

  const [viewExecutionId, setViewExecutionId] = useState(executionId ?? "");
  useEffect(() => {
    if (executionId) setViewExecutionId(executionId);
  }, [executionId]);

  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);

  const effectiveEnabled = enabled && !!viewExecutionId;

  const { data, isLoading, isFetching, isError, error, refetch } = useExecutionEvents(organizationId, viewExecutionId, {
    enabled: effectiveEnabled,
    page,
    pageSize: PAGE_SIZE,
  });

  // Reset del acumulador y de la página cuando cambia la ejecución vista o se
  // (re)abre el sheet — evita mezclar eventos de dos ejecuciones distintas.
  useEffect(() => {
    setPage(1);
    setEvents([]);
  }, [effectiveEnabled, viewExecutionId]);

  useEffect(() => {
    if (!data) return;
    // Sort defensivo: la agrupación por etapa (runs consecutivos) y el
    // cálculo de "tiempo en etapa" del feed narrow asumen orden desc estricto
    // por `created_at` — no confiar en que el backend lo garantice.
    setEvents((prev) =>
      accumulateById(prev, data.data.events, data.page === 1).sort(
        (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime(),
      ),
    );
  }, [data]);

  const historyData: AssetHistoryTabData<ExecutionEvent> = {
    entries: events.map((event) => lifecycleEventToHistoryEntry(event, userMap, t)),
    isLoading: isLoading && events.length === 0,
    isLoadingMore: isFetching && events.length > 0,
    isFetching,
    isError,
    error,
    refetch,
    total: data?.data?.total,
    hasNext: data?.has_next ?? false,
    loadMore: () => setPage((p) => p + 1),
    endpoint: `/execution-lifecycle/${viewExecutionId}/events`,
  };

  return { data: historyData, viewExecutionId, setViewExecutionId };
}

// ── Cambios del activo: paginación real + filtro por tipo, ambos server-side ─

export function useChangesHistorySource(params: {
  enabled: boolean;
  organizationId: string;
  documentId: string | undefined;
  userMap: Map<string, string>;
}) {
  const { t } = useTranslation("assets");
  const { enabled, organizationId, documentId, userMap } = params;

  const [changeType, setChangeType] = useState<DocumentChangeType | "all">("all");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<DocumentChangeLogEntry[]>([]);

  const { data, isLoading, isFetching, isError, error, refetch } = useDocumentChangeLog(organizationId, documentId ?? "", {
    enabled: enabled && !!documentId,
    page,
    pageSize: PAGE_SIZE,
    changeType: changeType === "all" ? undefined : changeType,
  });

  useEffect(() => {
    setPage(1);
    setEntries([]);
  }, [enabled, documentId, changeType]);

  useEffect(() => {
    if (!data) return;
    // Sort defensivo — ver el mismo comentario en useLifecycleHistorySource.
    setEntries((prev) =>
      accumulateById(prev, data.data, data.page === 1).sort(
        (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime(),
      ),
    );
  }, [data]);

  const historyData: AssetHistoryTabData<DocumentChangeLogEntry> = {
    entries: entries.map((entry) => changeLogEntryToHistoryEntry(entry, userMap, t)),
    isLoading: isLoading && entries.length === 0,
    isLoadingMore: isFetching && entries.length > 0,
    isFetching,
    isError,
    error,
    refetch,
    total: undefined,
    hasNext: data?.has_next ?? false,
    loadMore: () => setPage((p) => p + 1),
    endpoint: `/documents/${documentId ?? ""}/change-log`,
  };

  return { data: historyData, changeType, setChangeType };
}
