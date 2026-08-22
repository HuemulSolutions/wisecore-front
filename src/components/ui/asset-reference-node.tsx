'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useFocused, useSelected } from 'platejs/react';
import { File, ExternalLink, RefreshCw, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useEffectiveOrgId, useOrgPath } from '@/hooks/useOrgRouter';
import { useResolvedAssetReference } from '@/contexts/mention-refs-context';
import { getCurrentExecution } from '@/lib/library-executions';
import { getExecutionCompactLabel } from '@/components/assets/content/utils/version-utils';
import { assetChipPalette } from '@/lib/reference-colors';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AssetReferenceElement as AssetReferenceElementType } from '@/types/reference';

export function AssetReferenceNode(props: PlateElementProps<AssetReferenceElementType>) {
  const { element, editor } = props;
  const selected = useSelected();
  const focused = useFocused();
  const { t } = useTranslation('editor');
  const buildPath = useOrgPath();
  const effectiveOrgId = useEffectiveOrgId();
  const resolved = useResolvedAssetReference(element);
  const [versionPickerOpen, setVersionPickerOpen] = React.useState(false);

  const handleOpen = () => {
    if (resolved.isMissing || effectiveOrgId === '_') return;
    const query = element.versionMode === 'pinned' && element.executionItemId
      ? `?execution=${encodeURIComponent(element.executionItemId)}`
      : '';
    window.open(buildPath(`/asset/${element.assetId}${query}`), '_blank', 'noopener,noreferrer');
  };

  const handleRemove = () => {
    const path = editor.api.findPath(element);
    if (path) editor.tf.removeNodes({ at: path });
  };

  const setVersion = (versionMode: 'latest' | 'pinned', executionItemId?: string, pinnedVersionLabel?: string) => {
    const path = editor.api.findPath(element);
    if (!path) return;
    editor.tf.setNodes(
      { versionMode, executionItemId: executionItemId ?? null, pinnedVersionLabel: pinnedVersionLabel ?? null },
      { at: path }
    );
    setVersionPickerOpen(false);
  };

  const asset = resolved.asset;
  const currentExecution = asset ? getCurrentExecution(asset) : null;
  const palette = assetChipPalette(resolved.color);
  // "última" fijo mientras `versionMode: 'latest'` — el número real que resuelve hoy
  // queda para el hover card (`hoverCard.followsLatest`), no para la chip en sí.
  const versionBadgeLabel = element.versionMode === 'latest' ? t('mention.latestBadge') : resolved.displayVersionLabel;

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-flex items-center gap-1 rounded-[5px] border px-1.5 py-0.5 align-baseline font-medium text-sm',
        !resolved.isMissing && 'cursor-pointer',
        resolved.isMissing && 'opacity-50 line-through decoration-1',
        selected && focused && 'ring-2 ring-ring'
      )}
      style={{ backgroundColor: palette.background, borderColor: palette.border, color: palette.color }}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        draggable: true,
      }}
    >
      <HoverCard>
        <HoverCardTrigger asChild>
          <span
            className="inline-flex items-center gap-1"
            onMouseDown={(event) => { if (event.button === 0) handleOpen(); }}
          >
            <File className="h-3 w-3 shrink-0" />
            <span className="truncate">{resolved.name}</span>
            {versionBadgeLabel && (
              <span className="font-mono text-xs opacity-80">{versionBadgeLabel}</span>
            )}
            {resolved.isStale && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
          </span>
        </HoverCardTrigger>

        <HoverCardContent className="w-80">
          {resolved.isMissing ? (
            <p className="text-sm text-muted-foreground">{t('mention.missingAsset')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{resolved.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {resolved.documentTypeName}
                  {resolved.folderLabel ? ` · ${resolved.folderLabel}` : ''}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                {element.versionMode === 'pinned'
                  ? t('mention.hoverCard.pinnedTo', { version: resolved.displayVersionLabel ?? '' })
                  : t('mention.hoverCard.followsLatest', { version: resolved.displayVersionLabel ?? '' })}
              </p>

              {resolved.isStale && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-[#fde68a] bg-[#fffbeb] p-2 text-xs text-amber-900">
                  <span>
                    {t('mention.hoverCard.staleWarning', {
                      pinned: resolved.displayVersionLabel,
                      latest: resolved.latestVersionLabel,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVersion('latest')}
                    className="shrink-0 font-medium text-[#92400e] underline hover:cursor-pointer"
                  >
                    {t('mention.updateToLatest')}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1 pt-1">
                <HuemulButton variant="outline" size="sm" onClick={handleOpen}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  {t('mention.hoverCard.open')}
                </HuemulButton>

                <Popover open={versionPickerOpen} onOpenChange={setVersionPickerOpen}>
                  <PopoverTrigger asChild>
                    <HuemulButton variant="outline" size="sm" disabled={!asset}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      {t('mention.hoverCard.changeVersion')}
                    </HuemulButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-1" align="start">
                    {asset && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => setVersion('latest')}
                          className={cn(
                            'flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:cursor-pointer hover:bg-accent',
                            element.versionMode === 'latest' && 'bg-accent'
                          )}
                        >
                          {t('mention.followLatest')}
                          {element.versionMode === 'latest' && <Check className="h-3.5 w-3.5" />}
                        </button>
                        {(asset.executions ?? []).map((execution) => (
                          <button
                            key={execution.id}
                            type="button"
                            onClick={() => setVersion('pinned', execution.id, getExecutionCompactLabel(execution))}
                            className={cn(
                              'flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:cursor-pointer hover:bg-accent',
                              element.executionItemId === execution.id && 'bg-accent'
                            )}
                          >
                            <span>{getExecutionCompactLabel(execution)}</span>
                            {currentExecution?.id === execution.id && (
                              <span className="text-[10px] text-muted-foreground">{t('mention.current')}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                <HuemulButton
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemove}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  {t('mention.hoverCard.remove')}
                </HuemulButton>
              </div>
            </div>
          )}
        </HoverCardContent>
      </HoverCard>

      {props.children}
    </PlateElement>
  );
}
