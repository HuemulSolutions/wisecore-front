import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronRight, RefreshCw, Link2, Plus, FileText, ArrowLeft, ArrowRight, SquareArrowOutUpRight, MoreVertical, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog";
import { useOrgPath } from "@/hooks/useOrgRouter";
import { useExecutionRelationships, useExecutionRelationshipMutations } from "@/hooks/useExecutionRelationships";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { cn } from "@/lib/utils";
import { getRelationshipLabel } from "@/lib/execution-relationship-utils";
import type { ExecutionRelationshipWithDetails, ExecutionRelationshipInlineExecution } from "@/types/execution-relationships";

export interface AssetsRelatedDocumentsProps {
  organizationId: string;
  executionId?: string;
  currentDocumentId?: string;
  /** Etiqueta de la versión visible (ej. "1.0.84"), usada en el estado vacío. */
  versionLabel?: string;
  /** Permite abrir el canvas de diagramas para vincular (gate: diagram:r|l). */
  canOpenDiagrams?: boolean;
  /** Permite resolver el nombre del tipo de cada documento (gate: asset_type:l|r). */
  canListAssetTypes?: boolean;
  /** Permite eliminar la relación desde el kebab de la fila (gate: execution_relationship:d). */
  canDeleteRelationship?: boolean;
}

/** Fondo tenue derivado del color del tipo de documento (hex de 6 dígitos). */
function tintFromColor(color?: string): string | undefined {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return `${color}1A`;
}

function RelatedDocumentRow({
  other,
  relLabel,
  typeName,
  directionHint,
  isCurrentAsset,
  currentAssetLabel,
  openHint,
  actionsLabel,
  removeLabel,
  onOpen,
  onDelete,
}: {
  other: ExecutionRelationshipInlineExecution;
  relLabel: string;
  typeName?: string;
  directionHint: string;
  isCurrentAsset: boolean;
  currentAssetLabel: string;
  openHint: string;
  actionsLabel: string;
  removeLabel: string;
  onOpen: () => void;
  /** Ausente cuando el usuario no puede borrar: el kebab queda solo con "abrir". */
  onDelete?: () => void;
}) {
  const color = other.document_type_color;
  const meta = [typeName, other.name, relLabel].filter(Boolean).join(" · ");

  return (
    // Fila no interactiva: todas las acciones (abrir, eliminar) viven en el
    // kebab, así que el cuerpo es solo presentación con tooltip informativo.
    <div className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-1.5 text-left transition-colors hover:bg-accent/30">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted"
              style={{ backgroundColor: tintFromColor(color), color: color || undefined }}
            >
              <FileText className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-foreground">{other.document_name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {meta}
                {isCurrentAsset && ` · ${currentAssetLabel}`}
              </span>
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-60">
          <p className="font-medium">{other.document_name}</p>
          <p className="text-[11px] opacity-90">{directionHint}</p>
          {meta && <p className="text-[11px] opacity-90">{meta}</p>}
        </TooltipContent>
      </Tooltip>
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
            aria-label={actionsLabel}
            className="h-6 w-6 shrink-0 p-0 text-muted-foreground/70 hover:cursor-pointer hover:text-foreground"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem className="gap-2 text-xs hover:cursor-pointer" onSelect={() => setTimeout(onOpen, 0)}>
            <SquareArrowOutUpRight className="h-3.5 w-3.5" />
            {openHint}
          </DropdownMenuItem>
          {onDelete && (
            <DropdownMenuItem
              className="gap-2 text-xs text-destructive focus:text-destructive hover:cursor-pointer"
              onSelect={() => setTimeout(onDelete, 0)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {removeLabel}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AssetsRelatedDocuments({
  organizationId,
  executionId,
  currentDocumentId,
  versionLabel,
  canOpenDiagrams = false,
  canListAssetTypes = false,
  canDeleteRelationship = false,
}: AssetsRelatedDocumentsProps) {
  const { t } = useTranslation(["assets", "common"]);
  const buildPath = useOrgPath();
  const [isOpen, setIsOpen] = useState(true);
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

  // Catálogo de tipos: solo para resolver el nombre del tipo por documento.
  const { data: documentTypesResponse } = useDocumentTypes({ enabled: canListAssetTypes });
  const typeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of documentTypesResponse?.data ?? []) map.set(type.id, type.name);
    return map;
  }, [documentTypesResponse]);

  const relationships = data?.data ?? [];
  const outgoing = relationships.filter((r) => r.direction === "source");
  const incoming = relationships.filter((r) => r.direction === "target");
  const untitledFallback = t("content.relatedDocuments.untitledRelation");

  const openRelated = (other: ExecutionRelationshipInlineExecution) => {
    window.open(
      buildPath(`/asset/${other.document_id}?execution=${encodeURIComponent(other.id)}`),
      "_blank",
      "noopener,noreferrer",
    );
  };

  // El onSuccess del hook invalida `listBase()`, así que refresca este bloque y
  // la query gemela que alimenta el nodo `data_table` (misma query key).
  const { deleteExecutionRelationship } = useExecutionRelationshipMutations(organizationId);

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

  const linkButton = canOpenDiagrams && currentDocumentId && (
    <HuemulButton
      variant="outline"
      size="sm"
      icon={Plus}
      className="h-7 w-full text-xs"
      onClick={handleLinkDocument}
    >
      {t("content.relatedDocuments.linkDocument")}
    </HuemulButton>
  );

  const renderGroup = (
    label: string,
    directionHint: string,
    DirectionIcon: typeof ArrowLeft,
    items: ExecutionRelationshipWithDetails[],
    getOther: (r: ExecutionRelationshipWithDetails) => ExecutionRelationshipInlineExecution,
  ) => {
    if (!items.length) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 px-1">
          <DirectionIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground">
            {items.length}
          </span>
        </div>
        {items.map((rel) => {
          const other = getOther(rel);
          const relLabel = getRelationshipLabel(rel, untitledFallback);
          return (
            <RelatedDocumentRow
              key={rel.id}
              other={other}
              relLabel={relLabel}
              typeName={typeNameById.get(other.document_type_id)}
              directionHint={directionHint}
              isCurrentAsset={other.document_id === currentDocumentId}
              currentAssetLabel={t("content.relatedDocuments.currentAsset")}
              openHint={t("content.relatedDocuments.openInNewTab")}
              actionsLabel={t("content.relatedDocuments.rowActions")}
              removeLabel={t("content.relatedDocuments.removeRelation")}
              onOpen={() => openRelated(other)}
              onDelete={
                canDeleteRelationship
                  ? () => setPendingDelete({ id: rel.id, documentName: other.document_name, relLabel })
                  : undefined
              }
            />
          );
        })}
      </div>
    );
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="shrink-0 border-t border-border bg-card shadow-[0_-2px_8px_-4px_rgba(0,0,0,0.12)]"
    >
      <div className="flex w-full items-center gap-1.5 px-3 py-2 transition-colors hover:bg-muted/50">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex flex-1 items-center gap-1.5 text-left hover:cursor-pointer">
            <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Link2 className="h-3 w-3" />
            </span>
            <span className="text-xs font-semibold text-foreground">{t("content.relatedDocuments.title")}</span>
            <span
              className={cn(
                "inline-flex h-4 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                relationships.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {relationships.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground/70"
          icon={RefreshCw}
          iconClassName="h-3 w-3"
          tooltip={t("common:refresh")}
          loading={isFetching}
          onClick={() => refetch()}
        />
      </div>
      <CollapsibleContent className="max-h-[45vh] space-y-2 overflow-y-auto overflow-x-hidden px-2 pb-2">
        {isLoading ? (
          <div className="space-y-1 px-1 py-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-1 py-1 text-xs text-muted-foreground">{t("content.relatedDocuments.error")}</p>
        ) : relationships.length === 0 ? (
          <div className="space-y-2 px-1 py-1">
            <p className="text-xs font-medium text-foreground">
              {versionLabel
                ? t("content.relatedDocuments.emptyInVersion", { version: versionLabel })
                : t("content.relatedDocuments.empty")}
            </p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {t("content.relatedDocuments.emptyHint")}
            </p>
            {linkButton}
          </div>
        ) : (
          <>
            {renderGroup(
              t("content.relatedDocuments.incoming"),
              t("content.relatedDocuments.incomingHint"),
              ArrowLeft,
              incoming,
              (r) => r.source_execution,
            )}
            {renderGroup(
              t("content.relatedDocuments.outgoing"),
              t("content.relatedDocuments.outgoingHint"),
              ArrowRight,
              outgoing,
              (r) => r.target_execution,
            )}
            {linkButton && <div className="border-t border-border/60 pt-2">{linkButton}</div>}
          </>
        )}
      </CollapsibleContent>
      {/* Hermano del contenido colapsable para que la confirmación siga montada
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
    </Collapsible>
  );
}
