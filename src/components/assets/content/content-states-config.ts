import type { TFunction } from 'i18next';
import type { LifecyclePermissions } from '@/types/assets';
import type { LifecyclePhase } from '@/types/lifecycle';
import type { ScreenStateAction, ScreenStateConfig, ScreenStateItem } from '@/types/huemul';
import type { ContentState } from './content-state';

type SectionKind = 'ai' | 'manual' | 'reference' | 'form';

export interface ContentStateSection {
  name: string;
  type?: SectionKind;
  /** Resultado de la última corrida (runFailed). */
  runStatus?: 'done' | 'failed' | 'pending';
  /** La sección de IA no puede generarse por falta de contexto (emptyWithSections). */
  missingContext?: boolean;
}

/** Datos dinámicos que el mapa de textos necesita para armar cada estado. */
export interface ContentStatesContext {
  sections: ContentStateSection[];
  importFileName?: string | null;
  failureMessage?: string | null;
  isMissingDependencyFailure: boolean;
  /** Fases del ciclo de vida (si el usuario puede leerlas) y etapa actual (`LifecycleStatus.stage`). */
  phases: LifecyclePhase[];
  stage?: string | null;
}

/** Acciones reales de la pantalla. Una acción `undefined` no se muestra (sin permiso o sin flujo). */
export interface ContentStatesHandlers {
  retryLoad: () => void | Promise<unknown>;
  isRetryingLoad: boolean;
  backToAssets: () => void;
  retryGeneration: () => void | Promise<unknown>;
  isGenerating: boolean;
  canGenerate: boolean;
  cannotGenerateReason?: string;
  editSections: () => void;
  addSections: () => void;
  startGeneration: () => void | Promise<unknown>;
  /** Solo cuando falta contexto y el usuario puede abrir Fuentes. */
  configureContext?: () => void;
  uploadAnotherFile?: () => void;
  startWithoutImport: () => void;
  useTemplate?: () => void;
  /** Permisos de ciclo de vida del documento, para el gating de los botones. */
  lifecyclePermissions?: LifecyclePermissions;
}

const EMPTY_STATE: ScreenStateConfig = { title: '', text: '', cardTitle: '', cardSub: '' };

const MAX_LISTED_SECTIONS = 4;

const sectionAccess = (lifecyclePermissions?: LifecyclePermissions): ScreenStateAction['access'] => ({
  requiredAccess: ['edit', 'create'],
  resource: 'section',
  lifecyclePermissions,
});

const versionAccess = (lifecyclePermissions?: LifecyclePermissions): ScreenStateAction['access'] => ({
  requiredAccess: ['create'],
  resource: 'version',
  lifecyclePermissions,
});

function compact<T>(items: (T | undefined | false)[]): T[] {
  return items.filter((item): item is T => !!item);
}

/** Estado sin activo seleccionado: qué es un activo, cómo se elige desde Conocimiento y qué se ve al abrirlo. */
export function buildNoSelectionState(t: TFunction): ScreenStateConfig {
  const k = (key: string) => t(`contentStates.noSelection.${key}`);
  return {
    title: k('title'),
    text: k('text'),
    cardTitle: k('cardTitle'),
    cardSub: k('cardSub'),
    steps: [
      { n: '1', title: k('step1Title'), text: k('step1Text'), active: true },
      { n: '2', title: k('step2Title'), text: k('step2Text') },
      { n: '3', title: k('step3Title'), text: k('step3Text') },
    ],
    mini: {
      title: k('miniTitle'),
      items: [1, 2, 3].map((i) => ({ t: k(`mini${i}Title`), d: k(`mini${i}Text`) })),
    },
  };
}

/**
 * Mapa de textos y acciones de cada estado del contenido central. Los textos viven en
 * `assets:contentStates.*`; acá solo se arma la configuración que consume `HuemulScreenState`.
 * `ready`, `loading` y `generating` no usan ScreenState (los renderiza `AssetContentStates`).
 */
export function buildContentStates(
  t: TFunction,
  ctx: ContentStatesContext,
  h: ContentStatesHandlers,
): Record<ContentState, ScreenStateConfig> {
  const k = (key: string) => t(`contentStates.${key}`);
  const num = (index: number) => String(index + 1);

  const typeLabel = (type?: SectionKind) => {
    switch (type) {
      case 'ai':
        return k('emptyNoSections.mini2Title');
      case 'reference':
        return k('emptyNoSections.mini3Title');
      case 'form':
        return k('emptyNoSections.mini4Title');
      case 'manual':
        return k('emptyNoSections.mini1Title');
      default:
        return '';
    }
  };

  const mini = (group: string, count = 3) => ({
    title: k(`${group}.miniTitle`),
    items: Array.from({ length: count }, (_, i) => ({
      t: k(`${group}.mini${i + 1}Title`),
      d: k(`${group}.mini${i + 1}Text`),
    })),
  });

  // ── restricted: etapas del ciclo de vida con la actual activa ────────────
  const restrictedSteps = (): ScreenStateConfig['steps'] => {
    if (ctx.phases.length > 0) {
      return ctx.phases.map((phase, i) => ({
        n: num(i),
        title: phase.label,
        text: k(
          phase.state === 'current'
            ? 'restricted.stepCurrent'
            : phase.state === 'done'
              ? 'restricted.stepDone'
              : 'restricted.stepUpcoming',
        ),
        active: phase.state === 'current',
      }));
    }
    const fallback = [
      { stage: 'edit', label: k('restricted.fallbackEdit') },
      { stage: 'review', label: k('restricted.fallbackReview') },
      { stage: 'approve', label: k('restricted.fallbackApprove') },
    ];
    const currentIndex = Math.max(
      0,
      fallback.findIndex((step) => step.stage === ctx.stage),
    );
    return fallback.map((step, i) => ({
      n: num(i),
      title: step.label,
      text: k(i === currentIndex ? 'restricted.stepCurrent' : i < currentIndex ? 'restricted.stepDone' : 'restricted.stepUpcoming'),
      active: i === currentIndex,
    }));
  };

  // ── runFailed: resultado por sección ─────────────────────────────────────
  // Solo las secciones con resultado conocido de la corrida; sin datos no se inventa una lista.
  const runItems: ScreenStateItem[] = ctx.sections
    .filter((section) => section.runStatus)
    .slice(0, 12)
    .map((section, i) => ({
    n: num(i),
    name: section.name,
    type: typeLabel(section.type),
    status: k(
      section.runStatus === 'failed'
        ? 'runFailed.statusFailed'
        : section.runStatus === 'done'
          ? 'runFailed.statusDone'
          : 'runFailed.statusPending',
    ),
    tone: section.runStatus === 'failed' ? 'error' : section.runStatus === 'done' ? 'ok' : 'warn',
  }));

  // ── emptyWithSections: hasta 4 secciones con su estado ───────────────────
  const listed = ctx.sections.slice(0, MAX_LISTED_SECTIONS);
  const hiddenCount = ctx.sections.length - listed.length;
  const readyItems: ScreenStateItem[] = listed.map((section, i) => ({
    n: num(i),
    name: section.name,
    type: typeLabel(section.type),
    status: k(section.missingContext ? 'emptyWithSections.statusMissingContext' : 'emptyWithSections.statusReady'),
    tone: section.missingContext ? 'warn' : 'ok',
  }));

  const importCause = ctx.failureMessage?.trim() || k('importFailed.defaultCause');

  return {
    ready: EMPTY_STATE,
    loading: EMPTY_STATE,
    generating: EMPTY_STATE,

    error: {
      title: k('error.title'),
      text: k('error.text'),
      cardTitle: k('error.cardTitle'),
      cardSub: k('error.cardSub'),
      steps: [
        {
          n: '1',
          title: k('error.step1Title'),
          text: k('error.step1Text'),
          active: true,
          action: { label: k('actions.retry'), onClick: h.retryLoad, loading: h.isRetryingLoad },
        },
        { n: '2', title: k('error.step2Title'), text: k('error.step2Text') },
        { n: '3', title: k('error.step3Title'), text: k('error.step3Text') },
      ],
      mini: mini('error'),
      actions: [{ label: k('actions.backToAssets'), onClick: h.backToAssets }],
    },

    restricted: {
      title: k('restricted.title'),
      text: k('restricted.text'),
      cardTitle: k('restricted.cardTitle'),
      cardSub: k('restricted.cardSub'),
      steps: restrictedSteps(),
      mini: mini('restricted'),
      actions: [{ label: k('actions.backToAssets'), onClick: h.backToAssets }],
    },

    runFailed: {
      title: k('runFailed.title'),
      text: ctx.isMissingDependencyFailure ? k('runFailed.textMissingDependency') : k('runFailed.text'),
      cardTitle: k('runFailed.cardTitle'),
      cardSub: k('runFailed.cardSub'),
      items: runItems.length > 0 ? runItems : undefined,
      itemsAction: {
        label: k('actions.retryGeneration'),
        onClick: h.retryGeneration,
        loading: h.isGenerating,
        disabled: !h.canGenerate,
        title: h.canGenerate ? undefined : h.cannotGenerateReason,
        access: versionAccess(h.lifecyclePermissions),
      },
      mini: mini('runFailed'),
      actions: [
        {
          label: k('actions.editSections'),
          onClick: h.editSections,
          access: sectionAccess(h.lifecyclePermissions),
        },
      ],
    },

    importFailed: {
      title: k('importFailed.title'),
      text: ctx.importFileName
        ? t('contentStates.importFailed.textWithFile', { file: ctx.importFileName, cause: importCause })
        : importCause,
      cardTitle: k('importFailed.cardTitle'),
      cardSub: k('importFailed.cardSub'),
      steps: [
        { n: '1', title: k('importFailed.step1Title'), text: k('importFailed.step1Text') },
        { n: '2', title: k('importFailed.step2Title'), text: k('importFailed.step2Text') },
        {
          n: '3',
          title: k('importFailed.step3Title'),
          text: k('importFailed.step3Text'),
          active: true,
          action: h.uploadAnotherFile ? { label: k('actions.uploadAnotherFile'), onClick: h.uploadAnotherFile } : undefined,
        },
      ],
      mini: mini('importFailed'),
      actions: [
        {
          label: k('actions.startWithoutImport'),
          onClick: h.startWithoutImport,
          access: sectionAccess(h.lifecyclePermissions),
        },
      ],
    },

    emptyNoSections: {
      title: k('emptyNoSections.title'),
      text: k('emptyNoSections.text'),
      cardTitle: k('emptyNoSections.cardTitle'),
      cardSub: k('emptyNoSections.cardSub'),
      steps: [
        {
          n: '1',
          title: k('emptyNoSections.step1Title'),
          text: k('emptyNoSections.step1Text'),
          active: true,
          action: { label: k('actions.addSections'), onClick: h.addSections, access: sectionAccess(h.lifecyclePermissions) },
        },
        { n: '2', title: k('emptyNoSections.step2Title'), text: k('emptyNoSections.step2Text') },
        { n: '3', title: k('emptyNoSections.step3Title'), text: k('emptyNoSections.step3Text') },
      ],
      mini: mini('emptyNoSections', 4),
      actions: compact([h.useTemplate && { label: k('actions.useTemplate'), onClick: h.useTemplate }]),
    },

    emptyWithSections: {
      title: k('emptyWithSections.title'),
      text: h.canGenerate ? k('emptyWithSections.text') : (h.cannotGenerateReason ?? k('emptyWithSections.text')),
      cardTitle: k('emptyWithSections.cardTitle'),
      cardSub:
        hiddenCount > 0
          ? t('contentStates.emptyWithSections.moreSections', { count: hiddenCount })
          : k('emptyWithSections.cardSub'),
      items: readyItems,
      itemsAction: {
        label: k('actions.startGeneration'),
        onClick: h.startGeneration,
        loading: h.isGenerating,
        disabled: !h.canGenerate,
        title: h.canGenerate ? undefined : h.cannotGenerateReason,
        access: versionAccess(h.lifecyclePermissions),
      },
      mini: mini('emptyWithSections'),
      actions: compact([
        h.configureContext && { label: k('actions.configureContext'), onClick: h.configureContext },
        {
          label: k('actions.addMoreSections'),
          onClick: h.addSections,
          access: sectionAccess(h.lifecyclePermissions),
        },
      ]),
    },

    noSelection: buildNoSelectionState(t),
  };
}
