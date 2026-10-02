import * as React from 'react';

import { ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HuemulSegmentedControl } from '@/huemul/components/huemul-segmented-control';
import { cn } from '@/lib/utils';
import type { TDiscussionUser } from '@/components/plate-editor/components/discussion-kit';

import { DiscussionAuthorAvatar } from './discussion-author-avatar';

export type DiscussionStatusFilter = 'open' | 'resolved';

export interface DiscussionAuthorOption {
  user: TDiscussionUser;
  threadCount: number;
}

export interface DiscussionFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: DiscussionStatusFilter;
  onStatusChange: (value: DiscussionStatusFilter) => void;
  openCount: number;
  resolvedCount: number;
  authorOptions: DiscussionAuthorOption[];
  selectedAuthors: Set<string>;
  onToggleAuthor: (userId: string) => void;
}

/** Buscador + segmented Abiertos/Resueltos + popover de autores. */
export function DiscussionFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  openCount,
  resolvedCount,
  authorOptions,
  selectedAuthors,
  onToggleAuthor,
}: DiscussionFiltersBarProps) {
  const { t } = useTranslation('assets');
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const hasAuthorFilter = selectedAuthors.size > 0;

  return (
    <div className="space-y-2.5 px-6 pt-3 pb-3">
      <div className="relative">
        <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-3.5 text-[#94a3b8]" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('content.discussions.searchPlaceholder')}
          aria-label={t('content.discussions.searchPlaceholder')}
          className="h-[34px] w-full rounded-lg border border-[#e2e8f0] bg-white pr-8 pl-9 text-[13px] text-[#334155] outline-none placeholder:text-[#94a3b8] focus-visible:border-[#2563eb] focus-visible:ring-[3px] focus-visible:ring-[#dbeafe]"
        />
        {search && (
          <button
            type="button"
            title={t('content.discussions.clearSearch')}
            aria-label={t('content.discussions.clearSearch')}
            onClick={() => onSearchChange('')}
            className="-translate-y-1/2 absolute top-1/2 right-2.5 text-[#94a3b8] hover:text-[#475569]"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <HuemulSegmentedControl
          value={status}
          onChange={onStatusChange}
          ariaLabel={t('content.discussions.title')}
          className="flex-1 bg-[#f1f5f9]"
          options={[
            { value: 'open', label: t('content.discussions.statusOpen'), count: openCount },
            { value: 'resolved', label: t('content.discussions.statusResolved'), count: resolvedCount },
          ]}
        />

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 font-medium text-[12.5px] transition-colors hover:cursor-pointer',
                hasAuthorFilter
                  ? 'border-[#bfdbfe] bg-[#eff5ff] text-[#1d4ed8]'
                  : 'border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]'
              )}
            >
              {t('content.discussions.authors')}
              {hasAuthorFilter && <span>· {selectedAuthors.size}</span>}
              <ChevronDown className="size-3 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 rounded-[10px] border-[#e2e8f0] p-2 shadow-[0_12px_28px_-8px_rgba(15,23,42,0.22)]"
          >
            {authorOptions.length === 0 ? (
              <p className="px-2 py-2 text-[#64748b] text-[12.5px]">
                {t('content.discussions.authorFilterAll')}
              </p>
            ) : (
              <div className="max-h-64 space-y-0.5 overflow-y-auto">
                {authorOptions.map(({ user, threadCount }) => (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#f8fafc]"
                  >
                    <Checkbox
                      checked={selectedAuthors.has(user.id)}
                      onCheckedChange={() => onToggleAuthor(user.id)}
                    />
                    <DiscussionAuthorAvatar user={user} size={22} />
                    <span className="min-w-0 flex-1 truncate text-[#334155] text-[13px]" title={user.name}>
                      {user.name}
                    </span>
                    <span className="shrink-0 text-[#94a3b8] text-[12px]">{threadCount}</span>
                  </label>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
