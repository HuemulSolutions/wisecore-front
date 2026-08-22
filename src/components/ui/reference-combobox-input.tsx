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
  Check,
  AlertTriangle,
  RotateCcw,
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
import { assetRowSwatch, roleRowSwatch } from '@/lib/reference-colors';
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

/** Clases compartidas por toda fila del panel — selección vía `data-active-item`
 * (lo setea Ariakit) y `group` para que hijos (badge, subtítulo) reaccionen con
 * `group-data-[active-item=true]:` sin tener que leer `activeId` en JS. */
const ROW_CLASS =
  'group h-auto min-h-9.5 items-center justify-between gap-[9px] rounded-[8px] px-2 py-[9px] hover:bg-[#f1f5f9] data-[active-item=true]:bg-[#eef4ff] data-[active-item=true]:shadow-[inset_2.5px_0_0_#2563eb]';
const SECTION_LABEL_CLASS =
  'mt-0 mb-0 px-[6px] pt-0 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#a3adba]';
// Cada sección (Carpetas / Activos / Roles) es su propia tarjeta — no solo un
// título gris — para que se lea como bloques separados en vez de una lista
// continua, sobre todo cuando conviven 2-3 secciones al abrir "@" sin término.
const GROUP_CLASS = 'rounded-[8px] border border-[#eef1f5] bg-[#fbfcfd] p-1.5 not-last:mb-1.5';
const SUBTITLE_CLASS = 'truncate text-[11px] text-[#94a3b8] group-data-[active-item=true]:text-[#6b8fd6]';

/** `nombre@1.0.7` — atajo tipiado que fija una versión sin pasar por la vista de versión. */
function parseVersionShorthand(search: string): { namePart: string; versionPart: string } | null {
  const match = /^(.+)@([\w.]+)$/.exec(search);
  if (!match) return null;
  return { namePart: match[1].trim(), versionPart: match[2].trim().replace(/^v/i, '') };
}

function normalizeForCompare(s: string): string {
  return s.trim().toLowerCase();
}

// ─── Piezas chicas reutilizadas ────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[3px] bg-[#eef1f5] px-1 py-px font-mono">{children}</span>;
}

/** Punto de color antes del título de cada sección — refuerza qué tipo es cada
 * tarjeta (mismo color que usan los swatches de fila, ver reference-colors.ts)
 * además del borde/fondo propio de `GROUP_CLASS`. */
function SectionLabel({ children, dotColor }: { children: React.ReactNode; dotColor: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
      {children}
    </span>
  );
}

function VersionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-[4px] bg-[#eef1f5] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-[#475569] group-data-[active-item=true]:bg-[#dbe7fe] group-data-[active-item=true]:text-[#1d4ed8]">
      {children}
    </span>
  );
}

function FilterChip({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-6 items-center gap-1 rounded-full border px-[9px] text-[11.5px] font-medium hover:cursor-pointer',
        active
          ? 'border-transparent bg-[#2563eb] font-semibold text-white'
          : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f4f6f9] hover:text-[#0f172a]'
      )}
    >
      {label}
      <span className={cn('tabular-nums', active ? 'text-white/80' : 'text-[#a3adba]')}>{count}</span>
    </button>
  );
}

/** Cola que liga el panel al caret — sigue `currentPlacement` del store del combobox
 * (el mismo store de Popover: Ariakit corre el posicionamiento de floating-ui
 * dentro de `useComboboxPopover` aunque nunca se renderice un `<Popover>` propio)
 * para invertirse cuando el panel se abre hacia arriba. Diamante CSS simple en vez
 * del `PopoverArrow` de Ariakit: ese componente dibuja un SVG que imita el borde
 * calculado del popover, muy distinto del cuadrado rotado que pide el diseño 6c. */
function PanelArrow() {
  const store = useComboboxContext();
  const placement = store?.useState('currentPlacement') ?? 'bottom';
  const isTop = placement.startsWith('top');
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute left-1/2 z-10 size-3 -translate-x-1/2 rotate-45 bg-white',
        isTop ? '-bottom-1.5 border-r border-b border-[#b8c4d4]' : '-top-1.5 border-l border-t border-[#b8c4d4]'
      )}
    />
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-1 p-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex min-h-9.5 items-center gap-[9px] px-2 py-[9px]">
          <Skeleton className="size-6 shrink-0 rounded-[6px]" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Filas ────────────────────────────────────────────────────────────────────

function AssetRow({
  asset,
  term,
  showPath = true,
  onDrillIn,
}: {
  asset: LibraryContentAsset;
  term: string;
  showPath?: boolean;
  onDrillIn: (asset: LibraryContentAsset) => void;
}) {
  const current = getCurrentExecution(asset);
  const swatch = assetRowSwatch(asset.document_type?.color);

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
      className={ROW_CLASS}
    >
      <div className="flex min-w-0 flex-1 items-center gap-[9px]">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px]" style={{ backgroundColor: swatch.background, color: swatch.color }}>
          <File className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <HighlightedText text={asset.name} term={term} className="block truncate text-[13px] font-medium text-[#0f172a]" />
          <p className={SUBTITLE_CLASS}>
            {asset.document_type?.name}
            {showPath && (asset.folder_path ?? asset.folder_name) && <span> · {asset.folder_path ?? asset.folder_name}</span>}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {current && <VersionBadge>{getExecutionCompactLabel(current)}</VersionBadge>}
        <ChevronRight className="h-4 w-4 shrink-0 text-[#94a3b8] group-data-[active-item=true]:text-[#2563eb]" />
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
      className={ROW_CLASS}
    >
      <div className="flex min-w-0 flex-1 items-center gap-[9px]">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-[#eef1f5] text-[#64748b]">
          <Folder className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-[13px] font-medium text-[#0f172a]">{folder.name}</span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#94a3b8] group-data-[active-item=true]:text-[#2563eb]" />
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
  const swatch = roleRowSwatch(role.color);

  return (
    <InlineComboboxItem id={role.id} value={role.id} label={role.name} onClick={() => onSelect(role)} className={ROW_CLASS}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: swatch.background, color: swatch.color }}>
        <Shield className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <HighlightedText text={role.name} term={term} className="truncate text-[13px] font-medium text-[#0f172a]" />
          {role.is_position && (
            <span className="shrink-0 rounded-[4px] bg-[#eef1f5] px-1.5 py-0.5 text-[9px] font-semibold text-[#475569] group-data-[active-item=true]:bg-[#dbe7fe] group-data-[active-item=true]:text-[#1d4ed8]">
              {t('mention.position')}
            </span>
          )}
        </span>
        <p className={SUBTITLE_CLASS}>
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

function FolderBreadcrumb({
  trail,
  countsLabel,
  onNavigate,
}: {
  trail: TrailSegment[];
  countsLabel?: string;
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#eef1f5] px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto text-[11px]">
        {trail.map((segment, index) => (
          <React.Fragment key={segment.id ?? 'root'}>
            {index > 0 && <span className="shrink-0 text-[#cbd5e1]">›</span>}
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onNavigate(index)}
              className={cn(
                'shrink-0 rounded px-1 hover:cursor-pointer hover:bg-[#f1f5f9]',
                index === trail.length - 1 ? 'font-semibold text-[#0f172a]' : 'text-[#64748b] hover:underline'
              )}
            >
              {segment.name}
            </button>
          </React.Fragment>
        ))}
      </div>
      {countsLabel && <span className="shrink-0 text-[10.5px] text-[#94a3b8]">{countsLabel}</span>}
    </div>
  );
}

// ─── Cabecera del panel (estado del propio menú) ──────────────────────────────

function PanelHeader({ term, browsing, countLabel }: { term: string; browsing: boolean; countLabel?: string }) {
  const { t } = useTranslation('editor');
  return (
    <div className="flex items-center gap-2 border-b border-[#e6ebf1] bg-[#f8fafc] px-[11px] pt-[10px] pb-[9px]">
      <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[#0f172a] text-[12px] font-semibold text-white">
        @
      </span>
      <span className="flex min-w-0 flex-1 items-center overflow-hidden">
        {browsing ? (
          <span className="truncate text-[13px] text-[#94a3b8]">{t('mention.browsePlaceholder')}</span>
        ) : (
          <span className="truncate text-[13px] text-[#0f172a]">{term}</span>
        )}
        <span className="ml-px h-[14px] w-[1.5px] shrink-0 bg-[#2563eb]" />
      </span>
      {countLabel && <span className="shrink-0 text-[10.5px] text-[#94a3b8]">{countLabel}</span>}
    </div>
  );
}

// ─── Vista de versión ──────────────────────────────────────────────────────────

function VersionHeader({ asset, onBack }: { asset: LibraryContentAsset; onBack: () => void }) {
  const { t } = useTranslation('editor');
  const swatch = assetRowSwatch(asset.document_type?.color);
  return (
    <div className="flex items-center gap-2 border-b border-[#eef1f5] px-3 py-2">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onBack}
        aria-label={t('mention.shortcuts.back')}
        className="shrink-0 rounded-md p-0.5 hover:cursor-pointer hover:bg-[#f1f5f9]"
      >
        <ChevronRight className="h-4 w-4 rotate-180 text-[#64748b]" />
      </button>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px]" style={{ backgroundColor: swatch.background, color: swatch.color }}>
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
      <InlineComboboxGroup className={GROUP_CLASS}>
        <InlineComboboxItem
          id="__follow_latest__"
          value="__follow_latest__"
          label={t('mention.followLatest')}
          onClick={() => onPick('latest')}
          className={cn(ROW_CLASS, 'bg-[#eef4ff] shadow-[inset_2.5px_0_0_#2563eb]')}
        >
          <div className="flex min-w-0 flex-1 items-center gap-[9px]">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white">
              <Check className="h-2.5 w-2.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[#0f172a]">{t('mention.followLatest')}</p>
              <p className="truncate text-[11px] text-[#64748b]">
                {t('mention.followLatestNote', { version: current ? getExecutionCompactLabel(current) : '' })}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-[4px] bg-[#dbe7fe] px-1.5 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">
            {t('mention.recommended')}
          </span>
        </InlineComboboxItem>
      </InlineComboboxGroup>

      <InlineComboboxGroup className={GROUP_CLASS}>
        <InlineComboboxGroupLabel className={SECTION_LABEL_CLASS}>
          {t('mention.pinAVersion', { count: asset.execution_count ?? executions.length })}
        </InlineComboboxGroupLabel>
        {shown.map((execution) => {
          const versionNumber = getExecutionVersionNumber(execution);
          const isCurrent = execution.id === asset.current_execution_id;
          return (
            <InlineComboboxItem
              key={execution.id}
              id={execution.id}
              value={execution.id}
              label={getExecutionCompactLabel(execution)}
              onClick={() => onPick('pinned', execution)}
              className={ROW_CLASS}
            >
              <div className="flex min-w-0 flex-1 items-center gap-[9px]">
                <span className="size-4 shrink-0 rounded-full border-[1.5px] border-[#dbe1e9]" />
                {versionNumber ? (
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[13px] font-semibold text-[#0f172a]">v{versionNumber}</span>
                    {execution.version && <span className="text-[11.5px] text-[#64748b]">{execution.version}</span>}
                  </span>
                ) : (
                  <span className="text-[13px] font-medium text-[#0f172a]">{execution.version || '—'}</span>
                )}
              </div>
              {isCurrent && (
                <span className="shrink-0 rounded-[4px] bg-[#eef1f5] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#475569]">
                  {t('mention.current')}
                </span>
              )}
              {pending && execution.id === pending.id && !isCurrent && (
                <span className="shrink-0 text-[10px] text-[#94a3b8]">{t('mention.pendingVersion')}</span>
              )}
            </InlineComboboxItem>
          );
        })}
        {!showAll && remaining > 0 && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShowAll(true)}
            className="mx-1 flex h-6.5 items-center rounded-sm px-3 text-left text-xs text-[#94a3b8] hover:cursor-pointer hover:bg-[#f1f5f9]"
          >
            {t('mention.showMore', { count: remaining })}
          </button>
        )}
      </InlineComboboxGroup>
    </>
  );
}

// ─── Pie de atajos (común a las tres vistas) ──────────────────────────────────

function ShortcutsFooter({
  mode,
  activeIsRole,
  canGoUp,
  shorthandHint,
}: {
  mode: 'results' | 'browse' | 'version';
  activeIsRole?: boolean;
  canGoUp?: boolean;
  shorthandHint?: string;
}) {
  const { t } = useTranslation('editor');
  return (
    <div className="flex items-center justify-between border-t border-[#eef1f5] bg-[#f8fafc] px-[11px] py-[7px] text-[10.5px] text-[#94a3b8]">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Kbd>↑↓</Kbd>
          {t('mention.shortcuts.navigate')}
        </span>
        {mode === 'browse' ? (
          <>
            <span className="flex items-center gap-1">
              <Kbd>→</Kbd>
              {t('mention.shortcuts.enter')}
            </span>
            {canGoUp && (
              <span className="flex items-center gap-1">
                <Kbd>←</Kbd>
                {t('mention.shortcuts.up')}
              </span>
            )}
          </>
        ) : mode === 'version' ? (
          <>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd>
              {t('mention.shortcuts.insert')}
            </span>
            <span className="flex items-center gap-1">
              <Kbd>←</Kbd>
              {t('mention.shortcuts.back')}
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd>
            {activeIsRole ? t('mention.shortcuts.insert') : t('mention.shortcuts.chooseVersion')}
          </span>
        )}
      </div>
      <span className="flex items-center gap-1">
        {mode === 'version' && shorthandHint && <span className="font-mono text-[#94a3b8]">{shorthandHint}</span>}
        <Kbd>esc</Kbd>
        {t('mention.shortcuts.close')}
      </span>
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
  // Pestañas excluyentes (no toggles independientes) — Activos por defecto.
  const [activeFilter, setActiveFilter] = React.useState<TypeFilter>('asset');
  const [versionAsset, setVersionAsset] = React.useState<LibraryContentAsset | null>(null);
  const [trail, setTrail] = React.useState<TrailSegment[]>(() => [{ id: null, name: t('mention.browseRoot') }]);

  const shorthand = parseVersionShorthand(search);
  const effectiveTerm = shorthand ? shorthand.namePart : search;
  const browsing = effectiveTerm.length === 0;
  const currentFolderId = trail[trail.length - 1]?.id ?? null;

  const {
    assets: searchAssets,
    roles,
    canPickAssets,
    canPickRole,
    assetsLoading: searchLoading,
    rolesLoading,
    assetsHasNext,
    rolesHasNext,
    assetsIsError,
    rolesIsError,
    refetchAssets,
    refetchRoles,
  } = useMentionSearch(organizationId, effectiveTerm, !browsing);
  const { byId: rolesMap } = useRolesMap(canPickRole);

  // Pestañas excluyentes: exactamente un tipo visible. Cada uno además depende
  // de su propio permiso RBAC (mismo criterio que ya regía Roles) — si falta
  // `canPickAssets` la pestaña "Activos" ni se muestra (ver abajo), así que la
  // selección cae a Roles en vez de quedar en un estado vacío sin salida.
  const showingAssets = activeFilter === 'asset' && canPickAssets;
  const showingRoles = (activeFilter === 'role' || !canPickAssets) && canPickRole;
  const showingFolderBrowse = showingAssets && browsing;

  const {
    folders: currentFolders,
    assets: folderAssets,
    hasNext: folderHasNext,
    isLoading: folderLoading,
    isError: folderIsError,
    refetch: folderRefetch,
  } = useMentionFolderContent(organizationId, currentFolderId, showingFolderBrowse);

  const displayedAssets = browsing ? folderAssets : searchAssets;
  const assetsListLoading = browsing ? folderLoading : searchLoading;
  const activeLoading = (showingAssets && assetsListLoading) || (showingRoles && rolesLoading);
  // Roles se piden siempre desde `useMentionSearch`, incluso en modo "explorar
  // carpetas" (los roles no tienen carpeta) — su error cuenta sin importar `browsing`.
  const isError = (showingAssets && (browsing ? folderIsError : assetsIsError)) || (showingRoles && rolesIsError);

  const activeId = store?.useState('activeId');
  const activeIsRole = showingRoles && roles.some((role) => role.id === activeId);

  const shownAssetsCount = showingAssets ? displayedAssets.length : 0;
  const shownRolesCount = showingRoles ? roles.length : 0;
  const shownCount = shownAssetsCount + shownRolesCount;
  const assetsMore = showingAssets && (browsing ? folderHasNext : assetsHasNext);
  const rolesMore = showingRoles && rolesHasNext;
  const headerCountLabel = showingFolderBrowse
    ? undefined
    : assetsMore || rolesMore
      ? t('mention.resultsCountMore', { count: shownCount })
      : t('mention.resultsCount', { count: shownCount });
  const folderCountsLabel = showingFolderBrowse
    ? t('mention.folderCounts', {
        folders: `${currentFolders.length}${folderHasNext ? '+' : ''}`,
        assets: `${folderAssets.length}${folderHasNext ? '+' : ''}`,
      })
    : undefined;


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

  const handleSearchAll = () => {
    setTrail((prev) => (prev.length > 1 ? [prev[0]] : prev));
  };

  const handleRetry = () => {
    if (showingAssets) void (browsing ? folderRefetch() : refetchAssets());
    if (showingRoles) void refetchRoles();
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
      const activeItemId = store?.getState().activeId;
      if (showingFolderBrowse) {
        const activeFolder = currentFolders.find((folder) => `folder-${folder.id}` === activeItemId);
        if (activeFolder) {
          event.preventDefault();
          event.stopPropagation();
          handleEnterFolder(activeFolder);
          return;
        }
      }
      const activeAsset = displayedAssets.find((asset) => asset.id === activeItemId);
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

    if (view === 'results' && event.key === 'ArrowLeft' && showingFolderBrowse && trail.length > 1) {
      const atStart = !!input && input.selectionStart === 0 && input.selectionEnd === 0;
      if (!atStart) return;
      event.preventDefault();
      event.stopPropagation();
      setTrail((prev) => prev.slice(0, -1));
    }
  };

  const emptyMessage = browsing
    ? showingAssets
      ? t('mention.emptyFolder')
      : t('mention.noResults')
    : t('mention.noResultsFor', { term: effectiveTerm });

  const versionShorthandHint = versionAsset
    ? `@${versionAsset.name}@${getExecutionVersionNumber(getCurrentExecution(versionAsset)) ?? ''}`
    : undefined;

  return (
    <div onKeyDownCapture={handleKeyDownCapture} className="relative">
      {/* Texto real tecleado — se muestra inline en el documento en el punto del "@" (mismo
          mecanismo que "/"); el popover de abajo es solo el panel de resultados flotante. */}
      <InlineComboboxInput ref={inputRef} placeholder={t('mention.searchPlaceholder')} />

      <InlineComboboxContent
        // El `InlineComboboxContent` base (inline-combobox.tsx) trae su propio
        // `max-h-72` (288px) — sin un `max-h-*` propio acá, ese default sobrevive
        // el merge de tailwind-merge y el `flex-1` de la lista interna (más abajo,
        // `max-h-105`) nunca llega a usarse: no le queda espacio disponible.
        // `fitViewport` hace que, además, todo el panel se achique solo si no
        // entra en la pantalla, en vez de recortarse contra el borde.
        className="flex max-h-140 w-110 flex-col overflow-hidden rounded-[12px] border border-[#b8c4d4] bg-white p-0 shadow-[0_0_0_4px_rgba(37,99,235,0.12),0_22px_48px_-14px_rgba(15,23,42,0.4)]"
        gutter={10}
        fitViewport
      >
        <PanelArrow />

        {view === 'results' ? (
          <>
            <PanelHeader term={search} browsing={browsing} countLabel={headerCountLabel} />

            <div className="flex items-center gap-1.5 px-[10px] py-1">
              {canPickAssets && (
                <FilterChip active={showingAssets} count={displayedAssets.length} label={t('mention.filterAssets')} onClick={() => setActiveFilter('asset')} />
              )}
              {canPickRole && (
                <FilterChip active={showingRoles} count={roles.length} label={t('mention.filterRoles')} onClick={() => setActiveFilter('role')} />
              )}
            </div>

            {showingFolderBrowse && <FolderBreadcrumb trail={trail} countsLabel={folderCountsLabel} onNavigate={handleNavigateTrail} />}
          </>
        ) : (
          versionAsset && <VersionHeader asset={versionAsset} onBack={handleBack} />
        )}

        <div className="max-h-105 flex-1 overflow-y-auto p-1">
          {/* Montado en las tres vistas: cuando no hay ítems (carpeta vacía, sin resultados,
              error) sostiene `hasEmpty` para que el popover no se cierre solo. */}
          <InlineComboboxEmpty>
            {isError ? (
              <div className="flex flex-col items-start gap-1.5 px-2 py-3">
                <p className="flex items-center gap-1.5 text-xs text-[#b91c1c]">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {t('mention.searchError')}
                </p>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleRetry}
                  className="flex items-center gap-1 rounded-md px-1 text-xs font-medium text-[#2563eb] hover:cursor-pointer hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t('mention.retry')}
                </button>
              </div>
            ) : activeLoading ? null : (
              <div className="flex flex-col items-start gap-1 px-1 py-2">
                <p className="text-xs text-muted-foreground">{emptyMessage}</p>
                {!browsing && showingAssets && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleSearchAll}
                    className="rounded-md px-1 text-xs font-medium text-[#2563eb] hover:cursor-pointer hover:underline"
                  >
                    {t('mention.searchAllAssets')}
                  </button>
                )}
              </div>
            )}
          </InlineComboboxEmpty>

          {view === 'results' ? (
            <>
              {activeLoading && <SkeletonRows />}

              {showingFolderBrowse && currentFolders.length > 0 && (
                <InlineComboboxGroup className={GROUP_CLASS}>
                  <InlineComboboxGroupLabel className={SECTION_LABEL_CLASS}>
                    <SectionLabel dotColor="#94a3b8">{t('mention.groupFolders')}</SectionLabel>
                  </InlineComboboxGroupLabel>
                  {currentFolders.map((folder) => (
                    <FolderRow key={folder.id} folder={folder} onEnter={handleEnterFolder} />
                  ))}
                </InlineComboboxGroup>
              )}

              {showingAssets && displayedAssets.length > 0 && (
                <InlineComboboxGroup className={GROUP_CLASS}>
                  <InlineComboboxGroupLabel className={SECTION_LABEL_CLASS}>
                    <SectionLabel dotColor="#1d4ed8">
                      {showingFolderBrowse ? t('mention.groupAssetsInFolder') : t('mention.groupDocuments')}
                    </SectionLabel>
                  </InlineComboboxGroupLabel>
                  {displayedAssets.map((asset) => (
                    <AssetRow key={asset.id} asset={asset} term={effectiveTerm} showPath={!showingFolderBrowse} onDrillIn={handleDrillIn} />
                  ))}
                </InlineComboboxGroup>
              )}

              {showingFolderBrowse && folderHasNext && (
                <p className="px-3 py-1.5 text-[11px] text-[#94a3b8]">{t('mention.moreItems')}</p>
              )}

              {showingRoles && roles.length > 0 && (
                <InlineComboboxGroup className={GROUP_CLASS}>
                  <InlineComboboxGroupLabel className={SECTION_LABEL_CLASS}>
                    <SectionLabel dotColor="#6d28d9">{t('mention.groupRoles')}</SectionLabel>
                  </InlineComboboxGroupLabel>
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

        <ShortcutsFooter
          mode={view === 'version' ? 'version' : showingFolderBrowse ? 'browse' : 'results'}
          activeIsRole={activeIsRole}
          canGoUp={showingFolderBrowse && trail.length > 1}
          shorthandHint={versionShorthandHint}
        />
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
    <PlateElement
      {...props}
      as="span"
      className="rounded-[3px] bg-[#fff5d6] px-[3px] py-px font-semibold text-[#92400e] shadow-[0_0_0_1.5px_#f3d68a]"
    >
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
