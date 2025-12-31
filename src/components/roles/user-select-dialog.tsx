import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, Shield, Users } from "lucide-react"
import { useUsers } from "@/hooks/useUsers"
import { type UsersResponse, type User } from "@/services/users"

interface UserSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserSelect: (userId: string) => void
}

export default function UserSelectDialog({ open, onOpenChange, onUserSelect }: UserSelectDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  // Only fetch users when the dialog is actually open
  const { data: usersResponse, isLoading } = useUsers(open) as {
    data: UsersResponse | undefined,
    isLoading: boolean
  }
  
  const users = usersResponse?.data || []
  const filteredUsers = users.filter((user: User) => 
    `${user.name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserClick = (userId: string) => {
    onUserSelect(userId)
    onOpenChange(false)
    setSearchTerm('') // Reset search when dialog closes
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Select User</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a user to assign roles to.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg hover:cursor-pointer transition-colors"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  {user.is_root_admin && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
                {searchTerm && <p className="text-xs">Try adjusting your search</p>}
              </div>
            )}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSearchTerm('')}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}