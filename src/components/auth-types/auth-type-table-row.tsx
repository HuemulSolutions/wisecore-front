import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit2, Trash2, MoreVertical } from "lucide-react"
import ProtectedComponent from "@/components/protected-component"
import type { AuthType } from "@/services/auth-types"

interface AuthTypeTableRowProps {
  authType: AuthType
  onEdit: (authType: AuthType) => void
  onDelete: (authType: AuthType) => void
}

export function AuthTypeTableRow({ authType, onEdit, onDelete }: AuthTypeTableRowProps) {
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "internal":
        return "Internal"
      case "entra":
        return "Entra ID (SAML2)"
      default:
        return type
    }
  }

  return (
    <tr className="border-b border-border hover:bg-muted/20 transition">
      <td className="px-3 py-2 text-xs font-medium text-foreground">{authType.name}</td>
      <td className="px-3 py-2 text-xs text-foreground">{getTypeDisplayName(authType.type)}</td>
      <td className="px-3 py-2 text-xs text-foreground">
        {new Date(authType.created_at).toLocaleDateString()}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {new Date(authType.updated_at).toLocaleDateString()}
      </td>
      <td className="px-3 py-2 text-right">
        <ProtectedComponent requireRootAdmin>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:cursor-pointer h-6 w-6 p-0"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => {
                setTimeout(() => {
                  onEdit(authType)
                }, 0)
              }} className="hover:cursor-pointer">
                <Edit2 className="mr-2 h-3 w-3" />
                Edit Auth Type
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => {
                setTimeout(() => {
                  onDelete(authType)
                }, 0)
              }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3 w-3" />
                Delete Auth Type
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ProtectedComponent>
      </td>
    </tr>
  )
}