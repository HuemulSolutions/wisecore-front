/**
 * Bus fuera de React para avisar transiciones de sesión (login/logout) a
 * contextos que no pueden consumir `useAuth()` sin invertir el orden de
 * providers (`PermissionsProvider` y `OrganizationContext` montan por
 * debajo de `AuthProvider` — un efecto keyed en `token` correría antes que
 * el restore de `AuthProvider` y limpiaría permisos válidos en el primer
 * render, ver `ia context/rbac-audit-guide.md`).
 *
 * Mismo patrón que `error-report-store.ts`: store de módulo anclado en
 * `globalThis` en vez de un context con setter registrado por efecto, para
 * no depender del orden de montaje ni duplicar listeners bajo StrictMode.
 *
 * Emite solo en `login()`/`logout()` explícitos — nunca en el restore desde
 * localStorage, el polling de tokens ni el switch de organización — así la
 * retención anti-flicker de `permissions-context.tsx` queda intacta por
 * construcción para esos casos.
 */

import { logger } from '@/lib/logger';

type SessionEventReason = 'login' | 'logout';
type Listener = (reason: SessionEventReason) => void;

type StoreState = { listeners: Set<Listener> };

const GLOBAL_KEY = '__wisecoreSessionEvents';
const globalScope = globalThis as typeof globalThis & { [GLOBAL_KEY]?: StoreState };

const state: StoreState =
  globalScope[GLOBAL_KEY] ?? (globalScope[GLOBAL_KEY] = { listeners: new Set() });

export const sessionEvents = {
  subscribe(listener: Listener): () => void {
    state.listeners.add(listener);
    return () => {
      state.listeners.delete(listener);
    };
  },
  emitReset(reason: SessionEventReason): void {
    state.listeners.forEach((listener) => {
      try {
        listener(reason);
      } catch (error) {
        logger.error('session-events: listener falló', error);
      }
    });
  },
};
