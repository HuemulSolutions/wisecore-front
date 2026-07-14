import {
  MoreVertical,
  Tag,
  Undo2,
  Check,
  Globe,
  Archive,
  RefreshCw,
  List,
  Info,
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HuemulButton } from "@/huemul/components/huemul-button";

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
  /** Show the bg-gray-50 wrapper (used in reader mode header) */
  withBackground?: boolean;
  lifecyclePermissions: LifecyclePermissions | undefined;
  frontendPermissions: FrontendPermissions;
  lifecycleStatus?: LifecycleStatus | null;
  selectedExecutionId?: string | null;
  hasTemplateName: boolean;
  canCreateTemplate: boolean;
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
  onRefresh: () => void;
  onToggleToc: () => void;
  onOpenInfo: () => void;
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
  withBackground = false,
  lifecyclePermissions,
  frontendPermissions,
  lifecycleStatus,
  selectedExecutionId,
  hasTemplateName,
  canCreateTemplate,
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
  onRefresh,
  onToggleToc,
  onOpenInfo,
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

  const hasLifecyclePerms =
    lifecyclePermissions?.view ||
    lifecyclePermissions?.create ||
    lifecyclePermissions?.edit ||
    lifecyclePermissions?.review ||
    lifecyclePermissions?.approve ||
    lifecyclePermissions?.publish ||
    lifecyclePermissions?.archive;

  const hasLifecycleActions =
    lifecyclePermissions?.approve ||
    lifecycleStatus?.can_advance ||
    lifecycleStatus?.can_rollback ||
    lifecyclePermissions?.publish ||
    lifecyclePermissions?.archive;

  const menu = (
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
      <DropdownMenuContent align={dropdownAlign} className="w-52">
        {/* ── Reader mode: lifecycle actions ── */}
        {isViewMode && lifecycleStatus && (
          <>
            {lifecyclePermissions?.approve &&
              (lifecycleStatus.version_required || lifecycleStatus.state === "in_approval") &&
              !lifecycleStatus.version && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onAssignVersion, 0)}
                  className="hover:cursor-pointer"
                >
                  <Tag className="mr-2 h-4 w-4" />
                  {t("content.assignVersion")}
                </DropdownMenuItem>
              )}
            {lifecycleStatus.can_rollback && (
              <DropdownMenuItem
                onSelect={() => setTimeout(onRejectLifecycle, 0)}
                className="hover:cursor-pointer"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {t("lifecycle.return")}
              </DropdownMenuItem>
            )}
            {lifecycleStatus.can_advance && (
              <DropdownMenuItem
                onSelect={() => setTimeout(onCheckLifecycle, 0)}
                className="hover:cursor-pointer"
                disabled={lifecycleStatus.version_required && !lifecycleStatus.version}
              >
                <Check className="mr-2 h-4 w-4" />
                {t("lifecycle.complete")}
              </DropdownMenuItem>
            )}
            {lifecyclePermissions?.publish && lifecycleStatus.state === "approved" && (
              <DropdownMenuItem
                onSelect={() => setTimeout(onPublish, 0)}
                className="hover:cursor-pointer"
              >
                <Globe className="mr-2 h-4 w-4" />
                {t("lifecycle.publish")}
              </DropdownMenuItem>
            )}
            {lifecyclePermissions?.archive &&
              (lifecycleStatus.state === "approved" || lifecycleStatus.state === "published") && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onArchive, 0)}
                  className="hover:cursor-pointer"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {t("lifecycle.archive")}
                </DropdownMenuItem>
              )}
            {hasLifecycleActions && <DropdownMenuSeparator />}
          </>
        )}

        {/* ── Reader mode: refresh, TOC ── */}
        {isViewMode && (
          <>
            <DropdownMenuItem
              onSelect={() => setTimeout(onRefresh, 0)}
              className="hover:cursor-pointer"
              disabled={isRefreshing || isLoadingContent}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {t("content.refreshContent")}
            </DropdownMenuItem>
            {isDocumentType && hasDocumentContent && hasTocItems && (
              <DropdownMenuItem
                onSelect={() => onToggleToc()}
                className="hover:cursor-pointer"
              >
                <List className="mr-2 h-4 w-4" />
                {isTocSidebarOpen ? t("content.hideSidebar") : t("content.showSidebar")}
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* ── Rerun external publish (visible in both reader and editor mode) ── */}
        {lifecyclePermissions?.publish && lifecycleStatus?.state === "published" && (
          <>
            <DropdownMenuItem
              onSelect={() => setTimeout(onRerunExternalPublish, 0)}
              className="hover:cursor-pointer"
              disabled={isRerunningExternalPublish}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRerunningExternalPublish ? "animate-spin" : ""}`} />
              {t("lifecycle.rerunExternalPublish")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* ── Asset Info (visible in both reader and editor mode) ── */}
        <DropdownMenuItem
          onSelect={() => setTimeout(onOpenInfo, 0)}
          className="hover:cursor-pointer"
        >
          <Info className="mr-2 h-4 w-4" />
          {t("content.assetInfo")}
        </DropdownMenuItem>

        {/* ── Asset Permissions (always visible) ── */}
        <DropdownMenuItem
          onSelect={() => setTimeout(onOpenPermissions, 0)}
          className="hover:cursor-pointer"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          {t("content.assetPermissions")}
        </DropdownMenuItem>

        {/* ── Sections / Dependencies / Context ── */}
        {frontendPermissions.canAccessSectionSheet &&
          (!frontendPermissions.canEditSections || isViewMode) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setTimeout(onOpenSections, 0)}
                className="hover:cursor-pointer"
              >
                <BetweenHorizontalStart className="mr-2 h-4 w-4" />
                {t("content.sectionsLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTimeout(onOpenDependencies, 0)}
                className="hover:cursor-pointer"
              >
                <Link2 className="mr-2 h-4 w-4" />
                {t("content.dependenciesLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTimeout(onOpenContext, 0)}
                className="hover:cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                {t("content.contextLabel")}
              </DropdownMenuItem>
              {!isViewMode && <DropdownMenuSeparator />}
            </>
          )}

        {/* ── Compare versions ── */}
        {canCompareVersions && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setTimeout(onCompareVersions, 0)}
              className="hover:cursor-pointer"
            >
              <GitCompare className="mr-2 h-4 w-4" />
              {t("content.compareVersions")}
            </DropdownMenuItem>
          </>
        )}

        {/* ── Clone ── */}
        {lifecyclePermissions?.create && selectedExecutionId && (
          <>
            {isViewMode && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={() => setTimeout(onClone, 0)}
              className="hover:cursor-pointer"
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("content.cloneVersion")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setTimeout(onCloneToNew, 0)}
              className="hover:cursor-pointer"
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("content.cloneToNewDocument")}
            </DropdownMenuItem>
          </>
        )}

        {/* ── Create template ── */}
        {!hasTemplateName && canCreateTemplate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setTimeout(onCreateTemplate, 0)}
              className="hover:cursor-pointer"
            >
              <FileCode className="mr-2 h-4 w-4" />
              {t("content.createTemplateFromAsset")}
            </DropdownMenuItem>
          </>
        )}

        {/* ── Export ── */}
        {hasLifecyclePerms && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:cursor-pointer" onClick={onExportMarkdown}>
              <FileText className="mr-2 h-4 w-4" />
              {t("content.exportAsMarkdown")}
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:cursor-pointer" onClick={onExportWord}>
              <Download className="mr-2 h-4 w-4" />
              {t("content.exportAsWord")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:cursor-pointer"
              onSelect={() => setTimeout(onExportCustomWord, 0)}
            >
              <FileCode className="mr-2 h-4 w-4" />
              {t("content.exportAsCustomWord")}
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:cursor-pointer" onClick={onExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {t("content.exportAsExcel")}
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:cursor-pointer" onClick={onExportVersion}>
              <FileJson className="mr-2 h-4 w-4" />
              {t("content.exportAsVersionConfig")}
            </DropdownMenuItem>
          </>
        )}

        {/* ── Delete (edit stage only) ── */}
        {(lifecyclePermissions?.edit || lifecyclePermissions?.create) &&
          lifecycleStatus?.stage === "edit" && (
            <>
              <DropdownMenuSeparator />
              {selectedExecutionId && (
                <DropdownMenuItem
                  onSelect={() => setTimeout(onDeleteVersion, 0)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("content.deleteVersion")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => setTimeout(onDeleteDocument, 0)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
              >
                <FileX className="mr-2 h-4 w-4" />
                {t("content.deleteDocumentLabel")}
              </DropdownMenuItem>
            </>
          )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (withBackground) {
    return (
      <div className="flex items-center bg-gray-50 p-1 rounded-lg">
        {menu}
      </div>
    );
  }

  return menu;
}
