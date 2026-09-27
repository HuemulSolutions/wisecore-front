import * as React from "react";
import type { ContentSection } from "@/types/assets";

export type WorkflowPanelView = "summary" | "section";

export interface UseWorkflowPanelViewOptions {
  formSections: ContentSection[];
  /** Cambia (fila u origen distintos) → reinicia la vista. Ver el efecto de reset del panel
   *  original (workflow-detail-panel.tsx:169-174), del que este valor es la dependencia. */
  resetKey: string | undefined;
  /** Express recién iniciado: entra directo a la sección 1 en vez del resumen — el resumen de
   *  un documento recién creado es una lista de tarjetas todas vacías, un paso muerto. */
  startInSection: boolean;
}

export interface UseWorkflowPanelViewResult {
  view: WorkflowPanelView;
  activeSectionIndex: number;
  activeSection: ContentSection | undefined;
  isFirstSection: boolean;
  isLastSection: boolean;
  /** Abre la vista 2 en ese índice de formSections. Estable (la consume useLifecycleActions). */
  openSection: (index: number) => void;
  /** Vuelve a la vista 1 sin perder el índice (reingreso siempre explícito). Estable. */
  goToSummary: () => void;
  goNextSection: () => void;
  goPrevSection: () => void;
}

/**
 * Dueño de la navegación interna del panel: `view` ("summary" | "section") + el índice de la
 * sección activa en formSections. Reemplaza el `step: number | null` del wizard original —
 * `step === null` equivale a `view !== "section"`.
 */
export function useWorkflowPanelView({
  formSections,
  resetKey,
  startInSection,
}: UseWorkflowPanelViewOptions): UseWorkflowPanelViewResult {
  const [view, setView] = React.useState<WorkflowPanelView>(startInSection ? "section" : "summary");
  const [activeSectionIndex, setActiveSectionIndex] = React.useState(startInSection ? 0 : -1);

  // Reinicia al cambiar de origen (otra fila u otro template) — mismo trigger que el efecto de
  // reset original (workflow-detail-panel.tsx:169-174).
  React.useEffect(() => {
    setView(startInSection ? "section" : "summary");
    setActiveSectionIndex(startInSection ? 0 : -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Reanclaje por id (traducción 1:1 de workflow-detail-panel.tsx:229-243): si formSections
  // cambia de largo/orden mientras se responde (un depends_on activa/desactiva secciones), el
  // índice numérico de la sección activa puede quedar apuntando a la sección equivocada o fuera
  // de rango. Se ancla comparando contra la lista anterior por id.
  const prevFormSectionsRef = React.useRef(formSections);
  React.useEffect(() => {
    const prevSections = prevFormSectionsRef.current;
    prevFormSectionsRef.current = formSections;
    if (prevSections === formSections || view !== "section") return;
    const anchorId = prevSections[activeSectionIndex]?.id;
    const anchoredIndex = anchorId ? formSections.findIndex((s) => s.id === anchorId) : -1;
    if (anchoredIndex !== -1) {
      if (anchoredIndex !== activeSectionIndex) setActiveSectionIndex(anchoredIndex);
      return;
    }
    if (formSections.length === 0) {
      setView("summary");
      return;
    }
    const fallback = Math.min(activeSectionIndex, formSections.length - 1);
    if (fallback !== activeSectionIndex) setActiveSectionIndex(fallback);
  }, [formSections, view, activeSectionIndex]);

  const openSection = React.useCallback((index: number) => {
    setActiveSectionIndex(index);
    setView("section");
  }, []);

  const goToSummary = React.useCallback(() => {
    setView("summary");
  }, []);

  const goNextSection = React.useCallback(() => {
    setActiveSectionIndex((i) => i + 1);
  }, []);

  const goPrevSection = React.useCallback(() => {
    setActiveSectionIndex((i) => Math.max(0, i - 1));
  }, []);

  const activeSection = view === "section" ? formSections[activeSectionIndex] : undefined;
  const isLastSection = view === "section" && activeSectionIndex >= formSections.length - 1;
  const isFirstSection = activeSectionIndex <= 0;

  return {
    view,
    activeSectionIndex,
    activeSection,
    isFirstSection,
    isLastSection,
    openSection,
    goToSummary,
    goNextSection,
    goPrevSection,
  };
}
