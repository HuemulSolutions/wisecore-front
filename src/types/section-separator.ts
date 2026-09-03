export interface SectionSeparatorProps {
  onAddSection: (afterIndex?: number) => void
  index?: number
  isLastSection?: boolean
  isMobile?: boolean
  /** Nombre de la sección inmediatamente anterior, para el aria-label del chip. */
  previousSectionName?: string
}
