import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

interface RolesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  rolesCount: number
  hasError?: boolean
}

export function RolesSearch({ searchTerm, onSearchChange, rolesCount, hasError }: RolesSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1.5 sm:top-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-7 sm:pl-8 h-7 sm:h-8 text-xs sm:text-sm"
        />
      </div>
      <Badge variant="outline" className="text-xs px-2 py-0.5 sm:py-1 self-start sm:self-center">
        {hasError ? 0 : rolesCount} roles
      </Badge>
    </div>
  )
}
