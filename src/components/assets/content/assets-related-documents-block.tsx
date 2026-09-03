import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Link2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  SquareArrowOutUpRight,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { useOrgPath, useOrgNavigate } from "@/hooks/useOrgRouter";
import { useExecutionRelationships, useExecutionRelationshipMutations } from "@/hooks/useExecutionRelationships";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { cn } from "@/lib/utils";
import { getRelationshipLabel, getOtherExecution } from "@/lib/execution-relationship-utils";
import type { ExecutionRelationshipWithDetails } from "@/types/execution-relationships";

export interface AssetsRelatedDocumentsBlockProps {
  organizationId: string;
  executionId?: string;
  currentDocumentId?: string;
  isViewMode: boolean;
  /** Permite resolver el nombre del tipo de cada documento (gate: asset_type:l|r). */
  canListAssetTypes?: boolean;
  /** Permite abrir el canvas de diagramas para vincular (gate: diagram:r|l). */
  canLinkAssets?: boolean;
  /** Permite eliminar la relación desde el kebab de la fila (gate: execution_relationship:d). */
  canDeleteRelationship?: boolean;
}

const SEARCH_THRESHOLD = 10;

/**
 * Barra fija al pie del área de contenido con los documentos relacionados de la
 * versión visible — mismos datos que el panel lateral `assets-related-documents.tsx`
 * (comparten query key, sin fetch propio adicional), pero anclada al contenido en vez
 * de vivir dentro del TOC (que se pierde si el usuario lo cierra). Se pinta como una
 * sección más del activo, no como una tabla. Solo se renderiza cuando hay al menos
 * una relación.
 */
export function AssetsRelatedDocumentsBlock({
  organizationId,
  executionId,
  currentDocumentId,
  isViewMode,
  canListAssetTypes = false,
  canLinkAssets = false,
  canDeleteRelationship = false,
}: AssetsRelatedDocumentsBlockProps) {
  const { t } = useTranslation(["assets", "common"]);
  const buildPath = useOrgPath();
  const navigate = useOrgNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    documentName: string;
    relLabel: string;
  } | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useExecutionRelationships(
    organizationId,
    executionId || "",
    { enabled: !!executionId, direction: "all", includeSubrelationships: false },
  );

  const { data: documentTypesResponse } = useDocumentTypes({ enabled: canListAssetTypes });
  const typeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of documentTypesResponse?.data ?? []) map.set(type.id, type.name);
    return map;
  }, [documentTypesResponse]);

  const { deleteExecutionRelationship } = useExecutionRelationshipMutations(organizationId);

  const untitledFallback = t("content.relatedDocuments.untitledRelation");

  const relationships = data?.data ?? [];

  const sorted = useMemo(() => {
    return [...relationships].sort((a, b) => {
      if (a.direction !== b.direction) return a.direction === "target" ? -1 : 1;
      const nameA = getOtherExecution(a).document_name ?? "";
      const nameB = getOtherExecution(b).document_name ?? "";
      return nameA.localeCompare(nameB);
    });
  }, [relationships]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.trim().toLowerCase();
    return sorted.filter((rel) => {
      const other = getOtherExecution(rel);
      const relLabel = getRelationshipLabel(rel, untitledFallback);
      return (
        (other.document_name ?? "").toLowerCase().includes(q) ||
        relLabel.toLowerCase().includes(q)
      );
    });
  }, [sorted, search, untitledFallback]);

  const incomingCount = relationships.filter((r) => r.direction === "target").length;
  const outgoingCount = relationships.length - incomingCount;

  const openInNewTab = (rel: ExecutionRelationshipWithDetails) => {
    const other = getOtherExecution(rel);
    window.open(
      buildPath(`/asset/${other.document_id}?execution=${encodeURIComponent(other.id)}`),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openInThisTab = (rel: ExecutionRelationshipWithDetails) => {
    const other = getOtherExecution(rel);
    navigate(`/asset/${other.document_id}?execution=${encodeURIComponent(other.id)}`);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteExecutionRelationship.mutateAsync(pendingDelete.id);
      toast.success(t("content.relatedDocuments.removeRelationSuccess"));
      setPendingDelete(null);
    } catch (error) {
      toast.error(t("content.relatedDocuments.removeRelationError"));
      // Re-lanzar deja el diálogo abierto (HuemulAlertDialog vuelve a "idle").
      throw error;
    }
  };

  const handleLinkDocument = () => {
    if (!currentDocumentId) return;
    const params = new URLSearchParams({ diagram: "new", seedAsset: currentDocumentId });
    if (executionId) params.set("seedExecution", executionId);
    window.open(buildPath(`/diagrams?${params}`), "_blank", "noopener,noreferrer");
  };

  // Estado vacío ya lo cubre el panel lateral del TOC — acá el bloque solo aparece
  // cuando hay algo real que mostrar (o mientras carga la primera vez / hay error).
  if (!executionId) return null;
  if (!isLoading && !isError && relationships.length === 0) return null;

  const canSearch = relationships.length > SEARCH_THRESHOLD;
  const showLinkButton = !isViewMode && canLinkAssets && currentDocumentId;
  const showDelete = !isViewMode && canDeleteRelationship;

  const collapsedSummary = sorted
    .map((rel) => getOtherExecution(rel).document_name)
    .filter(Boolean)
    .join(" · ");

  const badgeLabel =
    relationships.length === 0
      ? ""
      : incomingCount === 0
        ? t("content.relatedDocuments.countOutgoing", { count: outgoingCount })
        : outgoingCount === 0
          ? t("content.relatedDocuments.countIncoming", { count: incomingCount })
          : String(relationships.length);

  return (
    <div className="not-prose mt-4 shrink-0 rounded-[10px] border border-[#e5eaf1] bg-white shadow-[0_-12px_20px_-12px_rgba(15,23,42,0.12)]">
      <div className="flex items-center gap-[9px] rounded-t-[10px] border-b border-[#f1f4f8] bg-[#fbfcfe] px-[11px] py-[9px]">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-[9px] text-left hover:cursor-pointer"
          aria-expanded={isOpen}
          aria-controls="related-documents-block-list"
          onClick={() => setIsOpen((o) => !o)}
        >
          <Link2 className="h-3.5 w-3.5 shrink-0 text-[#3b57c4]" />
          <span className="shrink-0 text-[13px] font-semibold text-[#0f172a]">
            {t("content.relatedDocuments.title")}
          </span>
          {relationships.length > 0 && (
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[.04em] text-[#475569]" style={{ backgroundColor: "#eef1f5" }}>
              {badgeLabel}
            </span>
          )}
          {!isOpen && collapsedSummary && (
            <span className="min-w-0 flex-1 truncate text-[11.5px] text-[#94a3b8]">
              {collapsedSummary}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            {canSearch && (
              searchOpen ? (
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => { if (!search) setSearchOpen(false); }}
                  placeholder={t("content.relatedDocuments.searchPlaceholder")}
                  className="h-7 w-40 text-xs"
                />
              ) : (
                <HuemulButton
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/70"
                  icon={Search}
                  iconClassName="h-3.5 w-3.5"
                  tooltip={t("common:search")}
                  onClick={() => setSearchOpen(true)}
                />
              )
            )}
            {showLinkButton && (
              <HuemulButton
                variant="outline"
                size="sm"
                icon={Plus}
                className="h-7 shrink-0 text-xs"
                onClick={handleLinkDocument}
              >
                {t("content.relatedDocuments.linkDocument")}
              </HuemulButton>
            )}
            <HuemulButton
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/70"
              icon={RefreshCw}
              iconClassName="h-3.5 w-3.5"
              tooltip={t("common:refresh")}
              loading={isFetching}
              onClick={() => refetch()}
            />
          </>
        )}
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground/70"
          icon={isOpen ? ChevronUp : ChevronDown}
          iconClassName="h-3.5 w-3.5"
          tooltip={isOpen ? t("content.relatedDocuments.collapse") : t("content.relatedDocuments.expand")}
          onClick={() => setIsOpen((o) => !o)}
        />
      </div>

      {isOpen && (
        <ul id="related-documents-block-list" className="flex max-h-[172px] flex-col gap-1.5 overflow-y-auto px-3 pt-2.5 pb-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-10 w-full rounded-lg" />
              </li>
            ))
          ) : isError ? (
            <li className="flex items-center justify-between gap-2 px-1 py-1 text-xs text-muted-foreground">
              {t("content.relatedDocuments.error")}
              <button type="button" className="text-primary hover:underline hover:cursor-pointer" onClick={() => refetch()}>
                {t("common:retry")}
              </button>
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-1 py-1 text-xs text-muted-foreground">
              {t("content.relatedDocuments.noMatches")}
            </li>
          ) : (
            filtered.map((rel) => {
              const other = getOtherExecution(rel);
              const relLabel = getRelationshipLabel(rel, untitledFallback);
              const isIncoming = rel.direction === "target";
              const typeName = typeNameById.get(other.document_type_id);
              return (
                <li
                  key={rel.id}
                  role="button"
                  tabIndex={0}
                  title={t("content.relatedDocuments.openInNewTab")}
                  className="flex items-center gap-3 rounded-lg border border-[#eef1f5] px-[11px] py-[9px] hover:cursor-pointer hover:border-[#bfd3fb] hover:bg-[#fafcff]"
                  onClick={() => openInNewTab(rel)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openInNewTab(rel);
                    if (e.key === " ") {
                      e.preventDefault();
                      openInNewTab(rel);
                    }
                  }}
                >
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded px-[7px] py-0.5 text-[11px] font-semibold uppercase",
                      isIncoming ? "border border-[#d8efe4] bg-[#f1fbf6] text-[#0f766e]" : "border border-[#e5dffb] bg-[#f7f5ff] text-[#6d28d9]",
                    )}
                  >
                    {isIncoming ? <ArrowLeft className="h-2.5 w-2.5" /> : <ArrowRight className="h-2.5 w-2.5" />}
                    {isIncoming
                      ? t("content.relatedDocuments.directionIncomingBadge")
                      : t("content.relatedDocuments.directionOutgoingBadge")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#0f172a]">
                    {other.document_name}
                  </span>
                  {typeName && (
                    <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-[#64748b]">
                      <span
                        className="h-[7px] w-[7px] shrink-0 rounded-full bg-muted"
                        style={{ backgroundColor: other.document_type_color || undefined }}
                      />
                      {typeName}
                    </span>
                  )}
                  <span className="w-[78px] shrink-0 truncate text-[11.5px] text-[#94a3b8]">
                    {other.name}
                  </span>
                  <span className="w-[120px] shrink-0 truncate text-[11.5px] text-[#475569]">
                    {t("content.relatedDocuments.relationPrefix", { name: relLabel })}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      {/* Sin prop `tooltip`: con tooltip, HuemulButton devuelve un
                          TooltipProvider como raíz y el `asChild` del trigger le pasaría
                          los handlers a un provider en vez de al <button>. */}
                      <HuemulButton
                        variant="ghost"
                        size="sm"
                        icon={MoreVertical}
                        iconClassName="h-3.5 w-3.5"
                        aria-label={t("content.relatedDocuments.rowActions")}
                        className="h-[26px] w-[26px] shrink-0 p-0 text-[#94a3b8] hover:cursor-pointer hover:bg-[#f1f4f8] hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem className="gap-2 text-xs hover:cursor-pointer" onSelect={() => setTimeout(() => openInThisTab(rel), 0)}>
                        <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                        {t("content.relatedDocuments.openInThisTab")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs hover:cursor-pointer" onSelect={() => setTimeout(() => openInNewTab(rel), 0)}>
                        <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                        {t("content.relatedDocuments.openInNewTab")}
                      </DropdownMenuItem>
                      {showDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-xs text-destructive focus:text-destructive hover:cursor-pointer"
                            onSelect={() => setTimeout(() => setPendingDelete({ id: rel.id, documentName: other.document_name, relLabel }), 0)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("content.relatedDocuments.removeRelation")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })
          )}
        </ul>
      )}

      {/* Hermano del listado colapsable para que la confirmación siga montada
          aunque el bloque se colapse. */}
      <HuemulAlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("content.relatedDocuments.removeRelationTitle")}
        description={t("content.relatedDocuments.removeRelationDescription", {
          document: pendingDelete?.documentName ?? "",
          relation: pendingDelete?.relLabel ?? "",
        })}
        actionLabel={t("common:delete")}
        actionIcon={Trash2}
        cancelLabel={t("common:cancel")}
        onAction={handleDelete}
      />
    </div>
  );
}
