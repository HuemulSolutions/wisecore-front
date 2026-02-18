import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, MoreVertical } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface ProviderActionsProps {
  provider: any
  onEdit: (provider: any) => void
  onDelete: (provider: any) => void
  isDeleting: boolean
  dropdownOpen: boolean
  onDropdownChange: (open: boolean) => void
  canUpdate: boolean
  canDelete: boolean
}

export function ProviderActions({ 
  provider, 
  onEdit, 
  onDelete, 
  isDeleting,
  dropdownOpen,
  onDropdownChange,
  canUpdate,
  canDelete
}: ProviderActionsProps) {
  const isMobile = useIsMobile()

  if (!provider.isConfigured) {
    return null
  }

  // Si no tiene ningún permiso, no mostrar nada
  if (!canUpdate && !canDelete) {
    return null
  }

  if (isMobile) {
    return (
      <DropdownMenu 
        open={dropdownOpen}
        onOpenChange={onDropdownChange}
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className="hover:cursor-pointer h-6 w-6 p-0 hover:bg-muted/20"
          >
            <MoreVertical className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canUpdate && (
            <DropdownMenuItem
              onClick={() => onEdit(provider)}
              className="hover:cursor-pointer text-xs"
            >
              <Edit className="h-3 w-3 mr-2 text-blue-600" />
              Edit Provider
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(provider)}
              className="hover:cursor-pointer text-red-600 text-xs"
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Provider'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      {canUpdate && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(provider)
          }}
          className="hover:cursor-pointer h-6 w-6 p-0"
        >
          <Edit className="h-3 w-3 text-blue-600" />
        </Button>
      )}
      {canDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(provider)
          }}
          className="hover:cursor-pointer h-6 w-6 p-0"
          disabled={isDeleting}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      )}
    </>
  )
}