import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface UserFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onStatusFilterChange: (value: string) => void
}

export default function UserFilters({ 
  searchTerm, 
  onSearchChange, 
  filterStatus, 
  onStatusFilterChange 
}: UserFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4 md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>
      <Select value={filterStatus} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full md:w-36 h-8 hover:cursor-pointer text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}