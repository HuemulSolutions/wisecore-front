import { Clock, List, Plus, Workflow } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { HuemulButton } from "@/huemul/components/huemul-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { RecentDiagram } from "@/hooks/useRecentDiagrams"

export interface DiagramsPageHeaderProps {
  onBrowseDiagrams: () => void
  onCreateDiagram: () => void
  onRefresh: () => void
  isLoading?: boolean
  canList?: boolean
  canCreate?: boolean
  /** Últimos diagramas abiertos/creados — atajo para cargarlos sin abrir el sheet. */
  recentDiagrams?: RecentDiagram[]
  onOpenRecent?: (diagram: RecentDiagram) => void
}

/**
 * Header de `/diagrams`. Antes las acciones vivían en un strip dentro de la
 * columna del canvas: subirlas aquí deja la página con la misma estructura que
 * `/asset-type-relationships`, que monta el mismo canvas.
 */
export function DiagramsPageHeader({
  onBrowseDiagrams,
  onCreateDiagram,
  onRefresh,
  isLoading,
  canList = false,
  canCreate = false,
  recentDiagrams = [],
  onOpenRecent,
}: DiagramsPageHeaderProps) {
  const { t } = useTranslation("diagrams")

  return (
    <PageHeader
      icon={Workflow}
      title={t("header.title")}
      subtitle={t("header.subtitle")}
      onRefresh={onRefresh}
      isLoading={isLoading}
      additionalActions={canList ? [{
        label: t("actions.browseDiagrams"),
        icon: List,
        onClick: onBrowseDiagrams,
      }] : []}
      primaryAction={canCreate ? {
        label: t("relatedSheet.createAction"),
        icon: Plus,
        onClick: onCreateDiagram,
      } : undefined}
      // Página full-height: el header es una franja, no una sección con aire
      // debajo, así que se anula el margen por defecto de PageHeader.
      className="mb-0! space-y-0!"
    >
      {canList && recentDiagrams.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HuemulButton
              variant="outline"
              size="sm"
              icon={Clock}
              label={t("actions.recentDiagrams")}
              className="h-8 text-xs px-2"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {recentDiagrams.map((diagram) => (
              <DropdownMenuItem
                key={diagram.id}
                onSelect={() => onOpenRecent?.(diagram)}
                className="hover:cursor-pointer"
              >
                <span className="truncate">{diagram.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </PageHeader>
  )
}
