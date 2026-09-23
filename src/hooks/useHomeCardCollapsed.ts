import { useCallback, useEffect, useRef, useState } from 'react';
import { useOrganization } from '@/contexts/organization-context';

export type HomeCardKey = 'continue' | 'overview';

const storageKey = (orgId: string | null | undefined, cardKey: HomeCardKey) =>
  `wisecore:home-card-collapsed:${orgId ?? 'none'}:${cardKey}`;

function readStored(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

/** Estado colapsado/expandido de una card del rail de Home, recordado por organización. Default: expandida. */
export function useHomeCardCollapsed(cardKey: HomeCardKey): [boolean, () => void] {
  const { selectedOrganizationId } = useOrganization();
  const key = storageKey(selectedOrganizationId, cardKey);
  const [collapsed, setCollapsed] = useState<boolean>(() => readStored(key));
  const loadedKeyRef = useRef(key);

  // Cambio de organización: releer el valor de la nueva clave en vez de arrastrar el de la anterior.
  useEffect(() => {
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    setCollapsed(readStored(key));
  }, [key]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(key, next ? '1' : '0');
      } catch {
        /* modo privado / cuota: no persiste esta vez */
      }
      return next;
    });
  }, [key]);

  return [collapsed, toggle];
}
