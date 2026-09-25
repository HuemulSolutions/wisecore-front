import { useTranslation } from 'react-i18next';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HomeWorkGroupCount } from '@/types/home';

// Tabs de texto con subrayado: el `TabsTrigger` base es una pastilla sobre
// fondo gris, así que se neutraliza y el estado activo se dibuja con un
// inset shadow — mismo patrón que `HuemulDetailSurface`
// (`huemul-detail-surface.tsx`, ahí con otra paleta y ya compartido por sus
// dos variantes). Esta copia sobrevive porque /home no usa esa superficie y su
// paleta es distinta; si aparece un tercer uso, unificar contra el huemul.
const TAB_TRIGGER_CLASS =
  'flex-none rounded-none border-0 bg-transparent px-0 pb-2.5 text-sm font-medium text-muted-foreground shadow-none hover:cursor-pointer hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_-2px_0_var(--color-primary)]';

export interface HomeTabsListProps {
  /** `null` = badge omitido (conteo indeterminado, ver spec Punto 2). */
  myWorkCount: HomeWorkGroupCount | null;
  showAllAssetsTab: boolean;
}

export function HomeTabsList({ myWorkCount, showAllAssetsTab }: HomeTabsListProps) {
  const { t } = useTranslation('home');

  return (
    <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
      <TabsTrigger value="mine" className={TAB_TRIGGER_CLASS}>
        {t('tabs.myWork')}
        {myWorkCount && (
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-muted-foreground">
            {myWorkCount.exact ? myWorkCount.value : `${myWorkCount.value}+`}
          </span>
        )}
      </TabsTrigger>
      {showAllAssetsTab && (
        <TabsTrigger value="all" className={TAB_TRIGGER_CLASS}>
          {t('tabs.allAssets')}
        </TabsTrigger>
      )}
      <TabsTrigger value="team" className={TAB_TRIGGER_CLASS}>
        {t('tabs.teamActivity')}
      </TabsTrigger>
    </TabsList>
  );
}
