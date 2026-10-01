import { describe, expect, it } from 'vitest';
import {
  getContentState,
  isContentState,
  type ContentStateQuery,
  type ContentStateRun,
  type ContentStateVersion,
} from './content-state';

const query: ContentStateQuery = { isLoading: false, isError: false };
const run: ContentStateRun = { isSectionRun: false };
const version: ContentStateVersion = {
  canView: true,
  status: 'approved',
  isGeneratingFull: false,
  hasExecutions: true,
  hasContent: true,
  sectionCount: 3,
};

describe('getContentState', () => {
  it('ready cuando hay versión y contenido', () => {
    expect(getContentState(query, version, run)).toBe('ready');
  });

  it('loading tiene prioridad sobre error y restricted', () => {
    expect(getContentState({ isLoading: true, isError: true }, { ...version, canView: false }, run)).toBe('loading');
  });

  it('error tiene prioridad sobre restricted', () => {
    expect(getContentState({ isLoading: false, isError: true }, { ...version, canView: false }, run)).toBe('error');
  });

  it('restricted si no hay permiso para ver el contenido', () => {
    expect(getContentState(query, { ...version, canView: false }, run)).toBe('restricted');
  });

  it('generating cuando la versión completa se está generando', () => {
    expect(getContentState(query, { ...version, isGeneratingFull: true, status: 'running' }, run)).toBe('generating');
  });

  it('una corrida parcial no reemplaza el contenido', () => {
    expect(getContentState(query, { ...version, isGeneratingFull: true, status: 'running' }, { isSectionRun: true })).toBe(
      'ready',
    );
  });

  it('import_failed nunca es generating', () => {
    expect(
      getContentState(
        query,
        { ...version, isGeneratingFull: true, status: 'import_failed', hasContent: false },
        run,
      ),
    ).toBe('importFailed');
  });

  it('runFailed si la ejecución falló y no hay contenido', () => {
    expect(getContentState(query, { ...version, status: 'failed', hasContent: false }, run)).toBe('runFailed');
  });

  it('una ejecución fallida con contenido sigue mostrando el contenido', () => {
    expect(getContentState(query, { ...version, status: 'failed' }, run)).toBe('ready');
  });

  it('emptyNoSections sin secciones', () => {
    expect(getContentState(query, { ...version, hasExecutions: false, hasContent: false, sectionCount: 0 }, run)).toBe(
      'emptyNoSections',
    );
  });

  it('emptyNoSections cuando aún no se conoce la cantidad de secciones', () => {
    expect(
      getContentState(query, { ...version, hasExecutions: false, hasContent: false, sectionCount: undefined }, run),
    ).toBe('emptyNoSections');
  });

  it('emptyWithSections con secciones y sin ejecución', () => {
    expect(getContentState(query, { ...version, hasExecutions: false, hasContent: false, sectionCount: 2 }, run)).toBe(
      'emptyWithSections',
    );
  });
});

describe('isContentState', () => {
  it('valida contra la unión', () => {
    expect(isContentState('runFailed')).toBe(true);
    expect(isContentState('otro')).toBe(false);
    expect(isContentState(null)).toBe(false);
  });
});
