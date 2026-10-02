import { describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { CONTENT_STATE_VALUES } from './content-state';
import {
  buildContentStates,
  type ContentStatesContext,
  type ContentStatesHandlers,
} from './content-states-config';

// Devuelve la clave: el test afirma sobre la estructura, no sobre los textos.
const t = ((key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key) as unknown as TFunction;

const ctx: ContentStatesContext = {
  sections: [
    { name: 'Intro', type: 'manual', runStatus: 'done', missingContext: false },
    { name: 'Scope', type: 'ai', runStatus: 'failed', missingContext: true },
  ],
  importFileName: 'budget.xlsx',
  failureMessage: 'Table too complex',
  isMissingDependencyFailure: false,
  phases: [],
  stage: 'review',
};

const handlers = (overrides: Partial<ContentStatesHandlers> = {}): ContentStatesHandlers => ({
  retryLoad: vi.fn(),
  isRetryingLoad: false,
  backToAssets: vi.fn(),
  retryGeneration: vi.fn(),
  isGenerating: false,
  canGenerate: true,
  editSections: vi.fn(),
  addSections: vi.fn(),
  startGeneration: vi.fn(),
  startWithoutImport: vi.fn(),
  ...overrides,
});

describe('buildContentStates', () => {
  it('define una configuración para cada ContentState', () => {
    const states = buildContentStates(t, ctx, handlers());
    expect(Object.keys(states).sort()).toEqual([...CONTENT_STATE_VALUES].sort());
  });

  it('error: el primer paso es el activo y reintenta la carga con loading', () => {
    const h = handlers({ isRetryingLoad: true });
    const { error } = buildContentStates(t, ctx, h);

    const first = error.steps?.[0];
    expect(first?.active).toBe(true);
    expect(first?.action?.onClick).toBe(h.retryLoad);
    expect(first?.action?.loading).toBe(true);
    expect(error.actions?.[0].onClick).toBe(h.backToAssets);
  });

  it('restricted: sin fases usa las tres etapas de respaldo y marca la actual', () => {
    const { restricted } = buildContentStates(t, ctx, handlers());
    expect(restricted.steps).toHaveLength(3);
    expect(restricted.steps?.filter((step) => step.active).map((step) => step.n)).toEqual(['2']);
  });

  it('restricted: con fases usa sus etiquetas y marca la que está en curso', () => {
    const { restricted } = buildContentStates(
      t,
      {
        ...ctx,
        phases: [
          { key: 'edit', label: 'Edición', state: 'done' },
          { key: 'review', label: 'Revisión', state: 'current' },
          { key: 'approve', label: 'Aprobación', state: 'upcoming' },
        ],
      },
      handlers(),
    );
    expect(restricted.steps?.map((step) => step.title)).toEqual(['Edición', 'Revisión', 'Aprobación']);
    expect(restricted.steps?.find((step) => step.active)?.title).toBe('Revisión');
  });

  it('runFailed: lista solo las secciones con resultado y deshabilita reintentar si no se puede generar', () => {
    const h = handlers({ canGenerate: false, cannotGenerateReason: 'Missing context' });
    const { runFailed } = buildContentStates(t, ctx, h);

    expect(runFailed.items?.map((item) => item.tone)).toEqual(['ok', 'error']);
    expect(runFailed.itemsAction?.disabled).toBe(true);
    expect(runFailed.itemsAction?.title).toBe('Missing context');
  });

  it('runFailed: sin resultados conocidos no inventa una lista pero conserva el reintento', () => {
    const { runFailed } = buildContentStates(
      t,
      { ...ctx, sections: ctx.sections.map((section) => ({ ...section, runStatus: undefined })) },
      handlers(),
    );
    expect(runFailed.items).toBeUndefined();
    expect(runFailed.itemsAction).toBeDefined();
  });

  it('importFailed: incluye el nombre del archivo y la causa, y ofrece subir otro solo si hay flujo', () => {
    const withUpload = buildContentStates(t, ctx, handlers({ uploadAnotherFile: vi.fn() })).importFailed;
    expect(withUpload.text).toContain('budget.xlsx');
    expect(withUpload.text).toContain('Table too complex');
    expect(withUpload.steps?.[2].active).toBe(true);
    expect(withUpload.steps?.[2].action).toBeDefined();

    const withoutUpload = buildContentStates(t, ctx, handlers()).importFailed;
    expect(withoutUpload.steps?.[2].action).toBeUndefined();
  });

  it('emptyNoSections: tiene los cuatro tipos de sección y la plantilla es opcional', () => {
    const withTemplate = buildContentStates(t, ctx, handlers({ useTemplate: vi.fn() })).emptyNoSections;
    expect(withTemplate.mini?.items).toHaveLength(4);
    expect(withTemplate.actions).toHaveLength(1);

    expect(buildContentStates(t, ctx, handlers()).emptyNoSections.actions).toHaveLength(0);
  });

  it('emptyWithSections: máximo 4 ítems y "Configurar contexto" solo si hay handler', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ name: `S${i}`, type: 'ai' as const, missingContext: i === 0 }));
    const withContext = buildContentStates(t, { ...ctx, sections: many }, handlers({ configureContext: vi.fn() }));

    expect(withContext.emptyWithSections.items).toHaveLength(4);
    expect(withContext.emptyWithSections.items?.[0].tone).toBe('warn');
    expect(withContext.emptyWithSections.items?.[1].tone).toBe('ok');
    expect(withContext.emptyWithSections.actions).toHaveLength(2);

    const without = buildContentStates(t, { ...ctx, sections: many }, handlers());
    expect(without.emptyWithSections.actions).toHaveLength(1);
  });

  it('ningún texto queda vacío en los estados que renderizan ScreenState', () => {
    const states = buildContentStates(t, ctx, handlers());
    for (const state of ['error', 'restricted', 'runFailed', 'importFailed', 'emptyNoSections', 'emptyWithSections'] as const) {
      expect(states[state].title, state).not.toBe('');
      expect(states[state].text, state).not.toBe('');
      expect(states[state].cardTitle, state).not.toBe('');
    }
  });
});
