import * as React from "react";
import { useTranslation } from "react-i18next";
import { Edit3, Eye } from "lucide-react";
import { HuemulNumberedStatusCard } from "@/huemul/components/huemul-numbered-status-card";
import { HuemulAnswersStatusBadge } from "@/huemul/components/huemul-answers-status-badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { FormAnswersList } from "@/components/sections/form-answers-list";
import { computeSectionStats, isSectionAnswersCompleted } from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";

interface AssetFormSectionReaderProps {
  section: Pick<ContentSection, "form_fields" | "answers_status">;
  sectionName?: string;
  /** Posición 0-based de la sección en el documento (mismo índice que el tab de contenido). */
  sectionIndex: number;
  /** Muestra el botón de responder en el header de la tarjeta (permiso + formulario editable). */
  canAnswer?: boolean;
  /** La tarjeta está en modo respuesta: renderiza `children` en vez de la lista de solo lectura. */
  isAnswering?: boolean;
  onStartAnswering?: () => void;
  onDoneAnswering?: () => void;
  /** Guardado en curso del flush final — loading/disabled del botón "Dejar de editar". */
  isSaving?: boolean;
  /** Formulario rellenable (AssetFormSection), inyectado por assets-section.tsx. */
  children?: React.ReactNode;
  /** Estado de colapso controlado por assets-section.tsx (incluye el force-open al responder). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Vista de solo lectura de una sección form en el tab de contenido del asset — misma tarjeta
 * numerada + colapsable usada en el resumen de workflow (workflow-sections-summary.tsx), pero
 * expandida inline en vez de abrir un sheet. Reemplaza al stack plano de AssetFormSection con
 * canInteract={false} cuando la sección está fuera de modo editor (ver assets-section.tsx).
 *
 * Con `canAnswer`, agrega un botón "Responder" que activa `isAnswering`: la tarjeta renderiza
 * `children` (AssetFormSection rellenable) en vez de FormAnswersList, sin salir del modo lector
 * del asset — atajo para no tener que cambiar a modo editor solo para completar un formulario.
 *
 * `open`/`onOpenChange` son controlados: el estado de colapso (incluido el force-open al entrar
 * en modo respuesta) vive en assets-section.tsx, junto con el de las secciones no-form.
 */
export function AssetFormSectionReader({
  section,
  sectionName,
  sectionIndex,
  canAnswer = false,
  isAnswering = false,
  onStartAnswering,
  onDoneAnswering,
  isSaving = false,
  children,
  open,
  onOpenChange,
}: AssetFormSectionReaderProps) {
  const { t } = useTranslation(["sections", "common"]);

  const { fields, questions, answeredCount } = computeSectionStats(section as ContentSection);

  const actions = canAnswer ? (
    isAnswering ? (
      <HuemulButton
        variant="outline"
        size="xs"
        icon={Eye}
        loading={isSaving}
        disabled={isSaving}
        label={isSaving ? t("common:saving") : t("form.fill.doneEditing")}
        onClick={onDoneAnswering}
      />
    ) : (
      <HuemulButton
        variant="outline"
        size="xs"
        icon={Edit3}
        label={answeredCount > 0 ? t("form.fill.editResponses") : t("form.fill.answer")}
        onClick={onStartAnswering}
      />
    )
  ) : undefined;

  return (
    <div className="not-prose py-3 pr-2 w-full">
      <HuemulNumberedStatusCard
        collapsible
        open={open}
        onOpenChange={onOpenChange}
        number={sectionIndex + 1}
        title={sectionName ?? ""}
        tone={isSectionAnswersCompleted(section) ? "success" : "warning"}
        headerExtra={<HuemulAnswersStatusBadge status={section.answers_status} />}
        subtitle={t("form.fill.answeredCount", { answered: answeredCount, total: questions.length })}
        actions={actions}
      >
        {isAnswering && children ? children : <FormAnswersList fields={fields} emptyLabel={t("form.fill.emptyForm")} />}
      </HuemulNumberedStatusCard>
    </div>
  );
}
