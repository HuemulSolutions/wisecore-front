"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Plus, Search } from "lucide-react"

interface CustomFieldContentEmptyStateProps {
  type: "error" | "empty" | "no-results"
  message?: string
  onRetry?: () => void
  onCreateFirst?: () => void
  onClearFilters?: () => void
}

export function CustomFieldContentEmptyState({
  type,
  message,
  onRetry,
  onCreateFirst,
  onClearFilters,
}: CustomFieldContentEmptyStateProps) {
  if (type === "error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Error Loading Data</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {message || "There was an error loading the custom fields. Please try again."}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="mt-4 hover:cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (type === "no-results") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No Custom Fields Found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            No custom fields match your current search criteria.
          </p>
          {onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="mt-4 hover:cursor-pointer"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // type === "empty"
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Plus className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No Custom Fields</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Get started by creating your first custom field to extend your documents with additional data.
        </p>
        {onCreateFirst && (
          <Button
            onClick={onCreateFirst}
            className="mt-4 hover:cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create First Custom Field
          </Button>
        )}
      </CardContent>
    </Card>
  )
}