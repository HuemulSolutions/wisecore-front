import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RolesLoadingState() {
  return (
    <div className="bg-background p-2 sm:p-3 md:p-4 lg:p-6">
      <div className="mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
          <Skeleton className="h-7 sm:h-9 w-40 sm:w-48" />
          <Skeleton className="h-8 sm:h-10 w-24 sm:w-32" />
        </div>
        <div className="mb-3 sm:mb-4">
          <Skeleton className="h-7 sm:h-9 w-60 sm:w-80" />
        </div>
        <Card className="overflow-hidden border border-border bg-card">
          <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 sm:h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
