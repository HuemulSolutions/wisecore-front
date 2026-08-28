import {
  MoreVertical,
  Tag,
  Undo2,
  Check,
  Globe,
  Archive,
  RotateCcw,
  RefreshCw,
  List,
  Info,
  History,
  Workflow,
  ShieldCheck,
  BetweenHorizontalStart,
  Link2,
  Users,
  Copy,
  GitCompare,
  FileCode,
  FileText,
  Download,
  FileSpreadsheet,
  FileJson,
  Trash2,
  FileX,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  version_required?: boolean;
  version?: string | null;
  current_group?: string | null;
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
  onAssignVersion: () => void;
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
  canAccessDiagrams: boolean;
  onOpenDiagrams: () => void;
  onOpenPermissions: () => void;
  onOpenSections: () => void;
  onOpenDependencies: () => void;
  onOpenContext: () => void;
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
  onAssignVersion,
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
  canAccessDiagrams,
  onOpenDiagrams,
  onOpenPermissions,
  onOpenSections,
  onOpenDependencies,
  onOpenContext,
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
    "px-2 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

  // ── Ciclo de vida ──
  const showAssignVersion =
    isViewMode &&
    !!lifecycleStatus &&
    !!lifecyclePermissions?.approve &&
    (lifecycleStatus.version_required || lifecycleStatus.state === "in_approval") &&
    !lifecycleStatus.version;
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
  const showLifecycleGroup =
    showAssignVersion ||
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
          iconClassName="h-3.5 w-3.5"
          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-200 hover:cursor-pointer"
          tooltip={t("content.moreOptions")}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={dropdownAlign} className="w-56">
        {/* ── Ciclo de vida ── */}
        {showLifecycleGroup && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className={groupLabelClass}>
                {t("content.menuGroupLifecycle")}
              </DropdownMenuLabel>
              {showAssignVersion && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onAssignVersion, 0)}
                  className="hover:cursor-pointer"
                >
                  <Tag className="h-4 w-4" />
                  {t("content.assignVersion")}
                </DropdownMenuItem>
              )}
              {showReturn && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onRejectLifecycle, 0)}
                  className="hover:cursor-pointer"
                >
                  <Undo2 className="h-4 w-4" />
                  {t("lifecycle.return")}
                </DropdownMenuItem>
              )}
              {showComplete && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onCheckLifecycle, 0)}
                  className="hover:cursor-pointer"
                  disabled={lifecycleStatus?.version_required && !lifecycleStatus?.version}
                >
                  <Check className="h-4 w-4" />
                  {t("lifecycle.complete")}
                </DropdownMenuItem>
              )}
              {showPublish && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onPublish, 0)}
                  className="hover:cursor-pointer"
                >
                  <Globe className="h-4 w-4" />
                  {t("lifecycle.publish")}
                </DropdownMenuItem>
              )}
              {showArchive && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onArchive, 0)}
                  className="hover:cursor-pointer"
                >
                  <Archive className="h-4 w-4" />
                  {t("lifecycle.archive")}
                </DropdownMenuItem>
              )}
              {showRestore && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onRestore, 0)}
                  className="hover:cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("lifecycle.restore")}
                </DropdownMenuItem>
              )}
              {showRerunPublish && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onRerunExternalPublish, 0)}
                  className="hover:cursor-pointer"
                  disabled={isRerunningExternalPublish}
                >
                  <RefreshCw className={`h-4 w-4 ${isRerunningExternalPublish ? "animate-spin" : ""}`} />
                  {t("lifecycle.rerunExternalPublish")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
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
                className="hover:cursor-pointer"
                disabled={isRefreshing || isLoadingContent}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {t("content.refreshContent")}
              </DropdownMenuItem>
              {showToc && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onToggleToc, 0)}
                  className="hover:cursor-pointer"
                >
                  <List className="h-4 w-4" />
                  {isTocSidebarOpen ? t("content.hideSidebar") : t("content.showSidebar")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* ── Ver ── */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className={groupLabelClass}>
            {t("content.menuGroupView")}
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => setTimeout(onOpenInfo, 0)}
            className="hover:cursor-pointer"
          >
            <Info className="h-4 w-4" />
            {t("content.assetInfo")}
          </DropdownMenuItem>
          {hasDocumentContent && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onOpenLifecycleHistory, 0)}
              className="hover:cursor-pointer"
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
          {canManageGrants && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onOpenPermissions, 0)}
              className="hover:cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              {t("content.assetPermissions")}
            </DropdownMenuItem>
          )}
          {showStructure && (
            <>
              <DropdownMenuItem
                onSelect={() => setTimeout(onOpenSections, 0)}
                className="hover:cursor-pointer"
              >
                <BetweenHorizontalStart className="h-4 w-4" />
                {t("content.sectionsLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTimeout(onOpenDependencies, 0)}
                className="hover:cursor-pointer"
              >
                <Link2 className="h-4 w-4" />
                {t("content.dependenciesLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTimeout(onOpenContext, 0)}
                className="hover:cursor-pointer"
              >
                <Users className="h-4 w-4" />
                {t("content.contextLabel")}
              </DropdownMenuItem>
            </>
          )}
          {canCompareVersions && (
            <DropdownMenuItem
              onSelect={() => setTimeout(onCompareVersions, 0)}
              className="hover:cursor-pointer"
            >
              <GitCompare className="h-4 w-4" />
              {t("content.compareVersions")}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        {/* ── Duplicar ── */}
        {showDuplicateGroup && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className={groupLabelClass}>
                {t("content.menuGroupDuplicate")}
              </DropdownMenuLabel>
              {showClone && (
                <>
                  <DropdownMenuItem
                    onSelect={() => setTimeout(onClone, 0)}
                    className="hover:cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    {t("content.cloneVersion")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setTimeout(onCloneToNew, 0)}
                    className="hover:cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    {t("content.cloneToNewDocument")}
                  </DropdownMenuItem>
                </>
              )}
              {showCreateTemplate && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onCreateTemplate, 0)}
                  className="hover:cursor-pointer"
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
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="hover:cursor-pointer">
                <Download className="h-4 w-4" />
                {t("content.exportMenu")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuItem
                  className="hover:cursor-pointer"
                  onSelect={() => setTimeout(onExportMarkdown, 0)}
                >
                  <FileText className="h-4 w-4" />
                  {t("content.exportFormatMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:cursor-pointer"
                  onSelect={() => setTimeout(onExportWord, 0)}
                >
                  <Download className="h-4 w-4" />
                  {t("content.exportFormatWord")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:cursor-pointer"
                  onSelect={() => setTimeout(onExportCustomWord, 0)}
                >
                  <FileCode className="h-4 w-4" />
                  {t("content.exportFormatCustomWord")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:cursor-pointer"
                  onSelect={() => setTimeout(onExportExcel, 0)}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t("content.exportFormatExcel")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:cursor-pointer"
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
            <DropdownMenuSeparator />
            {selectedExecutionId && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setTimeout(onDeleteVersion, 0)}
                className="hover:cursor-pointer"
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
              className="hover:cursor-pointer"
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
