"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface CustomFieldFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function CustomFieldFilters({
  searchTerm,
  onSearchChange,
}: CustomFieldFiltersProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1.5 sm:top-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search custom fields..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 sm:pl-8 h-7 sm:h-8 text-xs sm:text-sm"
          />
        </div>
      </div>
    </div>
  )
}