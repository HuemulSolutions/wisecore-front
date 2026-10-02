import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VersionBanner } from './version-banner';
import type { VersionBannerVariant } from './version-banner-variants';

/**
 * Banner de ejemplo para previsualizar cada variante en desarrollo (`?banner=<variante>`).
 * Solo se monta con `import.meta.env.DEV` (ver useDevStateOverride); reutiliza textos existentes.
 */
export function VersionBannerPreview({ variant, className }: { variant: VersionBannerVariant; className?: string }) {
  const { t } = useTranslation(['assets', 'execute']);

  switch (variant) {
    case 'externalLocked':
      return (
        <VersionBanner
          variant={variant}
          pulsing
          className={className}
          title={t('assets:lifecycle.lockedExternalElaborationNotice.title')}
          text={t('assets:lifecycle.lockedExternalElaborationNotice.description')}
        />
      );
    case 'externalFailed':
      return (
        <VersionBanner
          variant={variant}
          className={className}
          title={t('assets:lifecycle.externalElaborationErrorNotice.title')}
          text={t('assets:lifecycle.externalElaborationErrorNotice.fallbackMessage')}
          actions={[{ label: t('assets:lifecycle.externalElaborationErrorNotice.retry'), onClick: () => undefined }]}
        />
      );
    case 'otherVersion':
      return (
        <VersionBanner
          variant={variant}
          pulsing
          className={className}
          title={t('execute:otherVersionBanner.versionTitle', {
            name: t('execute:otherVersionBanner.newVersionFallback'),
            status: t('execute:banner.status.running'),
          })}
          text={t('execute:otherVersionBanner.description.running')}
          actions={[
            { label: t('execute:otherVersionBanner.dismissNotice'), onClick: () => undefined },
            { label: t('execute:otherVersionBanner.viewVersion'), onClick: () => undefined },
          ]}
        />
      );
    case 'generating':
      return (
        <VersionBanner
          variant={variant}
          pulsing
          className={className}
          title={t('execute:banner.documentPrefix', { status: t('execute:banner.status.running') })}
          text={t('execute:banner.description.running')}
          progress={40}
        />
      );
    case 'partialRun':
      return (
        <VersionBanner
          variant={variant}
          pulsing
          className={className}
          title={t('execute:executionRun.title.running')}
          progress={50}
          progressLabel={t('execute:executionRun.progress', { done: 2, total: 4 })}
          actions={[{ label: t('execute:executionRun.refreshStatus'), icon: RefreshCw, onClick: () => undefined }]}
        />
      );
  }
}
