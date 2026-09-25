import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { PageSkeletonProps } from '@/types/huemul'
export type { PageSkeletonProps } from '@/types/huemul'

export function PageSkeleton({ 
  rows = 5, 
  showSearch = true,
  showFilters = false
}: PageSkeletonProps) {
  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-7 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        {/* Search Row */}
        {showSearch && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            <Skeleton className="h-8 flex-1" />
            {showFilters && <Skeleton className="h-8 w-32" />}
          </div>
        )}

        {/* Table Card */}
        <Card className="overflow-hidden border border-border bg-card">
          <div className="p-4 space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
