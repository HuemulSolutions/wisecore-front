import {
  MoreVertical,
  Undo2,
  Check,
  Globe,
  Archive,
  RotateCcw,
  RefreshCw,
  List,
  Info,
  History,
  ShieldCheck,
  BetweenHorizontalStart,
  Database,
  Copy,
  GitCompare,
  FileCode,
  FileText,
  Download,
  FileSpreadsheet,
  FileJson,
  Trash2,
  FileX,
  Maximize2,
  Minimize2,
  Paperclip,
  Library,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { isRestorableLifecycleState } from "@/lib/lifecycle-access";

interface LifecycleStatus {
  stage: string;
  state: string;
  can_advance?: boolean;
  can_rollback?: boolean;
  current_group?: string | null;
  is_locked_external_elaboration?: boolean;
}

interface LifecyclePermissions {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  review?: boolean;
  approve?: boolean;
  publish?: boolean;
  archive?: boolean;
}

interface FrontendPermissions {
  canAccessSectionSheet: boolean;
  canEditSections: boolean;
}

interface MoreOptionsDropdownProps {
  isViewMode: boolean;
  /** Align the dropdown content */
  dropdownAlign?: "start" | "end";
  lifecyclePermissions: LifecyclePermissions | undefined;
  frontendPermissions: FrontendPermissions;
  lifecycleStatus?: LifecycleStatus | null;
  /** Etapa final del ciclo de vida del tipo de activo — oculta "Publicar" si nunca llega a publicarse. Default `'publish'`. */
  finalLifecycleStage?: "edit" | "review" | "approve" | "publish";
  selectedExecutionId?: string | null;
  /** Label compacto de la versión seleccionada (ej. `v1.0.0`) usado en el item de eliminar versión. */
  selectedVersionLabel?: string;
  hasTemplateName: boolean;
  canCreateTemplate: boolean;
  // Capacidades RBAC del asset. Sin default a propósito (obligatorias): un
  // default permisivo es indistinguible de "todavía no lo gatearon" — ver punto
  // 9 del checklist en ia context/rbac-audit-guide.md.
  /** asset:u — otorgar/revocar grants de lifecycle del asset */
  canManageGrants: boolean;
  /** asset:c — clonar versión / clonar a nuevo documento */
  canCloneVersion: boolean;
  /** asset:r — exportar en cualquier formato */
  canExportVersion: boolean;
  /** asset:d — borrar versión y borrar documento */
  canDeleteVersion: boolean;
  isRefreshing: boolean;
  isLoadingContent: boolean;
  hasTocItems: boolean;
  isDocumentType: boolean;
  hasDocumentContent: boolean;
  isTocSidebarOpen: boolean;
  /** True when there are ≥2 versions to compare */
  canCompareVersions: boolean;
  // Callbacks
  onCompareVersions: () => void;
  onRejectLifecycle: () => void;
  onCheckLifecycle: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onRefresh: () => void;
  onToggleToc: () => void;
  onOpenInfo: () => void;
  onOpenLifecycleHistory: () => void;
  onOpenPermissions: () => void;
  onOpenSections: () => void;
  onOpenSources: () => void;
  onOpenDependencies: () => void;
  onOpenContext: () => void;
  /** "Agregar a colección": solo se muestra si se pasa (lo decide el permiso). */
  onAddToCollection?: () => void;
  onClone: () => void;
  onCloneToNew: () => void;
  onCreateTemplate: () => void;
  onExportMarkdown: () => void;
  onExportWord: () => void;
  onExportCustomWord: () => void;
  onExportExcel: () => void;
  onExportVersion: () => void;
  onDeleteVersion: () => void;
  onDeleteDocument: () => void;
  isRerunningExternalPublish: boolean;
  onRerunExternalPublish: () => void;
}

/** Separador entre grupos: border-t del diseño (en vez del bg-border del primitivo). */
function MenuDivider() {
  return <div role="separator" className="my-1 border-t border-[#eef1f6]" />;
}

export function MoreOptionsDropdown({
  isViewMode,
  dropdownAlign = "end",
  lifecyclePermissions,
  frontendPermissions,
  lifecycleStatus,
  finalLifecycleStage = "publish",
  selectedExecutionId,
  selectedVersionLabel,
  hasTemplateName,
  canCreateTemplate,
  canManageGrants,
  canCloneVersion,
  canExportVersion,
  canDeleteVersion,
  isRefreshing,
  isLoadingContent,
  hasTocItems,
  isDocumentType,
  hasDocumentContent,
  isTocSidebarOpen,
  canCompareVersions,
  onCompareVersions,
  onRejectLifecycle,
  onCheckLifecycle,
  onPublish,
  onArchive,
  onRestore,
  onRefresh,
  onToggleToc,
  onOpenInfo,
  onOpenLifecycleHistory,
  onOpenPermissions,
  onOpenSections,
  onOpenSources,
  onOpenDependencies,
  onOpenContext,
  onAddToCollection,
  onClone,
  onCloneToNew,
  onCreateTemplate,
  onExportMarkdown,
  onExportWord,
  onExportCustomWord,
  onExportExcel,
  onExportVersion,
  onDeleteVersion,
  onDeleteDocument,
  isRerunningExternalPublish,
  onRerunExternalPublish,
}: MoreOptionsDropdownProps) {
  const { t } = useTranslation(["assets"]);

  const groupLabelClass =
    "px-2 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400";
  const itemClass = "h-8 rounded-[7px] text-[13px] font-medium hover:cursor-pointer";

  // ── Ciclo de vida ──
  const showReturn = isViewMode && !!lifecycleStatus && !!lifecycleStatus.can_rollback;
  const showComplete = isViewMode && !!lifecycleStatus && !!lifecycleStatus.can_advance;
  const showPublish =
    isViewMode &&
    !!lifecycleStatus &&
    !!lifecyclePermissions?.publish &&
    lifecycleStatus.state === "approved" &&
    finalLifecycleStage === "publish";
  const showArchive =
    isViewMode &&
    !!lifecycleStatus &&
    !!lifecyclePermissions?.archive &&
    (lifecycleStatus.state === "approved" || lifecycleStatus.state === "published");
  const showRestore =
    isViewMode &&
    !!lifecycleStatus &&
    !!lifecyclePermissions?.archive &&
    isRestorableLifecycleState(lifecycleStatus.state);
  const showRerunPublish =
    !!lifecyclePermissions?.publish && lifecycleStatus?.state === "published";
  // Ausente ⇒ no bloqueado (payloads viejos); nunca comparar por truthiness. Ver lib/lifecycle-access.ts.
  const elaborationLocked = lifecycleStatus?.is_locked_external_elaboration === true;
  const showLifecycleGroup =
    showReturn ||
    showComplete ||
    showPublish ||
    showArchive ||
    showRestore ||
    showRerunPublish;

  // ── Vista ──
  const showToc = isViewMode && isDocumentType && hasDocumentContent && hasTocItems;
  const showDisplayGroup = isViewMode;

  // ── Ver ──
  const showStructure =
    frontendPermissions.canAccessSectionSheet &&
    (!frontendPermissions.canEditSections || isViewMode);

  // ── Duplicar ──
  const showClone = !!lifecyclePermissions?.create && canCloneVersion && !!selectedExecutionId;
  const showCreateTemplate = !hasTemplateName && canCreateTemplate;
  const showDuplicateGroup = showClone || showCreateTemplate;

  // ── Exportar / Peligro ──
  const hasLifecyclePerms =
    lifecyclePermissions?.view ||
    lifecyclePermissions?.create ||
    lifecyclePermissions?.edit ||
    lifecyclePermissions?.review ||
    lifecyclePermissions?.approve ||
    lifecyclePermissions?.publish ||
    lifecyclePermissions?.archive;
  const showExport = !!hasLifecyclePerms && canExportVersion;
  const showDanger =
    (lifecyclePermissions?.edit || lifecyclePermissions?.create) &&
    canDeleteVersion &&
    lifecycleStatus?.stage === "edit";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HuemulButton
          size="sm"
          variant="ghost"
          icon={MoreVertical}
          iconClassName="h-4 w-4"
          aria-label={t("content.moreOptions")}
          className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40"
          tooltip={t("content.moreOptions")}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={dropdownAlign}
        className="w-[272px] rounded-xl p-1.5 shadow-[0_20px_40px_-14px_rgba(15,23,42,0.28)]"
      >
        {/* ── Ciclo de vida ── */}
        {showLifecycleGroup && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className={groupLabelClass}>
                {t("content.menuGroupLifecycle")}
              </DropdownMenuLabel>
              {showReturn && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onRejectLifecycle, 0)}
                  className={itemClass}
                  disabled={elaborationLocked}
                >
                  <Undo2 className="h-4 w-4" />
                  {t("lifecycle.return")}
                </DropdownMenuItem>
              )}
              {showComplete && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onCheckLifecycle, 0)}
                  className={itemClass}
                  disabled={elaborationLocked}
                >
                  <Check className="h-4 w-4" />
                  {t("lifecycle.complete")}
                </DropdownMenuItem>
              )}
              {showPublish && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onPublish, 0)}
                  className={itemClass}
                  disabled={elaborationLocked}
                >
                  <Globe className="h-4 w-4" />
                  {t("lifecycle.publish")}
                </DropdownMenuItem>
              )}
              {showArchive && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onArchive, 0)}
                  className={itemClass}
                  disabled={elaborationLocked}
                >
                  <Archive className="h-4 w-4" />
                  {t("lifecycle.archive")}
                </DropdownMenuItem>
              )}
              {showRestore && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onRestore, 0)}
                  className={itemClass}
                  disabled={elaborationLocked}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("lifecycle.restore")}
                </DropdownMenuItem>
              )}
              {showRerunPublish && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onRerunExternalPublish, 0)}
                  className={itemClass}
                  disabled={isRerunningExternalPublish || elaborationLocked}
                >
                  <RefreshCw className={`h-4 w-4 ${isRerunningExternalPublish ? "animate-spin" : ""}`} />
                  {t("lifecycle.rerunExternalPublish")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <MenuDivider />
          </>
        )}

        {/* ── Vista ── */}
        {showDisplayGroup && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className={groupLabelClass}>
                {t("content.menuGroupDisplay")}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => setTimeout(onRefresh, 0)}
                className={itemClass}
                disabled={isRefreshing || isLoadingContent}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {t("content.refreshContent")}
              </DropdownMenuItem>
              {showToc && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onToggleToc, 0)}
                  className={itemClass}
                >
                  <List className="h-4 w-4" />
                  {isTocSidebarOpen ? t("content.hideSidebar") : t("content.showSidebar")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <MenuDivider />
          </>
        )}

        {/* ── Ver ── */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className={groupLabelClass}>
            {t("content.menuGroupView")}
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => setTimeout(onOpenInfo, 0)}
            className={itemClass}
          >
            <Info className="h-4 w-4" />
            {t("content.assetInfo")}
          </DropdownMenuItem>
          {hasDocumentContent && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onOpenLifecycleHistory, 0)}
              className={itemClass}
            >
              <History className="h-4 w-4" />
              {t("lifecycleHistory.moreOptionsItem")}
            </DropdownMenuItem>
          )}
          {canAccessDiagrams && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onOpenDiagrams, 0)}
              className="hover:cursor-pointer"
            >
              <Workflow className="h-4 w-4" />
              {t("content.diagramsLabel")}
            </DropdownMenuItem>
          )}
          {canAccessMedia && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onOpenMedia, 0)}
              className="hover:cursor-pointer"
            >
              <Paperclip className="h-4 w-4" />
              {t("content.mediaLabel")}
            </DropdownMenuItem>
          )}
          {onAddToCollection && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onAddToCollection, 0)}
              className="hover:cursor-pointer"
            >
              <Library className="h-4 w-4" />
              {t("collections:addToCollection.menuItem")}
            </DropdownMenuItem>
          )}
          {canManageGrants && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onOpenPermissions, 0)}
              className={itemClass}
            >
              <ShieldCheck className="h-4 w-4" />
              {t("content.assetPermissions")}
            </DropdownMenuItem>
          )}
          {showStructure && (
            <>
              <DropdownMenuItem
                onSelect={() => setTimeout(onOpenSections, 0)}
                className={itemClass}
              >
                <BetweenHorizontalStart className="h-4 w-4" />
                {t("content.sectionsLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTimeout(onOpenSources, 0)}
                className={itemClass}
              >
                <Database className="h-4 w-4" />
                {t("content.sourcesLabel")}
              </DropdownMenuItem>
            </>
          )}
          {canCompareVersions && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onCompareVersions, 0)}
              className={itemClass}
            >
              <GitCompare className="h-4 w-4" />
              {t("content.compareVersions")}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        {/* ── Duplicar ── */}
        {showDuplicateGroup && (
          <>
            <MenuDivider />
            <DropdownMenuGroup>
              <DropdownMenuLabel className={groupLabelClass}>
                {t("content.menuGroupDuplicate")}
              </DropdownMenuLabel>
              {showClone && (
                <>
                  <DropdownMenuItem
                    onSelect={() => setTimeout(onClone, 0)}
                    className={itemClass}
                  >
                    <Copy className="h-4 w-4" />
                    {t("content.cloneVersion")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setTimeout(onCloneToNew, 0)}
                    className={itemClass}
                  >
                    <Copy className="h-4 w-4" />
                    {t("content.cloneToNewDocument")}
                  </DropdownMenuItem>
                </>
              )}
              {showCreateTemplate && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onCreateTemplate, 0)}
                  className={itemClass}
                >
                  <FileCode className="h-4 w-4" />
                  {t("content.createTemplateFromAsset")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </>
        )}

        {/* ── Exportar ── */}
        {showExport && (
          <>
            <MenuDivider />
            <DropdownMenuLabel className={groupLabelClass}>{t("content.menuGroupExport")}</DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={itemClass}>
                <Download className="h-4 w-4" />
                {t("content.exportMenu")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 rounded-xl p-1.5">
                <DropdownMenuItem
                  className={itemClass}
                  onSelect={() => setTimeout(onExportMarkdown, 0)}
                >
                  <FileText className="h-4 w-4" />
                  {t("content.exportFormatMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={itemClass}
                  onSelect={() => setTimeout(onExportWord, 0)}
                >
                  <Download className="h-4 w-4" />
                  {t("content.exportFormatWord")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={itemClass}
                  onSelect={() => setTimeout(onExportCustomWord, 0)}
                >
                  <FileCode className="h-4 w-4" />
                  {t("content.exportFormatCustomWord")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={itemClass}
                  onSelect={() => setTimeout(onExportExcel, 0)}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t("content.exportFormatExcel")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={itemClass}
                  onSelect={() => setTimeout(onExportVersion, 0)}
                >
                  <FileJson className="h-4 w-4" />
                  {t("content.exportFormatPortable")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {/* ── Peligro ── */}
        {showDanger && (
          <>
            <MenuDivider />
            <DropdownMenuLabel className={groupLabelClass}>{t("content.menuGroupDanger")}</DropdownMenuLabel>
            {selectedExecutionId && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setTimeout(onDeleteVersion, 0)}
                className={itemClass}
              >
                <Trash2 className="h-4 w-4" />
                {selectedVersionLabel
                  ? t("content.deleteVersionNamed", { version: selectedVersionLabel })
                  : t("content.deleteVersion")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setTimeout(onDeleteDocument, 0)}
              className={itemClass}
            >
              <FileX className="h-4 w-4" />
              {t("content.deleteDocumentLabel")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
