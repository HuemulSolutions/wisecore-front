import { Users, Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import ProtectedComponent from "@/components/protected-component"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserPageHeaderProps {
  userCount: number
  onCreateUser: () => void
  onRefresh: () => void
  isLoading: boolean
  hasError?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onStatusFilterChange: (value: string) => void
}

export default function UserPageHeader({ 
  userCount, 
  onCreateUser, 
  onRefresh, 
  isLoading, 
  hasError,
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusFilterChange
}: UserPageHeaderProps) {
  return (
    <PageHeader
      icon={Users}
      title="Users Management"
      badges={[
        { label: "", value: `${userCount} users` }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={{
        label: "Add User",
        icon: Plus,
        onClick: onCreateUser,
        protectedContent: (
          <ProtectedComponent permission="user:c">
            <Button 
              size="sm"
              onClick={onCreateUser}
              disabled={hasError}
              className="hover:cursor-pointer h-8 text-xs px-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add User
            </Button>
          </ProtectedComponent>
        )
      }}
      searchConfig={{
        placeholder: "Search users...",
        value: searchTerm,
        onChange: onSearchChange
      }}
    >
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
    </PageHeader>
  )
}