import * as React from "react";
import { useTranslation } from "react-i18next";
import { Eye, History } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { SUMMARY_ACTION_BUTTON_CLASS, SUMMARY_ACTION_STYLES } from "@/components/workflow/workflow-summary-styles";
import { cn } from "@/lib/utils";
import { FormSectionSummaryCard, type FormSectionSummarySource } from "@/components/sections/form-section-summary-card";

interface AssetFormSectionReaderProps {
  section: FormSectionSummarySource;
  /** Nombre a mostrar; si se omite usa `section.section_name`. */
  sectionName?: string;
  /** Posición 0-based de la sección en el documento (mismo índice que el tab de contenido). */
  sectionIndex: number;
  /** Muestra el botón de responder en el pie de la tarjeta (permiso + formulario editable). */
  canAnswer?: boolean;
  /** La tarjeta está en modo respuesta: renderiza `children` en vez de la lista de solo lectura. */
  isAnswering?: boolean;
  onStartAnswering?: () => void;
  onDoneAnswering?: () => void;
  /** Guardado en curso del flush final — loading/disabled del botón "Dejar de editar". */
  isSaving?: boolean;
  /** Abre el sheet de historial de la sección — visible siempre, independiente de canAnswer. */
  onOpenHistory?: () => void;
  /** Formulario rellenable (AssetFormSection), inyectado por assets-section.tsx. */
  children?: React.ReactNode;
  /** Estado de colapso controlado por assets-section.tsx (incluye el force-open al responder). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Vista de solo lectura de una sección form en el tab de contenido del asset — misma tarjeta
 * que el resumen de workflow (FormSectionSummaryCard), expandida inline en vez de abrir un
 * sheet. Reemplaza al stack plano de AssetFormSection con canInteract={false} cuando la sección
 * está fuera de modo editor (ver assets-section.tsx).
 *
 * Con `canAnswer`, el botón del pie (Responder/Editar) activa `isAnswering`: la tarjeta
 * renderiza `children` (AssetFormSection rellenable) en vez de la lista de respuestas, sin salir
 * del modo lector del asset — atajo para no tener que cambiar a modo editor solo para completar
 * un formulario. Sin `canAnswer` no hay botón en el pie: la tarjeta se expande con el chevron.
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
  onOpenHistory,
  children,
  open,
  onOpenChange,
}: AssetFormSectionReaderProps) {
  const { t } = useTranslation(["sections", "common", "assets"]);

  const doneAction = isAnswering ? (
    <HuemulButton
      variant="outline"
      size="sm"
      icon={Eye}
      iconPosition="right"
      iconClassName="h-[13px] w-[13px]"
      className={cn(SUMMARY_ACTION_BUTTON_CLASS, SUMMARY_ACTION_STYLES.edit)}
      loading={isSaving}
      disabled={isSaving}
      label={isSaving ? t("common:saving") : t("sections:form.fill.doneEditing")}
      onClick={onDoneAnswering}
    />
  ) : undefined;

  const historyAction = onOpenHistory ? (
    <HuemulButton
      variant="ghost"
      size="xs"
      icon={History}
      tooltip={t("assets:section.viewHistory")}
      onClick={onOpenHistory}
    />
  ) : undefined;

  return (
    <div className="not-prose py-3 pr-2 w-full">
      <FormSectionSummaryCard
        section={sectionName ? { ...section, section_name: sectionName } : section}
        index={sectionIndex + 1}
        canAnswer={canAnswer}
        open={open}
        onOpenChange={onOpenChange}
        onAction={canAnswer ? () => onStartAnswering?.() : () => onOpenChange(true)}
        footerAction={doneAction}
        headerActions={historyAction}
      >
        {isAnswering && children ? children : undefined}
      </FormSectionSummaryCard>
    </div>
  );
}
