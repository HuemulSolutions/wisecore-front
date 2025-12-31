import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AuthTypesLoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <Skeleton className="h-7 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        
        <div className="mb-4">
          <Skeleton className="h-8 w-80" />
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}