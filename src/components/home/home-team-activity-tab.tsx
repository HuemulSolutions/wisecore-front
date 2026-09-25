import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { ChangeHistoryPanel } from '@/components/execution/change-history-panel';

export interface HomeTeamActivityTabProps {
  organizationId: string;
}

/**
 * Pestaña "Actividad del equipo" — antes vivía en un `HuemulSheet` abierto
 * desde el botón "Revisiones Pendientes" del header (eliminado en este
 * rediseño). `ChangeHistoryPanel` no expone `refetch` propio (sin props),
 * así que el refresh de este tab invalida por key conocida en vez de tocar
 * su interior — patrón aceptado por `ia context/refresh-button-guide.md` §4.
 */
export function HomeTeamActivityTab({ organizationId }: HomeTeamActivityTabProps) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['documents', 'pending-changes', organizationId] });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 justify-end pb-2">
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          icon={RefreshCw}
          tooltip={t('refresh')}
          loading={isRefreshing}
          onClick={handleRefresh}
        />
      </div>
      <div className="flex-1 min-h-0">
        <ChangeHistoryPanel />
      </div>
    </div>
  );
}
