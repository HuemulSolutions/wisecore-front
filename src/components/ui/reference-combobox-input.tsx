'use client';

import * as React from 'react';

import type { TComboboxInputElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';
import { useComboboxContext } from '@ariakit/react';
import {
  ChevronRight,
  File,
  Folder,
  Shield,
  CornerDownRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useEffectiveOrgId } from '@/hooks/useOrgRouter';
import { useMentionSearch } from '@/hooks/useMentionSearch';
import { useMentionFolderContent } from '@/hooks/useMentionFolderContent';
import { useRolesMap } from '@/contexts/role-refs-context';
import { ASSET_REFERENCE_KEY, ROLE_REFERENCE_KEY } from '@/lib/plate-reference-utils';
import {
  getCurrentExecution,
  getPendingExecution,
  getRemainingExecutionCount,
  hasPendingNewerExecution,
} from '@/lib/library-executions';
import { getExecutionCompactLabel, getExecutionVersionNumber } from '@/components/assets/content/utils/version-utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HighlightedText } from '@/components/ui/highlighted-text';
import type { LibraryContentAsset, LibraryContentAssetExecution, LibraryContentFolder } from '@/types/folders';
import type { Role } from '@/types/rbac';
import type { AssetReferenceElement, RoleReferenceElement } from '@/types/reference';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type TypeFilter = 'asset' | 'role';
type View = 'results' | 'version';
type TrailSegment = { id: string | null; name: string };

const VERSIONS_SHOWN_DEFAULT = 5;

/** `nombre@1.0.7` — atajo tipiado que fija una versión sin pasar por la vista de versión. */
function parseVersionShorthand(search: string): { namePart: string; versionPart: string } | null {
  const match = /^(.+)@([\w.]+)$/.exec(search);
  if (!match) return null;
  return { namePart: match[1].trim(), versionPart: match[2].trim().replace(/^v/i, '') };
}

function normalizeForCompare(s: string): string {
  return s.trim().toLowerCase();
}

// ─── Filas ────────────────────────────────────────────────────────────────────

function AssetRow({
  asset,
  term,
  onDrillIn,
}: {
  asset: LibraryContentAsset;
  term: string;
  onDrillIn: (asset: LibraryContentAsset) => void;
}) {
  const current = getCurrentExecution(asset);
  const color = asset.document_type?.color;

  return (
    <InlineComboboxItem
      id={asset.id}
      value={asset.id}
      label={asset.name}
      // La fila siempre abre la vista de versión (no inserta directo) — no debe
      // borrar el `mention_input` (keepInput) ni escribir el value en el input real
      // (setValueOnClick/selectValueOnClick/hideOnClick en false), igual que FolderRow.
      keepInput
      setValueOnClick={false}
      selectValueOnClick={false}
      hideOnClick={false}
      onClick={() => onDrillIn(asset)}
      className="h-auto min-h-9.5 items-center justify-between gap-2 rounded-xl py-1.5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-muted"
          style={{ color: color || undefined }}
        >
          <File className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <HighlightedText text={asset.name} term={term} className="block truncate text-[13px] font-medium text-[#0f172a]" />
          <p className="flex items-center gap-1 truncate text-[11px] text-[#64748b]">
            {color && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
            {asset.document_type?.name}
            {(asset.folder_path ?? asset.folder_name) && <span> · {asset.folder_path ?? asset.folder_name}</span>}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {current && <span className="text-xs text-[#64748b]">{getExecutionCompactLabel(current)}</span>}
        <ChevronRight className="h-4 w-4 shrink-0 text-[#94a3b8]" />
      </div>
    </InlineComboboxItem>
  );
}

function FolderRow({ folder, onEnter }: { folder: LibraryContentFolder; onEnter: (folder: LibraryContentFolder) => void }) {
  return (
    <InlineComboboxItem
      id={`folder-${folder.id}`}
      value={`folder:${folder.id}`}
      label={folder.name}
      // La fila navega dentro del mismo popover — no debe borrar el `mention_input`
      // (keepInput) ni escribir el value en el input real (setValueOnClick/
      // selectValueOnClick/hideOnClick en false), a diferencia de una fila normal.
      keepInput
      setValueOnClick={false}
      selectValueOnClick={false}
      hideOnClick={false}
      onClick={() => onEnter(folder)}
      className="h-auto min-h-9.5 items-center justify-between gap-2 rounded-xl py-1.5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-muted text-[#64748b]">
          <Folder className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-[13px] font-medium text-[#0f172a]">{folder.name}</span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#94a3b8]" />
    </InlineComboboxItem>
  );
}

function RoleRow({
  role,
  term,
  rolesMap,
  onSelect,
}: {
  role: Role;
  term: string;
  rolesMap: Record<string, Role>;
  onSelect: (role: Role) => void;
}) {
  const { t } = useTranslation('editor');
  const parent = role.parent_role_id ? rolesMap[role.parent_role_id] : undefined;

  return (
    <InlineComboboxItem
      id={role.id}
      value={role.id}
      label={role.name}
      onClick={() => onSelect(role)}
      className="h-auto min-h-9.5 items-center gap-2 rounded-xl py-1.5"
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted"
        style={{ backgroundColor: role.color, color: role.color ? '#fff' : undefined }}
      >
        <Shield className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <HighlightedText text={role.name} term={term} className="truncate text-[13px] font-medium text-[#0f172a]" />
          {role.is_position && (
            <Badge variant="outline" className="h-4 shrink-0 px-1 py-0 text-[9px]">
              {t('mention.position')}
            </Badge>
          )}
        </span>
        <p className="truncate text-[11px] text-[#64748b]">
          {parent ? (
            <span className="inline-flex items-center gap-1">
              <CornerDownRight className="h-3 w-3 shrink-0" />
              {t('mention.dependsOn', { role: parent.name })}
            </span>
          ) : (
            role.description
          )}
          {role.users_count != null && ` · ${t('mention.peopleCount', { count: role.users_count })}`}
        </p>
      </div>
    </InlineComboboxItem>
  );
}

// ─── Breadcrumb del modo explorar ─────────────────────────────────────────────

function FolderBreadcrumb({ trail, onNavigate }: { trail: TrailSegment[]; onNavigate: (index: number) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[#e0e6ee] px-3 py-1.5 text-[11px] text-[#64748b]">
      {trail.map((segment, index) => (
        <React.Fragment key={segment.id ?? 'root'}>
          {index > 0 && <span className="shrink-0 text-[#cbd5e1]">/</span>}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onNavigate(index)}
            className={cn(
              'shrink-0 rounded px-1 hover:cursor-pointer hover:bg-accent',
              index === trail.length - 1 ? 'font-medium text-[#0f172a]' : 'hover:underline'
            )}
          >
            {segment.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Vista de versión ──────────────────────────────────────────────────────────

function VersionHeader({ asset, onBack }: { asset: LibraryContentAsset; onBack: () => void }) {
  const { t } = useTranslation('editor');
  return (
    <div className="flex items-center gap-2 border-b border-[#e0e6ee] px-3 py-2">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onBack}
        aria-label={t('mention.shortcuts.back')}
        className="shrink-0 rounded-md p-0.5 hover:cursor-pointer hover:bg-accent"
      >
        <ChevronRight className="h-4 w-4 rotate-180 text-[#64748b]" />
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-muted" style={{ color: asset.document_type?.color }}>
        <File className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-[#0f172a]">{asset.name}</p>
        <p className="truncate text-[11px] text-[#64748b]">
          {asset.document_type?.name}
          {(asset.folder_path ?? asset.folder_name) && ` · ${asset.folder_path ?? asset.folder_name}`}
        </p>
      </div>
    </div>
  );
}

function VersionBody({
  asset,
  onPick,
}: {
  asset: LibraryContentAsset;
  onPick: (versionMode: 'latest' | 'pinned', execution?: LibraryContentAssetExecution) => void;
}) {
  const { t } = useTranslation('editor');
  const [showAll, setShowAll] = React.useState(false);
  const current = getCurrentExecution(asset);
  const executions = asset.executions ?? [];
  const shown = showAll ? executions : executions.slice(0, VERSIONS_SHOWN_DEFAULT);
  const remaining = getRemainingExecutionCount(asset, shown.length);
  const pending = hasPendingNewerExecution(asset) ? getPendingExecution(asset) : null;

  return (
    <>
      <InlineComboboxGroup>
        <InlineComboboxItem
          id="__follow_latest__"
          value="__follow_latest__"
          label={t('mention.followLatest')}
          onClick={() => onPick('latest')}
          className="h-auto min-h-9.5 items-center justify-between gap-2 rounded-xl py-1.5"
        >
          <div>
            <p className="text-[13px] font-medium text-[#0f172a]">{t('mention.followLatest')}</p>
            <p className="text-[11px] text-[#64748b]">
              {t('mention.followLatestNote', { version: current ? getExecutionCompactLabel(current) : '' })}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">{t('mention.recommended')}</Badge>
        </InlineComboboxItem>
      </InlineComboboxGroup>

      <InlineComboboxGroup>
        <InlineComboboxGroupLabel>
          {t('mention.pinAVersion', { count: asset.execution_count ?? executions.length })}
        </InlineComboboxGroupLabel>
        {shown.map((execution) => {
          const versionNumber = getExecutionVersionNumber(execution);
          return (
            <InlineComboboxItem
              key={execution.id}
              id={execution.id}
              value={execution.id}
              label={getExecutionCompactLabel(execution)}
              onClick={() => onPick('pinned', execution)}
              className="h-auto min-h-9.5 items-center justify-between gap-2 rounded-xl py-1.5"
            >
              {versionNumber ? (
                <span className="flex items-baseline gap-2">
                  <span className="text-[13px] font-medium text-[#0f172a]">v{versionNumber}</span>
                  {execution.version && <span className="text-[12px] text-[#64748b]">{execution.version}</span>}
                </span>
              ) : (
                <span className="text-[13px] font-medium text-[#0f172a]">{execution.version || '—'}</span>
              )}
              {execution.id === asset.current_execution_id && (
                <Badge variant="outline" className="shrink-0 text-[10px]">{t('mention.current')}</Badge>
              )}
              {pending && execution.id === pending.id && execution.id !== asset.current_execution_id && (
                <span className="shrink-0 text-[10px] text-muted-foreground">{t('mention.pendingVersion')}</span>
              )}
            </InlineComboboxItem>
          );
        })}
        {!showAll && remaining > 0 && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShowAll(true)}
            className="mx-1 flex h-6.5 items-center rounded-sm px-3 text-left text-xs text-muted-foreground hover:cursor-pointer hover:bg-accent"
          >
            {t('mention.showMore', { count: remaining })}
          </button>
        )}
      </InlineComboboxGroup>
    </>
  );
}

// ─── Barra de atajos (común a las dos vistas) ─────────────────────────────────

function ShortcutsFooter({
  view,
  canGoUp,
  showingAssets,
}: {
  view: View;
  canGoUp: boolean;
  showingAssets: boolean;
}) {
  const { t } = useTranslation('editor');
  return (
    <div className="flex items-center gap-3 border-t border-[#e0e6ee] px-3 py-1.5 text-[11px] text-[#94a3b8]">
      <span>↑↓ {t('mention.shortcuts.navigate')}</span>
      <span>↵ {view === 'results' && showingAssets ? t('mention.shortcuts.chooseVersion') : t('mention.shortcuts.insert')}</span>
      {view === 'version' ? (
        <span>← {t('mention.shortcuts.back')}</span>
      ) : canGoUp ? (
        <span>← {t('mention.shortcuts.up')}</span>
      ) : null}
      <span>esc {t('mention.shortcuts.close')}</span>
    </div>
  );
}

// ─── Cuerpo (dentro del ComboboxProvider, puede leer el store) ────────────────

function ReferenceComboboxBody({
  organizationId,
  search,
  insertAssetReference,
  insertRoleReference,
}: {
  organizationId: string | undefined;
  search: string;
  insertAssetReference: (asset: LibraryContentAsset, versionMode: 'latest' | 'pinned', execution?: LibraryContentAssetExecution) => void;
  insertRoleReference: (role: Role) => void;
}) {
  const { t } = useTranslation('editor');
  const store = useComboboxContext();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [view, setView] = React.useState<View>('results');
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('asset');
  const [versionAsset, setVersionAsset] = React.useState<LibraryContentAsset | null>(null);
  const [trail, setTrail] = React.useState<TrailSegment[]>(() => [{ id: null, name: t('mention.browseRoot') }]);

  const shorthand = parseVersionShorthand(search);
  const effectiveTerm = shorthand ? shorthand.namePart : search;
  const browsing = effectiveTerm.length === 0;
  const currentFolderId = trail[trail.length - 1]?.id ?? null;

  const showingAssets = typeFilter === 'asset';

  const { assets: searchAssets, roles, canPickRole, assetsLoading: searchLoading, rolesLoading } = useMentionSearch(
    organizationId,
    effectiveTerm,
    !browsing
  );
  const { byId: rolesMap } = useRolesMap(canPickRole);
  const { folders: currentFolders, assets: folderAssets, hasNext: folderHasNext, isLoading: folderLoading } = useMentionFolderContent(
    organizationId,
    currentFolderId,
    showingAssets && browsing
  );

  const showingRoles = typeFilter === 'role' && canPickRole;
  const displayedAssets = browsing ? folderAssets : searchAssets;
  const assetsListLoading = browsing ? folderLoading : searchLoading;
  const activeLoading = showingAssets ? assetsListLoading : (showingRoles && rolesLoading);

  const totalCount = displayedAssets.length + (canPickRole ? roles.length : 0);
  const shownCount = (showingAssets ? displayedAssets.length : 0) + (showingRoles ? roles.length : 0);

  const handleSelectAsset = (asset: LibraryContentAsset) => {
    insertAssetReference(asset, 'latest');
  };

  const handleSelectExecution = (asset: LibraryContentAsset, execution: LibraryContentAssetExecution) => {
    insertAssetReference(asset, 'pinned', execution);
  };

  const handleSelectRole = (role: Role) => {
    insertRoleReference(role);
  };

  const handleDrillIn = (asset: LibraryContentAsset) => {
    setVersionAsset(asset);
    setView('version');
  };

  const handleBack = () => {
    setView('results');
    setVersionAsset(null);
  };

  const handleEnterFolder = (folder: LibraryContentFolder) => {
    setTrail((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateTrail = (index: number) => {
    setTrail((prev) => prev.slice(0, index + 1));
  };

  const handleKeyDownCapture = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && view === 'results' && shorthand) {
      const asset = searchAssets.find((a) => normalizeForCompare(a.name) === normalizeForCompare(shorthand.namePart));
      const execution = asset?.executions?.find(
        (execution) => normalizeForCompare(getExecutionCompactLabel(execution).replace(/^v/i, '')) === normalizeForCompare(shorthand.versionPart)
      );
      if (asset && execution) {
        event.preventDefault();
        event.stopPropagation();
        handleSelectExecution(asset, execution);
        return;
      }
      return;
    }

    const input = inputRef.current;
    if (view === 'results' && event.key === 'ArrowRight') {
      const atEnd = !!input && input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
      if (!atEnd) return;
      const activeId = store?.getState().activeId;
      const activeAsset = displayedAssets.find((asset) => asset.id === activeId);
      if (activeAsset) {
        event.preventDefault();
        event.stopPropagation();
        handleDrillIn(activeAsset);
      }
      return;
    }

    if (view === 'version' && event.key === 'ArrowLeft') {
      const atStart = !!input && input.selectionStart === 0 && input.selectionEnd === 0;
      if (!atStart) return;
      event.preventDefault();
      event.stopPropagation();
      handleBack();
      return;
    }

    if (view === 'results' && event.key === 'ArrowLeft' && showingAssets && browsing && trail.length > 1) {
      const atStart = !!input && input.selectionStart === 0 && input.selectionEnd === 0;
      if (!atStart) return;
      event.preventDefault();
      event.stopPropagation();
      setTrail((prev) => prev.slice(0, -1));
    }
  };

  const emptyMessage = view === 'results' && showingAssets && browsing ? t('mention.emptyFolder') : t('mention.noResults');

  return (
    <div onKeyDownCapture={handleKeyDownCapture}>
      {/* Texto real tecleado — se muestra inline en el documento en el punto del "@" (mismo
          mecanismo que "/"); el popover de abajo es solo el panel de resultados flotante. */}
      <InlineComboboxInput ref={inputRef} placeholder={t('mention.searchPlaceholder')} />

      <InlineComboboxContent className="flex max-h-105 w-110 flex-col overflow-hidden rounded-[10px] border border-[#e0e6ee] p-0 shadow-[0_8px_22px_rgba(15,23,42,0.1)]">
        {view === 'results' ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-[#e0e6ee] px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                {(['asset', 'role'] as const)
                  .filter((key) => key !== 'role' || canPickRole)
                  .map((key) => {
                    const count = key === 'asset' ? displayedAssets.length : roles.length;
                    return (
                      <button
                        key={key}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setTypeFilter(key)}
                        className={cn(
                          'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium hover:cursor-pointer',
                          typeFilter === key ? 'border-[#2563eb] bg-[#eef4ff] text-[#2563eb]' : 'border-[#e0e6ee] text-[#64748b]'
                        )}
                      >
                        {key === 'asset' ? t('mention.filterAssets') : t('mention.filterRoles')}
                        <span className="tabular-nums">{count}</span>
                      </button>
                    );
                  })}
              </div>
              <span className="shrink-0 text-[11px] text-[#94a3b8]">{t('mention.shownOfTotal', { shown: shownCount, total: totalCount })}</span>
            </div>
            {showingAssets && browsing && <FolderBreadcrumb trail={trail} onNavigate={handleNavigateTrail} />}
          </>
        ) : (
          versionAsset && <VersionHeader asset={versionAsset} onBack={handleBack} />
        )}

        <div className="flex-1 overflow-y-auto p-1">
          {/* Montado en las dos vistas: cuando no hay ítems (carpeta vacía, sin resultados)
              sostiene `hasEmpty` para que el popover no se cierre solo. */}
          <InlineComboboxEmpty>
            <div className="flex flex-col items-start gap-1 px-1 py-2">
              <p className="text-xs text-muted-foreground">{emptyMessage}</p>
            </div>
          </InlineComboboxEmpty>

          {view === 'results' ? (
            <>
              {activeLoading && (
                <div className="flex flex-col gap-1 p-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                      <Skeleton className="h-6 w-6 shrink-0 rounded-md" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-2.5 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showingAssets && browsing && currentFolders.length > 0 && (
                <InlineComboboxGroup>
                  <InlineComboboxGroupLabel>{t('mention.groupFolders')}</InlineComboboxGroupLabel>
                  {currentFolders.map((folder) => (
                    <FolderRow key={folder.id} folder={folder} onEnter={handleEnterFolder} />
                  ))}
                </InlineComboboxGroup>
              )}

              {showingAssets && displayedAssets.length > 0 && (
                <InlineComboboxGroup>
                  <InlineComboboxGroupLabel>{t('mention.groupDocuments')}</InlineComboboxGroupLabel>
                  {displayedAssets.map((asset) => (
                    <AssetRow key={asset.id} asset={asset} term={effectiveTerm} onDrillIn={handleDrillIn} />
                  ))}
                </InlineComboboxGroup>
              )}

              {showingAssets && browsing && folderHasNext && (
                <p className="px-3 py-1.5 text-[11px] text-[#94a3b8]">{t('mention.moreItems')}</p>
              )}

              {showingRoles && roles.length > 0 && (
                <InlineComboboxGroup>
                  <InlineComboboxGroupLabel>{t('mention.groupRoles')}</InlineComboboxGroupLabel>
                  {roles.map((role) => (
                    <RoleRow key={role.id} role={role} term={effectiveTerm} rolesMap={rolesMap} onSelect={handleSelectRole} />
                  ))}
                </InlineComboboxGroup>
              )}
            </>
          ) : (
            versionAsset && (
              <VersionBody
                asset={versionAsset}
                onPick={(versionMode, execution) => {
                  if (versionMode === 'latest') handleSelectAsset(versionAsset);
                  else if (execution) handleSelectExecution(versionAsset, execution);
                }}
              />
            )
          )}
        </div>

        <ShortcutsFooter view={view} canGoUp={showingAssets && browsing && trail.length > 1} showingAssets={showingAssets} />
      </InlineComboboxContent>
    </div>
  );
}

// ─── Elemento raíz (registrado como MentionInputPlugin) ───────────────────────

export function ReferenceComboboxInput(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element } = props;
  const organizationId = useEffectiveOrgId();
  // Al reabrir un `@algo` huérfano (click sobre texto plano, ver mention-kit.tsx)
  // el nodo ya trae lo tipeado en `value` — se precarga como búsqueda en vez de
  // arrancar vacío.
  const [search, setSearch] = React.useState(() => element.value || '');

  const insertAssetReference = React.useCallback(
    (asset: LibraryContentAsset, versionMode: 'latest' | 'pinned', execution?: LibraryContentAssetExecution) => {
      const current = getCurrentExecution(asset);
      editor.tf.insertNodes<AssetReferenceElement>({
        type: ASSET_REFERENCE_KEY,
        children: [{ text: '' }],
        assetId: asset.id,
        documentTypeId: asset.document_type?.id ?? null,
        versionMode,
        executionItemId: versionMode === 'pinned' ? execution?.id ?? null : null,
        name: asset.name,
        color: asset.document_type?.color ?? null,
        pinnedVersionLabel: versionMode === 'pinned' && execution ? getExecutionCompactLabel(execution) : null,
        snapshotVersionLabel: versionMode === 'latest' && current ? getExecutionCompactLabel(current) : null,
      });
      editor.tf.move({ unit: 'offset' });
    },
    [editor]
  );

  const insertRoleReference = React.useCallback(
    (role: Role) => {
      editor.tf.insertNodes<RoleReferenceElement>({
        type: ROLE_REFERENCE_KEY,
        children: [{ text: '' }],
        roleId: role.id,
        name: role.name,
        color: role.color ?? null,
      });
      editor.tf.move({ unit: 'offset' });
    },
    [editor]
  );

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="@" filter={false} defaultValue={element.value || ''} value={search} setValue={setSearch}>
        <ReferenceComboboxBody
          organizationId={organizationId}
          search={search}
          insertAssetReference={insertAssetReference}
          insertRoleReference={insertRoleReference}
        />
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
