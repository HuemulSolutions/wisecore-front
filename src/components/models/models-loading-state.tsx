import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ModelsLoadingState() {
  return (
    <div className="bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <Skeleton className="h-7 w-48" />
        </div>
        <Card className="border border-border bg-card">
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