import { useTranslation } from "react-i18next";
import {
  File,
  Trash2,
  ExternalLink,
  GitBranch,
  MoreVertical,
  FolderTree,
} from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dependency } from "@/types/dependency/sheets";

// Extraído de dependency-panel.tsx: la fila es idéntica entre dependencias de
// documento y de template (mismo shape de item, mismo booleano canEdit), así
// que se comparte en vez de duplicarse. Ver ia context/ del cambio de backend
// que agregó dependencias a nivel de template.
export function getVersionModeBadgeLabel(dependency: Dependency, t: (key: string) => string): string {
  if (dependency.version_mode === 'specific') {
    return dependency.depends_on_execution_name || t('versionMode.badge.specificFallback');
  }
  if (dependency.version_mode === 'latest_approved') {
    return t('versionMode.badge.latestApproved');
  }
  return t('versionMode.badge.published');
}

export interface DependencyListItemProps {
  dependency: Dependency;
  orgId: string | undefined;
  canEdit: boolean;
  /** Carpeta/ruta del documento dependido, si se resolvió (ver dependency-panel.tsx). */
  folderPath?: string;
  onChangeVersion: (dependency: Dependency) => void;
  onRemove: (dependency: Dependency) => void;
  /** Presente solo donde hay un árbol de Assets visible para resaltar (ver dependency-panel.tsx). */
  onLocateInTree?: (dependency: Dependency) => void;
}

export function DependencyListItem({ dependency, orgId, canEdit, folderPath, onChangeVersion, onRemove, onLocateInTree }: DependencyListItemProps) {
  const { t } = useTranslation('dependencies');

  return (
    <li className="flex items-center gap-3 px-2 py-2.5">
      <File
        className="h-4 w-4 shrink-0"
        style={{ color: dependency.document_type?.color || "currentColor" }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {dependency.document_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {[
            dependency.document_type?.name,
            folderPath,
            getVersionModeBadgeLabel(dependency, t),
            dependency.section_name
              ? t('list.sectionLabel', { name: dependency.section_name })
              : null,
          ].filter(Boolean).join(' · ')}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <HuemulButton
            size="sm"
            variant="ghost"
            icon={MoreVertical}
            iconClassName="h-3.5 w-3.5"
            className="h-7 w-7 p-0 shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-200 hover:cursor-pointer"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="hover:cursor-pointer"
            onSelect={() => setTimeout(() => window.open(`/${orgId}/asset/${dependency.document_id}`, '_blank'), 0)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('viewDocument')}
          </DropdownMenuItem>
          {onLocateInTree && (
            <DropdownMenuItem
              className="hover:cursor-pointer"
              onSelect={() => setTimeout(() => onLocateInTree(dependency), 0)}
            >
              <FolderTree className="mr-2 h-4 w-4" />
              {t('locateInTree')}
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem
              className="hover:cursor-pointer"
              onSelect={() => setTimeout(() => onChangeVersion(dependency), 0)}
            >
              <GitBranch className="mr-2 h-4 w-4" />
              {t('changeVersion')}
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem
              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
              onSelect={() => setTimeout(() => onRemove(dependency), 0)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('removeDependency')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
