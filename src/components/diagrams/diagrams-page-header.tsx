import { List, Plus, Workflow } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"

export interface DiagramsPageHeaderProps {
  onBrowseDiagrams: () => void
  onCreateDiagram: () => void
  onRefresh: () => void
  isLoading?: boolean
  canList?: boolean
  canCreate?: boolean
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
    />
  )
}
