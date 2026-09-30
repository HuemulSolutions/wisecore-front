import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKnowledgePanelCollapsed } from './useKnowledgePanelCollapsed';

describe('useKnowledgePanelCollapsed', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('arranca expandido por defecto', () => {
    const { result } = renderHook(() => useKnowledgePanelCollapsed('org-1'));
    expect(result.current[0]).toBe(false);
  });

  it('persiste y restaura el estado colapsado', () => {
    const first = renderHook(() => useKnowledgePanelCollapsed('org-1'));
    act(() => first.result.current[1](true));
    expect(first.result.current[0]).toBe(true);
    first.unmount();

    const second = renderHook(() => useKnowledgePanelCollapsed('org-1'));
    expect(second.result.current[0]).toBe(true);
  });

  it('aísla el valor por organización', () => {
    window.localStorage.setItem('wisecore:knowledge-panel-collapsed:org-1', '1');
    const { result, rerender } = renderHook(({ org }) => useKnowledgePanelCollapsed(org), {
      initialProps: { org: 'org-1' },
    });
    expect(result.current[0]).toBe(true);
    rerender({ org: 'org-2' });
    expect(result.current[0]).toBe(false);
  });

  it('no rompe si localStorage lanza', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useKnowledgePanelCollapsed('org-1'));
    expect(result.current[0]).toBe(false);
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });
});
