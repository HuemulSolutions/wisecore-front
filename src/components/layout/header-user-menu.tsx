import { useTranslation } from "react-i18next"
import { User, BellRing, Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderUserMenuUser {
  name: string
  last_name: string
  email: string
}

interface HeaderUserMenuProps {
  user: HeaderUserMenuUser
  organizationToken: string | null
  canListNotifications: boolean
  unreadNotificationsCount: number
  onUpdateProfile: () => void
  onOpenNotifications: () => void
  onOpenSubscriptions: () => void
  onSignOut: () => void
}

const getUserInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase()
}

/**
 * Menú del avatar: solo lo personal de la cuenta logueada (perfil,
 * notificaciones, suscripciones, cerrar sesión). Configuración de la
 * organización (Tokens de API, etc.) vive en `HeaderSettingsMenu`, no acá —
 * ver ia context/header-menu-guide.md.
 */
export function HeaderUserMenu({
  user,
  organizationToken,
  canListNotifications,
  unreadNotificationsCount,
  onUpdateProfile,
  onOpenNotifications,
  onOpenSubscriptions,
  onSignOut,
}: HeaderUserMenuProps) {
  const { t } = useTranslation("layout")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={`${user.name} ${user.last_name}`} />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
              {getUserInitials(user.name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          {organizationToken && canListNotifications && unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium leading-none">
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name} {user.last_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:cursor-pointer" onSelect={onUpdateProfile}>
          <User className="h-4 w-4 mr-2" />
          {t("header.updateProfile")}
        </DropdownMenuItem>
        {organizationToken && canListNotifications && (
          <DropdownMenuItem className="hover:cursor-pointer" onSelect={onOpenNotifications}>
            <BellRing className="h-4 w-4 mr-2" />
            {t("header.notifications")}
            {unreadNotificationsCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium leading-none">
                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
              </span>
            )}
          </DropdownMenuItem>
        )}
        {organizationToken && (
          <DropdownMenuItem className="hover:cursor-pointer" onSelect={onOpenSubscriptions}>
            <Bell className="h-4 w-4 mr-2" />
            {t("header.mySubscriptions")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="hover:cursor-pointer" onClick={onSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {t("header.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
