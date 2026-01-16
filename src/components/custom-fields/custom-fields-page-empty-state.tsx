"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert, Plus } from "lucide-react"

interface CustomFieldPageEmptyStateProps {
  type: "access-denied" | "error" | "empty"
  message?: string
  onCreateFirst?: () => void
}

export function CustomFieldPageEmptyState({
  type,
  message,
  onCreateFirst,
}: CustomFieldPageEmptyStateProps) {
  if (type === "access-denied") {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Access Denied</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You don't have permission to manage custom fields.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (type === "error") {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Error Loading Custom Fields</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {message || "There was an error loading the custom fields."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No Custom Fields</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first custom field.
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
      </div>
    </div>
  )
}