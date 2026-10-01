import type { LifecyclePermissions } from '@/types/assets';

export interface ScreenStateAction {
  label: string;
  /** Si devuelve una Promise, el botón muestra loading y bloquea el doble click. */
  onClick: () => void | Promise<unknown>;
  loading?: boolean;
  disabled?: boolean;
  /** Tooltip nativo (por ejemplo, el motivo por el que está deshabilitada). */
  title?: string;
  /** Gating de permisos de `HuemulButton`: si no se cumple, la acción no se muestra. */
  access?: {
    requiredAccess: string | string[];
    resource: string;
    lifecyclePermissions?: LifecyclePermissions;
  };
}

export interface ScreenStateStep {
  n: string;
  title: string;
  text: string;
  active?: boolean;
  action?: ScreenStateAction;
}

export interface ScreenStateItem {
  n: string;
  name: string;
  type: string;
  status: string;
  tone: 'ok' | 'error' | 'warn';
}

export interface ScreenStateConfig {
  title: string;
  text: string;
  cardTitle: string;
  cardSub: string;
  steps?: ScreenStateStep[];
  items?: ScreenStateItem[];
  itemsAction?: ScreenStateAction;
  mini?: { title: string; items: { t: string; d: string }[] };
  foot?: string;
  actions?: ScreenStateAction[];
}

export interface HuemulScreenStateProps {
  config: ScreenStateConfig;
  className?: string;
}
