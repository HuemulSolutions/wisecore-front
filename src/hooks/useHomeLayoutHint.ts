export type HomeLayoutVariant = 'normal' | 'firstTime';

const storageKey = (orgId: string | null | undefined) => `wisecore:home-layout:${orgId || 'none'}`;

/** Última variante de Home pintada para la org — pronóstico para el skeleton. Default `normal`. */
export function readHomeLayoutHint(orgId: string | null | undefined): HomeLayoutVariant {
  if (typeof window === 'undefined') return 'normal';
  try {
    return window.localStorage.getItem(storageKey(orgId)) === 'firstTime' ? 'firstTime' : 'normal';
  } catch {
    return 'normal';
  }
}

export function saveHomeLayoutHint(orgId: string | null | undefined, variant: HomeLayoutVariant): void {
  try {
    window.localStorage.setItem(storageKey(orgId), variant);
  } catch {
    /* modo privado / storage deshabilitado */
  }
}
