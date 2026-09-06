import { Skeleton } from '@/components/ui/skeleton';

/**
 * Silueta neutra de Home, común a los dos diseños (primera vez / establecido)
 * — sin rail, sin tabs. La usa `home.tsx` como único gate mientras
 * permisos + organización + checklist + "Mi trabajo" resuelven, para que la
 * primera pintura ya sea el diseño correcto en vez de saltar entre ambos.
 * No reusa `PageSkeleton`: esa silueta (buscador + tabla) no se parece a
 * Home, así que la salida del skeleton sería en sí un salto visible.
 */
export function HomeSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3.5 overflow-hidden bg-gray-50 p-4 md:p-6">
      <div className="flex shrink-0 flex-col gap-1 pb-1">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card p-4">
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
