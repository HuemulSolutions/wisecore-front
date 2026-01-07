"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Settings2} from "lucide-react"
import { Badge } from "../ui/badge"

interface CustomFieldPageHeaderProps {
  customFieldCount: number
  onCreateCustomField: () => void
  onRefresh: () => void
  isLoading?: boolean
}

export function CustomFieldPageHeader({
  customFieldCount,
  onCreateCustomField,
  onRefresh,
  isLoading = false,
}: CustomFieldPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Custom Fields</h1>
      </div>
        <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs px-2 py-1">
          {isLoading ? "..." : customFieldCount}
        </Badge>
        <Button 
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="hover:cursor-pointer h-8 text-xs px-2"
        >
          {isLoading ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Refresh
        </Button>
        <Button 
          size="sm"
          onClick={onCreateCustomField}
        //   disabled={hasError}
          className="hover:cursor-pointer h-8 text-xs px-2"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create Asset Type
        </Button>
      </div>
    </div>
  )
}