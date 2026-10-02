import { ArrowLeftRight, LayoutTemplate, Link, Plus, Upload, type LucideIcon } from 'lucide-react';
import type { CreateAssetContentMode } from '@/types/assets';

export type CreateOptionId = 'file' | 'url' | 'tpl' | 'ext' | 'blank';

/** Handlers del flujo de creación existente (ver `useNavKnowledgeActions`). */
export interface CreateOptionActions {
  handleCreateAsset: (folderId?: string, mode?: CreateAssetContentMode) => void;
  handleImportAsset: (folderId?: string) => void;
  handleImportAssetFromExternal: (folderId?: string) => void;
}

export interface CreateOption {
  id: CreateOptionId;
  icon: LucideIcon;
  /** Colores del cuadrado del ícono en el panel de recomendación. */
  bg: string;
  fg: string;
  /** Cantidad de campos de «Vas a completar» (claves `createWizard.options.<id>.field<N>`). */
  fieldCount: number;
  /** Abre el flujo de creación existente con el método preseleccionado. */
  onClick: (actions: CreateOptionActions, folderId?: string) => void;
}

/**
 * Configuración de las cinco formas de empezar un asset. Los textos (pregunta, subtítulo, título,
 * descripción, campos y CTA) viven en `assets:createWizard.options.<id>.*`.
 */
export const CREATE_OPTIONS: readonly CreateOption[] = [
  {
    id: 'file',
    icon: Upload,
    bg: '#f5f3ff',
    fg: '#6d28d9',
    fieldCount: 3,
    onClick: (actions, folderId) => actions.handleImportAsset(folderId),
  },
  {
    id: 'url',
    icon: Link,
    bg: '#eefaf1',
    fg: '#16a34a',
    fieldCount: 3,
    onClick: (actions, folderId) => actions.handleCreateAsset(folderId, 'url'),
  },
  {
    id: 'tpl',
    icon: LayoutTemplate,
    bg: '#eff4ff',
    fg: '#2563eb',
    fieldCount: 2,
    onClick: (actions, folderId) => actions.handleCreateAsset(folderId, 'template'),
  },
  {
    id: 'ext',
    icon: ArrowLeftRight,
    bg: '#fef6e7',
    fg: '#b45309',
    fieldCount: 2,
    onClick: (actions, folderId) => actions.handleImportAssetFromExternal(folderId),
  },
  {
    id: 'blank',
    icon: Plus,
    bg: '#f1f4f7',
    fg: '#475569',
    fieldCount: 1,
    onClick: (actions, folderId) => actions.handleCreateAsset(folderId, 'blank'),
  },
];
