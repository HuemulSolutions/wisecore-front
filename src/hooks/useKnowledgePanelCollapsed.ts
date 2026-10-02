import { useCallback, useState } from 'react';

const storageKey = (orgId: string | null | undefined) =>
  `wisecore:knowledge-panel-collapsed:${orgId ?? 'none'}`;

function readStored(orgId: string | null | undefined): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(storageKey(orgId)) === '1';
  } catch {
    return false;
  }
}

function writeStored(orgId: string | null | undefined, collapsed: boolean): void {
  try {
    window.localStorage.setItem(storageKey(orgId), collapsed ? '1' : '0');
  } catch {
    /* modo privado / storage deshabilitado */
  }
}

/**
 * Estado colapsado del panel de knowledge (árbol de la biblioteca) en /asset.
 * Persiste en localStorage por organización; lectura síncrona para arrancar
 * colapsado sin parpadeo.
 */
export function useKnowledgePanelCollapsed(
  orgId: string | null | undefined,
): [boolean, (collapsed: boolean) => void] {
  const [state, setState] = useState(() => ({ orgId, collapsed: readStored(orgId) }));

  // Cambio de organización: re-leer el valor de esa org (ajuste durante el render).
  let current = state;
  if (state.orgId !== orgId) {
    current = { orgId, collapsed: readStored(orgId) };
    setState(current);
  }

  const setCollapsed = useCallback(
    (collapsed: boolean) => {
      writeStored(orgId, collapsed);
      setState({ orgId, collapsed });
    },
    [orgId],
  );

  return [current.collapsed, setCollapsed];
}
