import { GitMerge } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"

export interface DocumentTypeRelationshipsPageHeaderProps {
  onRefresh: () => void
  isLoading?: boolean
}

/**
 * Header de `/asset-type-relationships`. Mismo `PageHeader` que el resto del
 * producto (y que `/diagrams`), para que el usuario reconozca la superficie de
 * canvas sin volver a aprenderla.
 */
export function DocumentTypeRelationshipsPageHeader({
  onRefresh,
  isLoading,
}: DocumentTypeRelationshipsPageHeaderProps) {
  const { t } = useTranslation("document-type-relationships")

  return (
    <PageHeader
      icon={GitMerge}
      title={t("header.title")}
      subtitle={t("header.subtitle")}
      onRefresh={onRefresh}
      isLoading={isLoading}
      // Página full-height: el header es una franja, no una sección con aire
      // debajo, así que se anula el margen por defecto de PageHeader.
      className="mb-0! space-y-0!"
    />
  )
}
