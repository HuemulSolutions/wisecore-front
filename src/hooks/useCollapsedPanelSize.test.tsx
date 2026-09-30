import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RAIL_WIDTH_PX, useCollapsedPanelSize } from './useCollapsedPanelSize';

describe('useCollapsedPanelSize', () => {
  let group: HTMLDivElement;

  beforeEach(() => {
    group = document.createElement('div');
    group.setAttribute('data-panel-group-id', 'test-group');
    group.getBoundingClientRect = () => ({ width: 1300 }) as DOMRect;
    document.body.appendChild(group);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    group.remove();
    vi.unstubAllGlobals();
  });

  it('convierte el ancho en px del rail a % del grupo medido', () => {
    const { result } = renderHook(() =>
      useCollapsedPanelSize({ groupId: 'test-group', panelRef: { current: null } }),
    );
    expect(result.current).toBeCloseTo((RAIL_WIDTH_PX / 1300) * 100, 2);
  });

  it('usa el fallback si el grupo no existe', () => {
    const { result } = renderHook(() =>
      useCollapsedPanelSize({ groupId: 'no-existe', panelRef: { current: null }, fallback: 4 }),
    );
    expect(result.current).toBe(4);
  });
});
