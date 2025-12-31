import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface AuthTypesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function AuthTypesSearch({ searchTerm, onSearchChange }: AuthTypesSearchProps) {
  return (
    <div className="mb-4">
      <div className="relative max-w-md">
        <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="Search authentication types..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-7 h-8 text-xs"
        />
      </div>
    </div>
  )
}