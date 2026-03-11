import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, MoreVertical, Radio, Loader2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"
import type { LLM } from "@/types/llm"

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
  const { t } = useTranslation('models')

  // Siempre mostrar al menos el botón de test
  if (!canUpdate && !canDelete) {
    // Solo mostrar botón de test
    return (
      <HuemulButton
        icon={Radio}
        variant="ghost"
        size="icon-sm"
        iconClassName="text-blue-600"
        tooltip={isTesting ? t('modelActions.testingConnection') : t('modelActions.testConnection')}
        loading={isTesting}
        onClick={() => onTest(model)}
      />
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
            {isTesting ? t('modelActions.testing') : t('modelActions.testConnection')}
          </DropdownMenuItem>
          {canUpdate && (
            <DropdownMenuItem
              onClick={() => onEdit(model)}
              className="hover:cursor-pointer text-xs"
            >
              <Edit className="h-3 w-3 mr-2 text-blue-600" />
              {t('modelActions.editModel')}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(model)}
              className="hover:cursor-pointer text-red-600 text-xs"
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              {isDeleting ? t('common:deleting') : t('modelActions.deleteModel')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <HuemulButton
        icon={Radio}
        variant="ghost"
        size="icon-sm"
        iconClassName="text-blue-600"
        tooltip={isTesting ? t('modelActions.testingConnection') : t('modelActions.testConnection')}
        loading={isTesting}
        onClick={() => onTest(model)}
      />
      {canUpdate && (
        <HuemulButton
          icon={Edit}
          variant="ghost"
          size="icon-sm"
          iconClassName="text-blue-600"
          tooltip={t('modelActions.editModel')}
          onClick={() => onEdit(model)}
        />
      )}
      {canDelete && (
        <HuemulButton
          icon={Trash2}
          variant="ghost"
          size="icon-sm"
          iconClassName="text-destructive"
          tooltip={isDeleting ? t('common:deleting') : t('modelActions.deleteModel')}
          disabled={isDeleting}
          loading={isDeleting}
          onClick={() => onDelete(model)}
        />
      )}
    </>
  )
}