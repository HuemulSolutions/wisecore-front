import { Skeleton } from "@/components/ui/skeleton"

export function OrganizationPageSkeleton() {
  return (
    <div className="bg-background p-6 md:p-8">
      <div className="mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-32 rounded" />
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <Skeleton className="h-10 w-full rounded" />

        {/* Table Skeleton */}
        <div className="rounded-lg border bg-card">
          <div className="p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
