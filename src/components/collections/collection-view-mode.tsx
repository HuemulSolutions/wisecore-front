"use client"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BookOpen, Eye, Link2, Pencil, type LucideIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HuemulButton } from "@/huemul/components/huemul-button"

/**
 * Cómo se ve una colección (valor interno → nombre en pantalla → valor en la URL):
 * - `edit` → Diseño → `design`: la colección se administra (solo quien la administra).
 * - `reader` → Elaborador → `author`: la colección sin edición; cada activo con los permisos de siempre.
 * - `view_only` → Consulta → `consult`: además, los activos sin ninguna acción de edición.
 */
export type CollectionViewMode = "edit" | "reader" | "view_only"

const URL_VALUES: Record<CollectionViewMode, string> = { edit: "design", reader: "author", view_only: "consult" }

/**
 * El modo de `?view=`. Diseño solo vale para quien administra; sin modo (o con Diseño sin
 * administrar), quien administra entra en Diseño y el resto en Consulta. `reader` y `view_only`
 * son los valores de los primeros links.
 */
export function resolveViewMode(viewParam: string | null, canAdmin: boolean): CollectionViewMode {
  if (viewParam === "author" || viewParam === "reader") return "reader"
  if (viewParam === "consult" || viewParam === "view_only") return "view_only"
  return canAdmin ? "edit" : "view_only"
}

/** Valor de `?view=` para un modo: la URL siempre lo lleva, así se puede compartir tal cual. */
export function viewModeParam(mode: CollectionViewMode): string {
  return URL_VALUES[mode]
}

/** La URL de lo que se está viendo (colección e ítem) en otro modo, para copiarla. */
export function buildCollectionModeUrl(href: string, mode: CollectionViewMode): string {
  const url = new URL(href)
  url.searchParams.set("view", viewModeParam(mode))
  return url.toString()
}

export function useViewModeOptions(canAdmin: boolean): { value: CollectionViewMode; icon: LucideIcon; label: string; hint: string }[] {
  const { t } = useTranslation("collections")
  return [
    ...(canAdmin
      ? [{ value: "edit" as const, icon: Pencil, label: t("detail.viewModes.edit"), hint: t("detail.viewModes.editHint") }]
      : []),
    { value: "reader" as const, icon: BookOpen, label: t("detail.viewModes.reader"), hint: t("detail.viewModes.readerHint") },
    { value: "view_only" as const, icon: Eye, label: t("detail.viewModes.viewOnly"), hint: t("detail.viewModes.viewOnlyHint") },
  ]
}

/**
 * Copiar el link de lo que se está viendo en un modo, por ejemplo para una intranet. Se ve en
 * todos los modos; quien administra comparte también Diseño, el resto elige entre Elaborador y
 * Consulta. Quien abre el link igual inicia sesión y necesita poder leer la colección; un link de
 * Diseño a quien no la administra se abre en Consulta.
 */
export function CopyModeLinkButton({ canAdmin }: { canAdmin: boolean }) {
  const { t } = useTranslation("collections")
  const options = useViewModeOptions(canAdmin)
  const copy = (mode: CollectionViewMode, label: string) => {
    navigator.clipboard.writeText(buildCollectionModeUrl(window.location.href, mode)).then(() => {
      toast.success(t("detail.linkCopied", { mode: label }))
    })
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HuemulButton
          variant="ghost"
          size="icon"
          className="size-6"
          icon={Link2}
          aria-label={t("detail.copyLink")}
          tooltip={t("detail.copyLink")}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t("detail.copyLinkAs")}</DropdownMenuLabel>
        {options.map(({ value, icon: Icon, label, hint }) => (
          <DropdownMenuItem key={value} className="hover:cursor-pointer" title={hint} onSelect={() => copy(value, label)}>
            <Icon className="size-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Los modos como opciones del menú ⋯ de la cabecera. */
export function ViewModeMenuItems({
  mode,
  canAdmin,
  onChange,
}: {
  mode: CollectionViewMode
  canAdmin: boolean
  onChange: (mode: CollectionViewMode) => void
}) {
  const { t } = useTranslation("collections")
  const options = useViewModeOptions(canAdmin)
  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">{t("detail.viewModes.label")}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={mode} onValueChange={(value) => onChange(value as CollectionViewMode)}>
        {options.map(({ value, icon: Icon, label, hint }) => (
          <DropdownMenuRadioItem key={value} value={value} className="items-start hover:cursor-pointer" title={hint}>
            <Icon className="mt-0.5 size-4" />
            <span className="flex flex-col">
              <span>{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  )
}
