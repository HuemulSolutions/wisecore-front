import { describe, expect, it } from 'vitest';
import { getSourcesState, isSourcesState, type SourcesStateInput } from './sources-state';

const base: SourcesStateInput = {
  isLoading: false,
  isError: false,
  isFetching: false,
  hasAnySource: true,
  hasActiveUploads: false,
  isLocked: false,
};

describe('getSourcesState', () => {
  it('ready con fuentes y sin novedades', () => {
    expect(getSourcesState(base)).toBe('ready');
  });

  it('loading mientras carga', () => {
    expect(getSourcesState({ ...base, isLoading: true })).toBe('loading');
  });

  it('error cuando falla la carga', () => {
    expect(getSourcesState({ ...base, isError: true })).toBe('error');
  });

  it('reintentar un error vuelve a loading', () => {
    expect(getSourcesState({ ...base, isError: true, isFetching: true })).toBe('loading');
  });

  it('empty sin fuentes', () => {
    expect(getSourcesState({ ...base, hasAnySource: false })).toBe('empty');
  });

  it('uploading con subidas en curso', () => {
    expect(getSourcesState({ ...base, hasActiveUploads: true })).toBe('uploading');
  });

  it('locked tiene prioridad sobre uploading', () => {
    expect(getSourcesState({ ...base, hasActiveUploads: true, isLocked: true })).toBe('locked');
  });

  it('empty tiene prioridad sobre locked (no hay lista que bloquear)', () => {
    expect(getSourcesState({ ...base, hasAnySource: false, isLocked: true })).toBe('empty');
  });
});

describe('isSourcesState', () => {
  it('valida contra la unión', () => {
    expect(isSourcesState('locked')).toBe(true);
    expect(isSourcesState('nope')).toBe(false);
  });
});
