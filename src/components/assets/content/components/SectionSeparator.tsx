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
    <div className="relative flex h-11 items-center gap-2 px-4 max-w-full">
      <div className="h-px flex-1 bg-[#eef1f6]" />
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
        className="h-6 shrink-0 gap-1 rounded-xl border-0 bg-transparent px-2.5 py-0 text-xs font-semibold text-[#94a3b8] shadow-none hover:cursor-pointer hover:bg-[#eff5ff] hover:text-[#1d4ed8]"
      >
        <Plus className="h-3 w-3 stroke-[2.2]" />
        {t('sectionSeparator.insertSection')}
      </DocumentActionButton>
      <div className="h-px flex-1 bg-[#eef1f6]" />
    </div>
  );
}
