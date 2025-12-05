"use client"

import {
  // Bell,
  ChevronsUpDown,
  LogOut,
  // Settings,
  User,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { UpdateProfileDialog } from "@/components/update-profile-dialog"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, logout } = useAuth()
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)

  // If no user, return null
  if (!user) return null

  // Generate initials from user name
  const getUserInitials = (firstName: string, lastName: string): string => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase()
  }

  // // User actions
  // const handleProfileClick = () => {
  //   console.log('Navigate to profile')
  //   // TODO: Navigate to profile page
  // }

  // const handleSettingsClick = () => {
  //   console.log('Navigate to settings')
  //   // TODO: Navigate to settings page
  // }

  const handleSignOut = () => {
    logout()
  }

  const handleUpdateProfile = () => {
    // Use setTimeout so the dropdown menu fully closes before the dialog appears
    setTimeout(() => {
      setProfileDialogOpen(true)
    }, 0)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="" alt={`${user.name} ${user.last_name}`} />
                <AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs">
                  {getUserInitials(user.name, user.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name} {user.last_name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt={`${user.name} ${user.last_name}`} />
                  <AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs">
                    {getUserInitials(user.name, user.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name} {user.last_name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="hover:cursor-pointer" 
                onSelect={handleUpdateProfile}
              >
                <User className="h-4 w-4 mr-2" />
                Update Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:cursor-pointer text-red-600" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <UpdateProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </SidebarMenu>
  )
}