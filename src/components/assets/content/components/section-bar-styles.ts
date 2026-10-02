import type { ReviewStatus } from '@/services/section_execution';
import type { SectionAnswersStatus } from '@/types/section-execution';

/** Nivel visual de un botón de la barra de sección: la jerarquía se expresa con color, no con tamaño. */
export type SectionBarTone = 'primary' | 'secondary' | 'tertiary' | 'danger';

const HOVER_NEUTRAL = 'hover:bg-[#f1f5f9] hover:text-[#0f172a]';

export const SECTION_BAR_TONE_CLASS: Record<SectionBarTone, string> = {
  primary: 'bg-[#eff5ff] pl-2 pr-2.5 text-[#1d4ed8] hover:bg-[#dbeafe]',
  secondary: `bg-transparent text-[#334155] ${HOVER_NEUTRAL}`,
  tertiary: `bg-transparent text-[#94a3b8] ${HOVER_NEUTRAL}`,
  danger: 'bg-transparent text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]',
};

export const SECTION_BAR_DISABLED_CLASS = 'cursor-not-allowed bg-transparent text-[#cbd5e1] hover:bg-transparent hover:text-[#cbd5e1]';

/** Color del punto y del texto del select de revisión, por estado. */
export const REVIEW_STATUS_DOT_COLOR: Record<ReviewStatus, string> = {
  editing: '#1d4ed8',
  reviewing: '#b45309',
  finished: '#15803d',
  rejected: '#b91c1c',
};

const REVIEW_STATUS_TRIGGER_CLASS: Record<ReviewStatus, string> = {
  editing: 'bg-[#eff5ff] text-[#1d4ed8]',
  reviewing: 'bg-[#fffbeb] text-[#b45309]',
  finished: 'bg-[#f0fdf4] text-[#15803d]',
  rejected: 'bg-[#fef2f2] text-[#b91c1c]',
};

const REVIEW_SELECT_BASE =
  'w-auto h-7 px-2 rounded-lg border-0 shadow-none text-xs font-semibold hover:cursor-pointer [&_svg]:h-3 [&_svg]:w-3 [&_svg]:opacity-50';
const REVIEW_SELECT_EMPTY = 'bg-[#f1f5f9] text-[#475569]';
const REVIEW_SELECT_READONLY = 'cursor-default ring-1 ring-inset ring-[#e2e8f0] hover:cursor-default disabled:opacity-100';

export function reviewSelectClass(status: ReviewStatus | null, readOnly: boolean): string {
  return [
    REVIEW_SELECT_BASE,
    status ? REVIEW_STATUS_TRIGGER_CLASS[status] : REVIEW_SELECT_EMPTY,
    readOnly ? REVIEW_SELECT_READONLY : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export type AnswersPillTone = SectionAnswersStatus | 'inactive';

export const ANSWERS_PILL_CLASS: Record<AnswersPillTone, { pill: string; dot: string }> = {
  pending: { pill: 'bg-[#fef2f2] text-[#b91c1c]', dot: 'bg-[#dc2626]' },
  completed: { pill: 'bg-[#f0fdf4] text-[#15803d]', dot: 'bg-[#16a34a]' },
  inactive: { pill: 'bg-[#f1f5f9] text-[#64748b]', dot: 'bg-[#94a3b8]' },
};

/**
 * Intercala un separador entre grupos de acciones, descartando los vacíos: nunca hay
 * separador colgando al inicio, al final ni doble.
 */
export function interleaveGroups<T, S>(groups: (T | null | false | undefined)[], separator: (index: number) => S): (T | S)[] {
  const present = groups.filter((g): g is T => !!g);
  return present.flatMap((group, i) => (i === 0 ? [group] : [separator(i), group]));
}
