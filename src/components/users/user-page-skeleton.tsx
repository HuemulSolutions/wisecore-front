import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function UserPageSkeleton() {
  return (
    <div className="bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Card className="overflow-hidden border border-border bg-card">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}