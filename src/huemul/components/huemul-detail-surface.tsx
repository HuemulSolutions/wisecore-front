"use client"

import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulPanelDirtyBadge, HuemulPanelSaveBar } from "@/huemul/components/huemul-panel-save-bar"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { contentWidthClass } from "@/huemul/constants"
import { cn } from "@/lib/utils"
import type { HuemulDetailSurfaceProps } from "@/types/huemul"

export type {
  HuemulDetailSurfaceProps,
  HuemulDetailSurfaceVariant,
  HuemulDetailSurfaceTab,
  HuemulDetailSurfaceSaveBar,
  HuemulDetailSurfaceBackAction,
  HuemulContentWidth,
  HuemulContentAlign,
} from "@/types/huemul"

/**
 * Tabs de texto con subrayado: el `TabsTrigger` base es una pastilla sobre fondo
 * gris, así que se neutraliza y el estado activo se dibuja con un inset shadow.
 * Movido desde `assets-types-config-sheet.tsx`, que era su única definición.
 */
const TAB_TRIGGER_CLASS =
  "flex-none rounded-none border-0 bg-transparent px-0 pb-2.5 text-[13px] font-medium text-[#64748b] shadow-none hover:cursor-pointer hover:text-[#334155] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#1d4ed8] data-[state=active]:shadow-[inset_0_-2px_0_#1d4ed8]"

/**
 * Superficie de detalle: una misma pieza de contenido montada como **página
 * completa** o como **sheet ancho**, según `variant`.
 *
 * Resuelve de una sola vez el chrome que antes se rearmaba a mano en cada
 * pantalla: identidad (ícono + título + subtítulo), barra de tabs, botón de
 * volver, refresh y zona de guardado. Precedentes que motivaron extraerlo:
 * `stepPanelSurface` en `assets-types-lifecycle-dialog.tsx` (dos ramas de JSX
 * completas) y `variant: "panel" | "fullscreen"` en `workflow-detail-panel.tsx`.
 *
 * Es un contenedor **sin dominio**: no consulta permisos, no pega al backend y
 * no conoce ninguna entidad. Todo el texto entra por props (la única traducción
 * propia es el tooltip del refresh, de `common`). El estado del tab y el guard
 * de cambios sin guardar viven en el consumidor.
 */
export function HuemulDetailSurface({
  variant = "sheet",
  icon: Icon,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  backAction,
  onRefresh,
  isRefreshing = false,
  saveBar,
  footerContent,
  closeLabel,
  open = false,
  onOpenChange,
  size = "wide",
  className,
  bodyClassName,
  children,
}: HuemulDetailSurfaceProps) {
  const { t } = useTranslation("common")
  const isPage = variant === "page"
  const hasTabs = !!tabs && tabs.length > 0

  const refreshButton = onRefresh ? (
    <HuemulButton
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      icon={RefreshCw}
      tooltip={t("refresh")}
      loading={isRefreshing}
      onClick={onRefresh}
    />
  ) : null

  const body = hasTabs ? (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      // En sheet el `-mx-6` cancela el padding del body para que el borde
      // inferior de la barra de tabs llegue a los extremos; en página la
      // columna no trae padding propio, así que no hace falta compensar.
      className={cn("flex h-full min-h-0 flex-col", !isPage && "-mx-6")}
    >
      <div className={cn("flex items-center gap-2", isPage ? "px-4 md:px-6" : "px-6")}>
        <TabsList className="h-auto flex-1 justify-start gap-6 rounded-none border-b border-[#e9edf2] bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className={TAB_TRIGGER_CLASS}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* En página el refresh ya vive en el PageHeader (ver
            ia context/refresh-button-guide.md §2 vs §3). */}
        {!isPage && refreshButton}
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className={tab.className}>
          {/* El wrapper de ancho se monta SOLO si el tab declara un límite: un
              div incondicional rompería los tabs cuyo contenido cuenta con ser
              hijo flex directo del TabsContent (`data-[state=active]:flex`). */}
          {tab.contentWidth && tab.contentWidth !== "full" ? (
            <div className={contentWidthClass(tab.contentWidth, tab.contentAlign)}>
              {tab.content}
            </div>
          ) : (
            tab.content
          )}
        </TabsContent>
      ))}
    </Tabs>
  ) : (
    children
  )

  // El footer a medida gana sobre `saveBar`; en página la barra se monta en el
  // slot `footer` de la columna (strip `shrink-0`), así que no necesita sticky.
  const footerNode =
    footerContent ??
    (saveBar ? (
      <HuemulPanelSaveBar
        isDirty={saveBar.isDirty}
        canSave={saveBar.canSave}
        isSaving={saveBar.isSaving}
        dirtyLabel={saveBar.dirtyLabel}
        saveLabel={saveBar.saveLabel}
        discardLabel={saveBar.discardLabel}
        onSave={saveBar.onSave}
        onDiscard={saveBar.onDiscard}
      />
    ) : null)

  if (isPage) {
    return (
      <HuemulPageLayout
        className={className}
        header={
          <PageHeader
            icon={Icon}
            title={title}
            subtitle={subtitle}
            backAction={backAction}
            onRefresh={onRefresh}
            isLoading={isRefreshing}
            // Con tabs, el separador lo pone la barra de tabs: el `mb-6` por
            // defecto dejaría el título flotando lejos de ella. Mismo aire que
            // el `pb-3` de `HomeHeader`, el otro header con tabs debajo.
            className={hasTabs ? "mb-3" : undefined}
          />
        }
        // `border-b-0` apaga la línea fija del header del layout cuando la
        // barra de tabs ya dibuja la suya — misma razón que el
        // `hideHeaderBorder` de la variante sheet, más abajo. Sin tabs se
        // conserva el look estándar del repo (línea del header + `mb-6`).
        // El padding horizontal coincide con el de la fila de tabs, así el
        // subrayado del tab activo cae en la misma columna que el título.
        headerClassName={cn(
          "px-4 md:px-6 pt-4 md:pt-6 pb-0",
          hasTabs && "border-b-0",
        )}
        columns={[
          {
            content: body,
            className: cn("flex min-h-0 flex-col", bodyClassName),
            footer: footerNode
              ? { content: footerNode, className: "px-4 md:px-6 pb-4" }
              : undefined,
          },
        ]}
      />
    )
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange ?? (() => {})}
      title={title}
      description={subtitle}
      icon={Icon}
      iconVariant="tile"
      size={size}
      // La barra de tabs ya dibuja su propio `border-b`: sin esto queda doble.
      // La variante página apaga el mismo borde por la misma razón, con
      // `border-b-0` en su `headerClassName` — mantener las dos a la par.
      hideHeaderBorder={hasTabs}
      className={className}
      bodyClassName={cn("flex flex-col overflow-hidden py-0 [scrollbar-gutter:auto]", bodyClassName)}
      {...(footerContent
        ? { footerContent }
        : saveBar
          ? {
              showFooter: true,
              cancelLabel: closeLabel,
              footerLeft:
                saveBar.isDirty && saveBar.dirtyLabel ? (
                  <HuemulPanelDirtyBadge label={saveBar.dirtyLabel} />
                ) : undefined,
              saveAction: {
                label: saveBar.saveLabel,
                onClick: saveBar.onSave,
                disabled: saveBar.canSave === undefined ? !saveBar.isDirty : !saveBar.canSave,
                loading: saveBar.isSaving,
                closeOnSuccess: false,
              },
            }
          // Sin nada que guardar pero con `closeLabel`, el footer queda con
          // solo el botón de cerrar (caso "tab de lectura" del consumidor).
          : closeLabel
            ? { showFooter: true, cancelLabel: closeLabel }
            : { showFooter: false })}
      onOpenAutoFocus={
        hasTabs
          ? (e) => {
              // Radix enfoca el primer tab al montar y su focus-visible ring
              // queda dibujado como si el tab estuviera "en caja". Se mantiene
              // el foco dentro del sheet sin marcar ningún trigger.
              e.preventDefault()
              ;(e.currentTarget as HTMLElement | null)?.focus()
            }
          : undefined
      }
    >
      {body}
    </HuemulSheet>
  )
}
