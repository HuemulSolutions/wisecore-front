import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2, MoreVertical, Radio, Loader2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import type { LLM } from "@/services/llms"

interface ModelActionsProps {
  model: LLM
  onEdit: (model: LLM) => void
  onDelete: (model: LLM) => void
  onTest: (model: LLM) => void
  isDeleting: boolean
  isTesting: boolean
  dropdownOpen: boolean
  onDropdownChange: (open: boolean) => void
  canUpdate: boolean
  canDelete: boolean
}

export function ModelActions({ 
  model, 
  onEdit, 
  onDelete, 
  onTest,
  isDeleting,
  isTesting,
  dropdownOpen,
  onDropdownChange,
  canUpdate,
  canDelete
}: ModelActionsProps) {
  const isMobile = useIsMobile()

  // Siempre mostrar al menos el botón de test
  if (!canUpdate && !canDelete) {
    // Solo mostrar botón de test
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTest(model)}
              className="hover:cursor-pointer h-6 w-6 p-0"
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
              ) : (
                <Radio className="h-3 w-3 text-blue-600" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isTesting ? 'Testing connection...' : 'Test Connection'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
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
          <DropdownMenuItem
            onClick={() => onTest(model)}
            className="hover:cursor-pointer text-xs"
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 mr-2 text-blue-600 animate-spin" />
            ) : (
              <Radio className="h-3 w-3 mr-2 text-blue-600" />
            )}
            {isTesting ? 'Testing...' : 'Test Connection'}
          </DropdownMenuItem>
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTest(model)}
            className="hover:cursor-pointer h-6 w-6 p-0"
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
            ) : (
              <Radio className="h-3 w-3 text-blue-600" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isTesting ? 'Testing connection...' : 'Test Connection'}</p>
        </TooltipContent>
      </Tooltip>
      {canUpdate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(model)}
              className="hover:cursor-pointer h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3 text-blue-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit Model</p>
          </TooltipContent>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(model)}
              className="hover:cursor-pointer h-6 w-6 p-0"
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isDeleting ? 'Deleting...' : 'Delete Model'}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  )
}