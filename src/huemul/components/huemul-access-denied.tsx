"use client"

import { ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { HuemulAccessDeniedProps } from "@/types/huemul"
export type { HuemulAccessDeniedProps } from "@/types/huemul"

/**
 * Bloque de "acceso denegado" reutilizable para páginas y paneles/tabs que
 * detectan que el usuario no tiene ningún permiso sobre el recurso mostrado.
 *
 * Reemplaza las implementaciones ad-hoc equivalentes (ej. canvas-page-empty-state,
 * diagrams-page-empty-state, roles-access-denied, etc.) — ver
 * ia context/rbac-permissions-guide.md.
 */
export function HuemulAccessDenied({
  title,
  description,
  variant = "page",
  icon: Icon = ShieldAlert,
  action,
  className,
}: HuemulAccessDeniedProps) {
  const { t } = useTranslation("common")

  const content = (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Icon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium">{title ?? t("accessDenied")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? t("noPermission")}
        </p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  )

  if (variant === "inline") {
    return (
      <div className={cn("flex h-full items-center justify-center p-6", className)}>
        <div className="w-full max-w-md">{content}</div>
      </div>
    )
  }

  return (
    <div className={cn("bg-background p-6 md:p-8", className)}>
      <div className="mx-auto max-w-md">{content}</div>
    </div>
  )
}
