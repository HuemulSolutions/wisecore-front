import { useTranslation } from "react-i18next"
import { ChevronLeft, RefreshCw, type LucideIcon } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { cn } from "@/lib/utils"

export interface TemplateSettingsPanelHeaderProps {
  /** Chevron a la izquierda del título — vuelve a la lista de grupos de "Configuración". */
  onBack?: () => void
  /** Mismo ícono que la fila del grupo en templates-settings-groups-list.tsx. */
  icon?: LucideIcon
  title: string
  subtitle: string
  /** Omitir para no mostrar refresh (ej. mientras el error de carga reemplaza el resto del header). */
  refresh?: { onClick: () => void; loading: boolean }
  /** Punto de extensión no estandarizado, ej. el HuemulViewToggle de Recursos. Se renderiza antes del refresh. */
  extraActions?: React.ReactNode
  /** Acción principal (Agregar/Subir): siempre con label, siempre visible si el caller la pasa (el caller decide el gate de permiso). */
  primaryAction?: { icon: LucideIcon; label: string; onClick: () => void }
  className?: string
  titleWrapClassName?: string
}

export function TemplateSettingsPanelHeader({
  onBack,
  icon: Icon,
  title,
  subtitle,
  refresh,
  extraActions,
  primaryAction,
  className,
  titleWrapClassName,
}: TemplateSettingsPanelHeaderProps) {
  const { t } = useTranslation(["templates", "common"])

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className={cn("flex items-start gap-2", titleWrapClassName)}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("templates:content.settingsTab")}
            title={t("templates:content.settingsTab")}
            className="mt-0.5 shrink-0 rounded p-0.5 text-[#64748b] hover:cursor-pointer hover:bg-gray-100 hover:text-[#0f172a]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f1f4f7] text-[#475569]">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {extraActions}
        {refresh && (
          <HuemulButton
            variant="ghost"
            size="icon"
            icon={RefreshCw}
            iconClassName="h-3.5 w-3.5"
            tooltip={t("common:refresh")}
            loading={refresh.loading}
            onClick={refresh.onClick}
            className="h-8 w-8"
          />
        )}
        {primaryAction && (
          <HuemulButton
            icon={primaryAction.icon}
            iconClassName="mr-1.5 h-3.5 w-3.5"
            label={primaryAction.label}
            size="sm"
            onClick={primaryAction.onClick}
            className="h-8 text-xs px-3"
          />
        )}
      </div>
    </div>
  )
}
