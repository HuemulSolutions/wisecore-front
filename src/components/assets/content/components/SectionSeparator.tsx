import { Plus } from 'lucide-react';
import { DocumentActionButton } from '@/components/assets/content/assets-access-control';
import { useTranslation } from 'react-i18next';
import type { SectionSeparatorProps } from '@/types/section-separator';
export type { SectionSeparatorProps } from '@/types/section-separator';

/**
 * Separador entre secciones: dos líneas con un chip "Insertar sección" al centro,
 * siempre visible.
 */
export function SectionSeparator({
  onAddSection,
  index,
  isLastSection = false,
  previousSectionName,
}: SectionSeparatorProps) {
  const { t } = useTranslation('assets');

  const ariaLabel = isLastSection
    ? t('sectionSeparator.addSectionEnd')
    : previousSectionName
      ? t('sectionSeparator.insertSectionAfterName', { name: previousSectionName })
      : index !== undefined && index >= 0
        ? t('sectionSeparator.addSectionAfter', { index: index + 1 })
        : t('sectionSeparator.addSectionBeginning');

  return (
    <div className="relative flex h-5.5 items-center gap-2 px-4 max-w-full">
      <div className="h-px flex-1 bg-[#e9edf2]" />
      <DocumentActionButton
        requiredAccess={["edit", "create"]}
        requireAll={false}
        checkGlobalPermissions={true}
        resource="asset"
        onClick={() => onAddSection(index)}
        variant="ghost"
        size="sm"
        aria-label={ariaLabel}
        title={ariaLabel}
        className="h-auto shrink-0 gap-1 rounded-full border border-[#e5eaf1] bg-white px-2.25 py-0.5 text-[11.5px] font-medium text-[#64748b] shadow-none hover:cursor-pointer hover:border-[#bfd3fb] hover:bg-white hover:text-[#1d4ed8]"
      >
        <Plus className="h-3 w-3 stroke-[2.2]" />
        {t('sectionSeparator.insertSection')}
      </DocumentActionButton>
      <div className="h-px flex-1 bg-[#e9edf2]" />
    </div>
  );
}
