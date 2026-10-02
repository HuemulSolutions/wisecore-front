import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { isContentState, type ContentState } from '../content-state';
import { useDevStateOverride } from './useDevStateOverride';

const setSearch = (search: string) => window.history.pushState({}, '', `/asset/1${search}`);

describe('useDevStateOverride', () => {
  afterEach(() => setSearch(''));

  it('devuelve el estado válido del query param', () => {
    setSearch('?state=importFailed');
    const { result } = renderHook(() => useDevStateOverride<ContentState>('state', isContentState, true));
    expect(result.current).toBe('importFailed');
  });

  it('ignora valores que no pertenecen a la unión', () => {
    setSearch('?state=inventado');
    const { result } = renderHook(() => useDevStateOverride<ContentState>('state', isContentState, true));
    expect(result.current).toBeNull();
  });

  it('no tiene efecto fuera de desarrollo', () => {
    setSearch('?state=error');
    const { result } = renderHook(() => useDevStateOverride<ContentState>('state', isContentState, false));
    expect(result.current).toBeNull();
  });
});
