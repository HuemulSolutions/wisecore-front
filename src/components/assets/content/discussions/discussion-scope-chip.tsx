import { AlertTriangle, BookOpen, FileText } from 'lucide-react';

import { cn } from '@/lib/utils';

export type DiscussionScopeKind = 'section' | 'document' | 'unknown';

const SCOPE_STYLES: Record<DiscussionScopeKind, string> = {
  section: 'bg-[#eff5ff] text-[#1d4ed8]',
  document: 'bg-[#f1f5f9] text-[#334155]',
  unknown: 'bg-[#fef2f2] text-[#b91c1c]',
};

const SCOPE_ICONS = {
  section: FileText,
  document: BookOpen,
  unknown: AlertTriangle,
} as const;

export interface DiscussionScopeChipProps {
  kind: DiscussionScopeKind;
  label: string;
}

/** Chip de alcance del hilo: sección, documento completo o sección desconocida. */
export function DiscussionScopeChip({ kind, label }: DiscussionScopeChipProps) {
  const Icon = SCOPE_ICONS[kind];
  return (
    <span
      title={label}
      className={cn(
        'inline-flex h-[22px] min-w-0 max-w-[260px] items-center gap-1 rounded-[6px] px-2 font-semibold text-[11.5px]',
        SCOPE_STYLES[kind]
      )}
    >
      <Icon className="size-3 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}
