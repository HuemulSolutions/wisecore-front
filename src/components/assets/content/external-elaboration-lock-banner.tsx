import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Banner estático: no hace su propio polling ni tiene botón de refresh — la
// query de ['document-content', ...] ya poll-ea sola mientras
// is_locked_external_elaboration === true (ver assets-content.tsx), y este
// banner solo se monta/desmonta según ese mismo valor. Sin dismiss: el estado
// no lo decide el usuario, se libera solo cuando el ElaborationRun termina.
export function ExternalElaborationLockBanner() {
  const { t } = useTranslation('assets');

  return (
    <div className="border-l-4 border-amber-200 bg-amber-50 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            {t('lifecycle.lockedExternalElaborationNotice.title')}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            {t('lifecycle.lockedExternalElaborationNotice.description')}
          </p>
        </div>
      </div>
    </div>
  );
}
