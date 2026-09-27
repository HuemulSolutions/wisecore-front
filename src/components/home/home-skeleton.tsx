import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { HomeLayoutVariant } from '@/hooks/useHomeLayoutHint';
import { HOME_CARD, HOME_CARD_HEADER, HOME_CARD_MUTED } from './home-surface';

const bar = 'h-2.5 rounded-full';

function WorkGroupSkeleton({ rows }: { rows: number }) {
  return (
    <div className={HOME_CARD}>
      <div className={HOME_CARD_HEADER}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className={cn(bar, 'w-32')} />
        </div>
        <Skeleton className={cn(bar, 'w-24')} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 border-b border-divider px-[15px] py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className={cn(bar, 'w-[38%]')} />
            <Skeleton className={cn(bar, 'w-[60%]')} />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
      <div className="px-[15px] py-3">
        <Skeleton className={cn(bar, 'w-40')} />
      </div>
    </div>
  );
}

function RailCardSkeleton({ rows, twoLines }: { rows: number; twoLines?: boolean }) {
  return (
    <div className={HOME_CARD_MUTED}>
      <div className={HOME_CARD_HEADER}>
        <Skeleton className={cn(bar, 'w-32')} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 border-b border-divider px-4 py-2.5 last:border-b-0">
          {twoLines ? (
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className={cn(bar, 'w-[40%]')} />
              <Skeleton className={cn(bar, 'w-[65%]')} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className={cn(bar, 'w-28')} />
              </div>
              <Skeleton className={cn(bar, 'w-6')} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function NormalBody() {
  return (
    <div className="flex h-full min-h-0 gap-5 p-4 md:p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <div className="flex gap-6 border-b border-border pb-2.5">
          <Skeleton className={cn(bar, 'w-20')} />
          <Skeleton className={cn(bar, 'w-28')} />
          <Skeleton className={cn(bar, 'w-32')} />
        </div>
        <WorkGroupSkeleton rows={2} />
        <WorkGroupSkeleton rows={2} />
        <div className={cn(HOME_CARD, 'px-4 py-3')}>
          <Skeleton className={cn(bar, 'w-56')} />
        </div>
      </div>
      <div className="flex w-[306px] shrink-0 flex-col gap-3">
        <RailCardSkeleton rows={3} twoLines />
        <RailCardSkeleton rows={6} />
      </div>
    </div>
  );
}

function FirstTimeBody() {
  return (
    <div className="flex flex-col gap-3.5 p-4 md:p-6">
      <div className={HOME_CARD}>
        <div className={HOME_CARD_HEADER}>
          <Skeleton className={cn(bar, 'w-32')} />
          <Skeleton className={cn(bar, 'w-28')} />
        </div>
        <Skeleton className="h-1 w-1/5 rounded-none" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-divider px-4 py-3.5 last:border-b-0">
            <Skeleton className="h-[22px] w-[22px] shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className={cn(bar, 'w-[30%]')} />
              <Skeleton className={cn(bar, 'w-[45%]')} />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
        <Skeleton className={cn(bar, 'w-44')} />
        <Skeleton className={cn(bar, 'w-[55%]')} />
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[52px] rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Silueta de Home que replica la geometría real de cada diseño (header blanco
 * + tabs/cards/rail, o header + checklist de primera vez). `home.tsx` la usa
 * como único gate mientras permisos + organización + checklist + "Mi trabajo" +
 * estadísticas resuelven; como aún no se sabe qué diseño tocará, `variant` es
 * un pronóstico (última variante pintada para la org, ver `useHomeLayoutHint`).
 */
export function HomeSkeleton({ variant = 'normal' }: { variant?: HomeLayoutVariant }) {
  const firstTime = variant === 'firstTime';
  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-sunken">
      <div className="flex shrink-0 flex-col gap-2 border-b bg-background px-4 pb-4 pt-5 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-[220px] rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            {!firstTime && (
              <>
                <Skeleton className="h-9 w-[120px] rounded-md" />
                <Skeleton className="h-9 w-[130px] rounded-md" />
              </>
            )}
          </div>
        </div>
        <Skeleton className={cn('h-3.5 max-w-full rounded-full', firstTime ? 'w-[520px]' : 'w-[340px]')} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{firstTime ? <FirstTimeBody /> : <NormalBody />}</div>
    </div>
  );
}
