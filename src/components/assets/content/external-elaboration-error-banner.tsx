import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface ExternalElaborationErrorBannerProps {
  message: string | null;
  /** Ausente si el usuario no puede disparar la elaboración (sin `edit`, etapa distinta de edición). */
  onRetry?: () => void;
  isRetrying?: boolean;
}

// Banner estático, sin dismiss: el error se limpia solo con una corrida posterior no
// fallida del mismo step. Sin refresh propio — lo trae la query de ['document-content', ...].
export function ExternalElaborationErrorBanner({ message, onRetry, isRetrying = false }: ExternalElaborationErrorBannerProps) {
  const { t } = useTranslation('assets');

  return (
    <div className="border-l-4 border-red-200 bg-red-50 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">
            {t('lifecycle.externalElaborationErrorNotice.title')}
          </p>
          <p className="text-xs text-red-700 mt-1 break-words">
            {message || t('lifecycle.externalElaborationErrorNotice.fallbackMessage')}
          </p>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} disabled={isRetrying} className="flex-shrink-0">
            {t('lifecycle.externalElaborationErrorNotice.retry')}
          </Button>
        )}
      </div>
    </div>
  );
}
