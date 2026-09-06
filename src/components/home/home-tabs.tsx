import { useTranslation } from 'react-i18next';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HomeWorkGroupCount } from '@/types/home';

// Tabs de texto con subrayado: el `TabsTrigger` base es una pastilla sobre
// fondo gris, así que se neutraliza y el estado activo se dibuja con un
// inset shadow — mismo patrón que ya usa
// `assets-types-config-sheet.tsx:29-31` (ahí con otra paleta, pensada para un
// sheet). No se promueve a un componente huemul compartido todavía: son solo
// 2 usos con contextos visuales distintos — si aparece un tercero, ahí sí.
const TAB_TRIGGER_CLASS =
  'flex-none rounded-none border-0 bg-transparent px-0 pb-2.5 text-[13.5px] font-medium text-[#64748b] shadow-none hover:cursor-pointer hover:text-[#334155] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#0f172a] data-[state=active]:shadow-[inset_0_-2px_0_#2563eb]';

export interface HomeTabsListProps {
  /** `null` = badge omitido (conteo indeterminado, ver spec Punto 2). */
  myWorkCount: HomeWorkGroupCount | null;
  showAllAssetsTab: boolean;
}

export function HomeTabsList({ myWorkCount, showAllAssetsTab }: HomeTabsListProps) {
  const { t } = useTranslation('home');

  return (
    <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-[#e4e8ee] bg-transparent p-0">
      <TabsTrigger value="mine" className={TAB_TRIGGER_CLASS}>
        {t('tabs.myWork')}
        {myWorkCount && (
          <span className="text-[#94a3b8] font-medium">{myWorkCount.exact ? myWorkCount.value : `${myWorkCount.value}+`}</span>
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
