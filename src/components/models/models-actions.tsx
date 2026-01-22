import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, MoreVertical } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import type { LLM } from "@/services/llms"

interface ModelActionsProps {
  model: LLM
  onEdit: (model: LLM) => void
  onDelete: (model: LLM) => void
  isDeleting: boolean
  dropdownOpen: boolean
  onDropdownChange: (open: boolean) => void
  canUpdate: boolean
  canDelete: boolean
}

export function ModelActions({ 
  model, 
  onEdit, 
  onDelete, 
  isDeleting,
  dropdownOpen,
  onDropdownChange,
  canUpdate,
  canDelete
}: ModelActionsProps) {
  const isMobile = useIsMobile()

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
            variant="outline"
            size="sm"
            className="hover:cursor-pointer h-6 w-6 p-0"
          >
            <MoreVertical className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canUpdate && (
            <DropdownMenuItem
              onClick={() => onEdit(model)}
              className="hover:cursor-pointer text-xs"
            >
              <Edit className="h-3 w-3 mr-2 text-blue-600" />
              Edit Model
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(model)}
              className="hover:cursor-pointer text-red-600 text-xs"
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Model'}
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
          onClick={() => onEdit(model)}
          className="hover:cursor-pointer h-6 w-6 p-0"
        >
          <Edit className="h-3 w-3 text-blue-600" />
        </Button>
      )}
      {canDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(model)}
          className="hover:cursor-pointer h-6 w-6 p-0"
          disabled={isDeleting}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      )}
    </>
  )
}