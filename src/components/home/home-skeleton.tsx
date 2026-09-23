import { Skeleton } from '@/components/ui/skeleton';
import { HOME_CARD } from './home-surface';

const CARD_BAR_WIDTHS = [
  ['w-[40%]', 'w-[78%]', 'w-[60%]'],
  ['w-[40%]', 'w-[78%]'],
  ['w-[40%]', 'w-[60%]'],
];

/**
 * Silueta neutra de Home, para no anticipar ningún diseño (primera vez /
 * normal): header + 3 cards en una columna acotada, sin tabs ni rail. La usa
 * `home.tsx` como único gate mientras permisos + organización + checklist +
 * "Mi trabajo" + estadísticas resuelven, para que la primera pintura ya sea el
 * diseño correcto en vez de saltar entre ambos. No reusa `PageSkeleton`: esa
 * silueta (buscador + tabla) no se parece a Home.
 */
export function HomeSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden bg-surface-sunken p-4 md:p-6">
      <div className="flex shrink-0 flex-col gap-2 pb-1">
        <Skeleton className="h-[18px] w-[230px] rounded-full" />
        <Skeleton className="h-2.5 w-[380px] max-w-full rounded-full" />
      </div>
      <div className="flex w-full max-w-[760px] flex-col gap-4">
        {CARD_BAR_WIDTHS.map((bars, i) => (
          <div key={i} className={`${HOME_CARD} flex flex-col gap-3 p-4`}>
            {bars.map((width, j) => (
              <Skeleton key={j} className={`h-2.5 rounded-full ${width}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
