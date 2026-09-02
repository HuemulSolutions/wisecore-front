"use client"

import { ArrowRight, Clock, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { HuemulButton } from "@/huemul/components/huemul-button"

interface WorkflowSavedLaterCardProps {
  /** Vuelve al wizard, en el mismo paso donde estaba (el panel nunca se desmonta). */
  onKeepGoing: () => void
  /** Ausente cuando no se conoce el template de origen (link de ejecución compartido directo). */
  onStartAnother?: () => void
}

/**
 * Tarjeta terminal que confirma el autoguardado tras "Continuar más tarde" (ver
 * `onContinueLater` en WorkflowDetailPanel). Puramente visual — no dispara ningún
 * guardado, ya lo hizo el autoguardado del formulario. Solo la usa la vista
 * fullscreen compartida (workflow-fill.tsx): es reversible ("Seguir completando"),
 * a diferencia de la pantalla terminal automática que prohíbe
 * ia context/fullscreen-share-route-guide.md.
 */
export function WorkflowSavedLaterCard({ onKeepGoing, onStartAnother }: WorkflowSavedLaterCardProps) {
  const { t } = useTranslation("workflow")

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{t("fill.savedTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("fill.savedDescription")}</p>
          </div>
          <div className="flex w-full flex-col gap-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">{t("fill.savedNeedMore")}</p>
            <HuemulButton
              variant="outline"
              icon={ArrowRight}
              iconPosition="left"
              label={t("fill.savedKeepGoing")}
              className="w-full"
              onClick={onKeepGoing}
            />
            {onStartAnother && (
              <HuemulButton
                variant="outline"
                icon={Plus}
                iconPosition="left"
                label={t("fill.savedStartAnother")}
                className="w-full"
                onClick={onStartAnother}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
