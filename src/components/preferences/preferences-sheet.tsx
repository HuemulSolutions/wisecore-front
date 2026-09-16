import { SlidersHorizontal, RefreshCw, Eraser } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient, useIsFetching } from "@tanstack/react-query"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulSegmentedControl } from "@/huemul/components/huemul-segmented-control"
import { Switch } from "@/components/ui/switch"
import { useMediaViewMode } from "@/hooks/useMediaViewMode"
import { useLanguagePreference } from "@/hooks/useLanguagePreference"
import { useTreeExpansionStorage, useExternalSystemsExpansionStorage } from "@/hooks/useTreeExpansionStorage"
import { clearMentionTrail } from "@/hooks/useMentionTrailStorage"
import { useOrganization } from "@/contexts/organization-context"
import { userPreferenceQueryKeys } from "@/hooks/useUserPreference"
import type { PreferencesSheetProps } from "@/types/preferences"

/**
 * Sheet de preferencias personales del usuario (idioma, vista de media por
 * defecto, recordar el árbol de /asset) — abierto desde el menú del avatar
 * (`ia context/header-menu-guide.md`: es de la cuenta, no de la
 * organización). Cada control escribe al instante vía `useUserPreference`,
 * sin footer de guardado (`ia context/sheet-footer-batch-save-guide.md`
 * descarta el patrón batch acá).
 */
export function PreferencesSheet({ open, onOpenChange }: PreferencesSheetProps) {
  const { t } = useTranslation("preferences")
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()

  const { language, setLanguage } = useLanguagePreference()
  const [mediaViewMode, setMediaViewMode] = useMediaViewMode()
  const { rememberEnabled, setRememberEnabled, clearExpanded } = useTreeExpansionStorage(selectedOrganizationId)
  const { clearExpanded: clearExternalSystemsExpanded } = useExternalSystemsExpansionStorage(selectedOrganizationId)

  const isFetching = useIsFetching({ queryKey: userPreferenceQueryKeys.all }) > 0
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: userPreferenceQueryKeys.all })
  }

  // Un solo botón, un solo toast: borra las tres superficies que gobierna el
  // switch "recordar" (biblioteca de activos, sistemas externos, trail del
  // popover @ del editor) — ver ia context/arbol-biblioteca-activos-guide.md.
  const handleForgetExpanded = () => {
    clearExpanded()
    clearExternalSystemsExpanded()
    clearMentionTrail(selectedOrganizationId)
    toast.success(t("assetTree.forgetExpandedSuccess"))
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("sheet.title")}
      description={t("sheet.description")}
      icon={SlidersHorizontal}
      showFooter={false}
      size="md"
      headerExtra={
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          icon={RefreshCw}
          tooltip={t("common:refresh")}
          loading={isFetching}
          onClick={handleRefresh}
        />
      }
    >
      <div className="flex flex-col gap-6 p-1">
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t("appearance.title")}
          </h3>
          <div className="rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            <div className="flex items-center justify-between py-2.5 px-3 bg-white">
              <span className="text-sm text-gray-700">{t("appearance.language")}</span>
              <HuemulSegmentedControl
                value={language}
                onChange={setLanguage}
                className="w-auto"
                options={[
                  { value: "es", label: t("appearance.languageSpanish") },
                  { value: "en", label: t("appearance.languageEnglish") },
                ]}
              />
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-white">
              <span className="text-sm text-gray-700">{t("appearance.mediaViewMode")}</span>
              <HuemulSegmentedControl
                value={mediaViewMode}
                onChange={setMediaViewMode}
                className="w-auto"
                options={[
                  { value: "grid", label: t("appearance.mediaViewModeGrid") },
                  { value: "list", label: t("appearance.mediaViewModeList") },
                ]}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t("assetTree.title")}
          </h3>
          <div className="rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            <div className="flex items-center justify-between gap-4 py-2.5 px-3 bg-white">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-gray-700">{t("assetTree.rememberExpanded")}</span>
                <span className="text-xs text-muted-foreground">{t("assetTree.rememberExpandedHint")}</span>
              </div>
              <Switch
                checked={rememberEnabled}
                onCheckedChange={setRememberEnabled}
                className="hover:cursor-pointer shrink-0"
              />
            </div>
            <div className="flex items-center justify-end py-2.5 px-3 bg-white">
              <HuemulButton
                variant="outline"
                size="sm"
                icon={Eraser}
                label={t("assetTree.forgetExpanded")}
                onClick={handleForgetExpanded}
              />
            </div>
          </div>
        </section>
      </div>
    </HuemulSheet>
  )
}
