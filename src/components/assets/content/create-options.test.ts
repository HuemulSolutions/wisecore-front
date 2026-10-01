import { describe, expect, it, vi } from 'vitest';
import { CREATE_OPTIONS, type CreateOptionActions } from './create-options';

const makeActions = (): CreateOptionActions => ({
  handleCreateAsset: vi.fn(),
  handleImportAsset: vi.fn(),
  handleImportAssetFromExternal: vi.fn(),
});

const byId = (id: string) => CREATE_OPTIONS.find((option) => option.id === id)!;

describe('CREATE_OPTIONS', () => {
  it('define las cinco opciones con ids únicos, en el orden del asistente', () => {
    expect(CREATE_OPTIONS.map((option) => option.id)).toEqual(['file', 'url', 'tpl', 'ext', 'blank']);
  });

  it('cada opción tiene ícono, colores y al menos un campo', () => {
    for (const option of CREATE_OPTIONS) {
      expect(option.icon, option.id).toBeDefined();
      expect(option.bg, option.id).toMatch(/^#/);
      expect(option.fg, option.id).toMatch(/^#/);
      expect(option.fieldCount, option.id).toBeGreaterThan(0);
    }
  });

  it('file abre la importación de archivo', () => {
    const actions = makeActions();
    byId('file').onClick(actions, 'folder-1');
    expect(actions.handleImportAsset).toHaveBeenCalledWith('folder-1');
  });

  it('ext abre la importación desde sistema externo', () => {
    const actions = makeActions();
    byId('ext').onClick(actions, 'folder-1');
    expect(actions.handleImportAssetFromExternal).toHaveBeenCalledWith('folder-1');
  });

  it.each([
    ['url', 'url'],
    ['tpl', 'template'],
    ['blank', 'blank'],
  ] as const)('%s abre la creación con el método %s preseleccionado', (id, mode) => {
    const actions = makeActions();
    byId(id).onClick(actions, 'folder-1');
    expect(actions.handleCreateAsset).toHaveBeenCalledWith('folder-1', mode);
  });
});
