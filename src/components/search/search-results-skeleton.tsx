import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Loading header with spinner */}
      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Searching through your documents...</p>
      </div>

      {/* Skeleton for document cards */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border border-border bg-card">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon skeleton */}
                <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title skeleton */}
                  <Skeleton className="h-4 w-48" />
                  
                  {/* Badges skeleton */}
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
              
              {/* Action buttons skeleton */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
