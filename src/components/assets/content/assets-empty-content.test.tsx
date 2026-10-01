import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({
  handleCreateAsset: vi.fn(),
  handleImportAsset: vi.fn(),
  handleImportAssetFromExternal: vi.fn(),
  handleImportConfig: vi.fn(),
}));
const perms = vi.hoisted(() => ({ canCreateAssets: true }));

vi.mock('@/contexts/organization-context', () => ({
  useOrganization: () => ({ selectedOrganizationId: 'org-1' }),
}));
vi.mock('@/contexts/nav-knowledge-context', () => ({
  useNavKnowledgeActions: () => nav,
}));
vi.mock('@/hooks/useUserPermissions', () => ({
  useUserPermissions: () => ({
    canAccessAssets: perms.canCreateAssets,
    canCreate: () => perms.canCreateAssets,
  }),
}));

import { AssetEmptyContent } from './assets-empty-content';

describe('AssetEmptyContent — asistente de creación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perms.canCreateAssets = true;
  });

  it('muestra el encabezado y la primera opción seleccionada con su recomendación', () => {
    render(<AssetEmptyContent currentFolderId="f1" />);

    expect(screen.getByRole('heading', { name: 'No asset open' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /I have a document/ })).toBeChecked();
    expect(screen.getByRole('heading', { name: 'From file' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload file' })).toBeInTheDocument();
  });

  it('cambiar de opción actualiza la recomendación, los campos y el CTA', async () => {
    render(<AssetEmptyContent currentFolderId="f1" />);

    await userEvent.click(screen.getByRole('radio', { name: /There is a template for this/ }));

    expect(screen.getByRole('radio', { name: /There is a template for this/ })).toBeChecked();
    expect(screen.getByRole('heading', { name: 'From template' })).toBeInTheDocument();
    expect(screen.getByText('The template to use')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose template' })).toBeInTheDocument();
  });

  it('las flechas mueven la selección y el CTA recibe el foco con Tab después del grupo', async () => {
    render(<AssetEmptyContent currentFolderId="f1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('radio', { name: /I have a document/ }));
    // Radix marca el radio enfocado con flechas en un requestAnimationFrame y resetea el flag en keyup:
    // se mantiene la tecla presionada hasta que se aplica la selección.
    await user.keyboard('{ArrowDown>}');
    await waitFor(() => expect(screen.getByRole('radio', { name: /I have a link/ })).toBeChecked());
    await user.keyboard('{/ArrowDown}');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Import from URL' })).toHaveFocus();
  });

  it.each([
    ['I have a document', 'Upload file', 'handleImportAsset', ['f1']],
    ['I have a link', 'Import from URL', 'handleCreateAsset', ['f1', 'url']],
    ['There is a template for this', 'Choose template', 'handleCreateAsset', ['f1', 'template']],
    ["It's in another system", 'Connect system', 'handleImportAssetFromExternal', ['f1']],
    ['I have nothing yet', 'Create blank', 'handleCreateAsset', ['f1', 'blank']],
  ] as const)('«%s»: el CTA «%s» abre el flujo existente', async (option, cta, handler, args) => {
    render(<AssetEmptyContent currentFolderId="f1" />);

    await userEvent.click(screen.getByRole('radio', { name: new RegExp(option) }));
    await userEvent.click(screen.getByRole('button', { name: cta }));

    expect(nav[handler]).toHaveBeenCalledWith(...args);
  });

  it('«Importar JSON» abre el import de configuración', async () => {
    render(<AssetEmptyContent currentFolderId="f1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Import JSON' }));
    expect(nav.handleImportConfig).toHaveBeenCalledTimes(1);
  });

  it('sin permiso de crear solo queda el encabezado', () => {
    perms.canCreateAssets = false;
    render(<AssetEmptyContent currentFolderId="f1" />);

    expect(screen.getByRole('heading', { name: 'No asset open' })).toBeInTheDocument();
    expect(screen.getByText('Open one from the knowledge panel.')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Import JSON' })).not.toBeInTheDocument();
  });
});
