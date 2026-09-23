import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HOME_CARD_HEADER } from './home-surface';

export interface HomeCollapsibleHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Header de card del rail que colapsa/expande su cuerpo — título a la izquierda, chevron a la derecha. */
export function HomeCollapsibleHeader({ collapsed, onToggle, children }: HomeCollapsibleHeaderProps) {
  const { t } = useTranslation('home');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      title={collapsed ? t('rail.expand') : t('rail.collapse')}
      className={cn(HOME_CARD_HEADER, 'w-full items-start text-left hover:cursor-pointer', collapsed && 'border-b-0')}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronDown
        className={cn('mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', collapsed && '-rotate-90')}
      />
    </button>
  );
}
