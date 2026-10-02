import { useTranslation } from 'react-i18next';
import { VersionBanner } from './version-banner';

// Banner estático: no hace su propio polling ni tiene botón de refresh — la
// query de ['document-content', ...] ya poll-ea sola mientras
// is_locked_external_elaboration === true (ver assets-content.tsx), y este
// banner solo se monta/desmonta según ese mismo valor. Sin dismiss: el estado
// no lo decide el usuario, se libera solo cuando el ElaborationRun termina.
export function ExternalElaborationLockBanner() {
  const { t } = useTranslation('assets');

  return (
    <VersionBanner
      variant="externalLocked"
      pulsing
      title={t('lifecycle.lockedExternalElaborationNotice.title')}
      text={t('lifecycle.lockedExternalElaborationNotice.description')}
    />
  );
}
