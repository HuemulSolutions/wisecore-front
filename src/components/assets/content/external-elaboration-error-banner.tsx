import { useTranslation } from 'react-i18next';
import { VersionBanner } from './version-banner';

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
    <VersionBanner
      variant="externalFailed"
      title={t('lifecycle.externalElaborationErrorNotice.title')}
      text={message || t('lifecycle.externalElaborationErrorNotice.fallbackMessage')}
      actions={
        onRetry
          ? [{ label: t('lifecycle.externalElaborationErrorNotice.retry'), onClick: onRetry, loading: isRetrying }]
          : undefined
      }
    />
  );
}
