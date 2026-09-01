import { Skeleton } from "@/components/ui/skeleton"
import { PageSkeleton } from "@/components/ui/page-skeleton"

/**
 * Estado de carga a pantalla completa mostrado mientras se resuelve la
 * autenticación inicial (antes de que exista sesión / organización / rutas).
 *
 * Replica el shell real de `AppLayout` (header + contenido) con skeletons,
 * para que la transición hacia la app montada sea continua en vez de un
 * salto entre spinner y contenido real.
 */
export function HuemulAppLoading() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <div className="flex items-center gap-2 min-w-45">
          <Skeleton className="h-8 w-32" />
        </div>

        <nav className="hidden md:flex items-center justify-center gap-2 flex-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <PageSkeleton />
      </div>
    </div>
  )
}
