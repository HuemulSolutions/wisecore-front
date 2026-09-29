import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
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
import { getRelationshipLabel, getOtherExecution, tintFromColor } from "@/lib/execution-relationship-utils";
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

const ICON_BUTTON_CLASS = "h-[30px] w-[30px] shrink-0 rounded-[7px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#64748b]";

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

  const badgeLabel = relationships.length === 0 ? "" : String(relationships.length);

  return (
    <div className="not-prose mt-7 shrink-0 border-t border-[#eef1f6] pt-6">
      <div className="flex items-center gap-2 pb-2">
        <h3 className="text-[17px] font-[650] text-[#0f172a]">
          {t("content.relatedDocuments.title")}
        </h3>
        {relationships.length > 0 && (
          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[10px] bg-[#f1f5f9] px-1.5 text-[11.5px] font-bold text-[#475569]">
            {badgeLabel}
          </span>
        )}
        <div className="flex-1" />

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
                  className="h-[30px] w-40 text-xs"
                />
              ) : (
                <HuemulButton
                  variant="ghost"
                  size="icon"
                  className={ICON_BUTTON_CLASS}
                  icon={Search}
                  iconClassName="h-3.5 w-3.5"
                  tooltip={t("common:search")}
                  onClick={() => setSearchOpen(true)}
                />
              )
            )}
            {showLinkButton && (
              <button
                type="button"
                className="h-[30px] shrink-0 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-[#1d4ed8] hover:cursor-pointer hover:bg-[#eff5ff]"
                onClick={handleLinkDocument}
              >
                + {t("content.relatedDocuments.linkDocument")}
              </button>
            )}
            <HuemulButton
              variant="ghost"
              size="icon"
              className={ICON_BUTTON_CLASS}
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
          className={ICON_BUTTON_CLASS}
          icon={isOpen ? ChevronUp : ChevronDown}
          iconClassName="h-3.5 w-3.5"
          aria-expanded={isOpen}
          aria-controls="related-documents-block-list"
          tooltip={isOpen ? t("content.relatedDocuments.collapse") : t("content.relatedDocuments.expand")}
          onClick={() => setIsOpen((o) => !o)}
        />
      </div>

      {isOpen && (
        <ul id="related-documents-block-list" className="-mx-3 flex flex-col">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="px-3 py-1">
                <Skeleton className="h-9 w-full rounded-lg" />
              </li>
            ))
          ) : isError ? (
            <li className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
              {t("content.relatedDocuments.error")}
              <button type="button" className="text-primary hover:underline hover:cursor-pointer" onClick={() => refetch()}>
                {t("common:retry")}
              </button>
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              {t("content.relatedDocuments.noMatches")}
            </li>
          ) : (
            filtered.map((rel) => {
              const other = getOtherExecution(rel);
              const relLabel = getRelationshipLabel(rel, untitledFallback);
              const typeName = typeNameById.get(other.document_type_id);
              const typeColor = other.document_type_color;
              const typeTint = tintFromColor(typeColor);
              return (
                <li
                  key={rel.id}
                  role="button"
                  tabIndex={0}
                  title={t("content.relatedDocuments.openInNewTab")}
                  className="flex items-center gap-3 rounded-lg py-2 pr-1.5 pl-3 hover:cursor-pointer hover:bg-[#f8fafc]"
                  onClick={() => openInNewTab(rel)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openInNewTab(rel);
                    if (e.key === " ") {
                      e.preventDefault();
                      openInNewTab(rel);
                    }
                  }}
                >
                  {typeName && (
                    <span
                      className="inline-flex h-[22px] max-w-44 shrink-0 items-center rounded-md border px-[7px] text-[11px] font-semibold"
                      style={{
                        backgroundColor: typeTint || "#f1f5f9",
                        borderColor: typeTint ? typeColor : "#e2e8f0",
                        color: typeColor || "#475569",
                      }}
                      title={typeName}
                    >
                      <span className="truncate">{typeName}</span>
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#0f172a]">
                    {other.document_name}
                  </span>
                  <span className="w-19.5 shrink-0 truncate text-[12px] text-[#94a3b8]" title={other.name}>
                    {other.name}
                  </span>
                  <span className="w-32 shrink-0 truncate text-[12px] text-[#475569]" title={relLabel}>
                    {t("content.relatedDocuments.relationPrefix", { name: relLabel })}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <HuemulButton
                        variant="ghost"
                        size="sm"
                        icon={MoreVertical}
                        iconClassName="h-3.5 w-3.5"
                        aria-label={t("content.relatedDocuments.rowActions")}
                        className="h-7 w-7 shrink-0 rounded-[7px] p-0 text-[#94a3b8] hover:cursor-pointer hover:bg-[#eef1f6] hover:text-[#334155]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="top"
                      align="end"
                      className="w-[210px] rounded-[10px] border-0 bg-white p-[5px] shadow-[0_0_0_1px_#e2e8f0,0_18px_36px_-14px_rgba(15,23,42,.28)]"
                    >
                      <DropdownMenuItem className="h-8 gap-2 text-[13px] font-medium hover:cursor-pointer focus:bg-[#f1f5f9]" onSelect={() => setTimeout(() => openInThisTab(rel), 0)}>
                        <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                        {t("content.relatedDocuments.openInThisTab")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="h-8 gap-2 text-[13px] font-medium hover:cursor-pointer focus:bg-[#f1f5f9]" onSelect={() => setTimeout(() => openInNewTab(rel), 0)}>
                        <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                        {t("content.relatedDocuments.openInNewTab")}
                      </DropdownMenuItem>
                      {showDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="h-8 gap-2 text-[13px] font-medium text-destructive focus:bg-[#f1f5f9] focus:text-destructive hover:cursor-pointer"
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
