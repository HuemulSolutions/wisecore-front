import { X, Edit3, ExternalLink, Maximize2, MoreVertical, Paperclip, RefreshCw, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { UserInfo } from "@/types/assets";

const ICON_BUTTON_CLASS = "h-[30px] w-[30px] rounded-[7px] p-0 text-[#64748b] hover:bg-[#f1f5f9]";

interface SecondaryAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export interface WorkflowPanelHeaderProps {
  documentName: string | undefined;
  internalCode: string | undefined;
  /** Nombre del template de workflow — línea chica junto a internalCode. Undefined en modo express
   *  antes de que /content resuelva (no hay `data` todavía). */
  templateName?: string | null;
  isFullscreen: boolean;
  createdBy?: UserInfo | null;
  updatedBy?: UserInfo | null;
  /** Proxy best-effort para "editado hace X" — ver WorkflowRowRef.last_modified_at. */
  lastModifiedAt?: string;
  documentId: string | null;
  needsNameStep: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  canViewMedia: boolean;
  onOpenMedia: () => void;
  /** Botón «Abrir en Activos» (ya combinado con el permiso `asset:r|l` por el panel). */
  showOpenAsset: boolean;
  onOpenAsset: () => void;
  /** Botón «Abrir en pantalla completa» (ya combinado con el permiso y con `!isFullscreen` por el panel). */
  showOpenFullscreen: boolean;
  onOpenFullscreen: () => void;
  showAssetEdit: boolean;
  canEdit: boolean;
  onOpenEdit: () => void;
  showClose: boolean;
  onClose: () => void;
}

function fullName(user: UserInfo | null | undefined): string | undefined {
  if (!user) return undefined;
  return [user.name, user.last_name].filter(Boolean).join(" ").trim() || undefined;
}

/** Header del panel de detalle: identidad del documento (código/template/nombre) y metadatos de
 *  autoría — más refresh, el menú «⋮» de acciones (recursos/abrir en Activos/pantalla completa/editar) y cerrar. El badge de etapa del
 *  ciclo de vida vive en la fila de acciones de ciclo de vida (workflow-panel-lifecycle-row.tsx),
 *  no acá. El nombre de sección vive en el header de la vista 2 (workflow-section-view.tsx).
 *
 *  Cada bloque se guardea por separado (no un único `if (data)`): en modo express recién
 *  iniciado `data` es undefined y el header debe degradar a solo el nombre, sin "Creado por
 *  undefined". En fullscreen, el contenido se centra igual que el cuerpo (ver
 *  workflow-detail-panel.tsx, wrapper mx-auto max-w-3xl). */
export function WorkflowPanelHeader({
  documentName,
  internalCode,
  templateName,
  isFullscreen,
  createdBy,
  updatedBy,
  lastModifiedAt,
  documentId,
  needsNameStep,
  isFetching,
  onRefresh,
  canViewMedia,
  onOpenMedia,
  showOpenAsset,
  onOpenAsset,
  showOpenFullscreen,
  onOpenFullscreen,
  showAssetEdit,
  canEdit,
  onOpenEdit,
  showClose,
  onClose,
}: WorkflowPanelHeaderProps) {
  const { t } = useTranslation("workflow");
  const { t: tCommon } = useTranslation("common");
  const showActions = documentId && !needsNameStep;
  // Acciones secundarias: siempre dentro del menú «⋮» (permisos en un solo lugar). Refresh y cerrar
  // no entran: siempre visibles (refresh es obligatorio en toda superficie con datos del backend).
  const secondaryActions: SecondaryAction[] = showActions
    ? [
        ...(canViewMedia ? [{ key: "media", label: t("panel.media"), icon: Paperclip, onClick: onOpenMedia }] : []),
        ...(showOpenAsset ? [{ key: "openAsset", label: t("actions.openAsset"), icon: ExternalLink, onClick: onOpenAsset }] : []),
        ...(showOpenFullscreen
          ? [{ key: "openFullscreen", label: t("actions.openFullscreen"), icon: Maximize2, onClick: onOpenFullscreen }]
          : []),
        ...(showAssetEdit && canEdit ? [{ key: "edit", label: t("panel.edit"), icon: Edit3, onClick: onOpenEdit }] : []),
      ]
    : [];

  const createdByName = fullName(createdBy);
  const updatedByName = fullName(updatedBy);
  const metaParts: string[] = [];
  if (createdByName) metaParts.push(t("panel.meta.createdBy", { name: createdByName }));
  if (updatedByName) {
    metaParts.push(
      lastModifiedAt
        ? t("panel.meta.editedByAt", { name: updatedByName, when: formatRelativeTime(lastModifiedAt) })
        : t("panel.meta.editedBy", { name: updatedByName }),
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-[13px] border-b border-[#e8ecf2] bg-white px-[22px] pt-[18px] pb-[16px]",
        isFullscreen && "px-4 sm:px-8",
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", isFullscreen && "mx-auto w-full max-w-3xl")}>
        <div className="min-w-0 flex-1">
          {(internalCode || templateName) && (
            <div className="flex min-w-0 items-center gap-[7px]">
              {internalCode && (
                <span className="shrink-0 font-mono text-[11.5px] font-medium text-[#475569]">{internalCode}</span>
              )}
              {internalCode && templateName && <span className="text-[12px] text-[#cbd5e1]">·</span>}
              {templateName && (
                <HuemulTruncatedText text={templateName} className="min-w-0 text-[12.5px] text-[#64748b]" />
              )}
            </div>
          )}
          <HuemulTruncatedText
            as="p"
            text={documentName ?? ""}
            className="text-[17px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#0f172a]"
          />
          {metaParts.length > 0 && (
            <HuemulTruncatedText as="p" text={metaParts.join(" · ")} className="text-[12px] text-[#64748b]" />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {showActions && (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              tooltip={tCommon("refresh")}
              loading={isFetching}
              onClick={onRefresh}
              className={ICON_BUTTON_CLASS}
              iconClassName="h-[15px] w-[15px]"
            />
          )}
          {secondaryActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title={tCommon("actions")}
                  aria-label={tCommon("actions")}
                  className={`${ICON_BUTTON_CLASS} hover:cursor-pointer`}
                >
                  <MoreVertical className="h-[15px] w-[15px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6}>
                {secondaryActions.map((action) => (
                  <DropdownMenuItem key={action.key} onClick={action.onClick} className="text-[13px]">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {showClose && (
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={X}
              tooltip={tCommon("close")}
              onClick={onClose}
              className={ICON_BUTTON_CLASS}
              iconClassName="h-[15px] w-[15px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
