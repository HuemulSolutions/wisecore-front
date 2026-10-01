/**
 * Paso 3 del sheet de tabla de datos · filtro por tipo de activo (`kind: 'asset_type'`)
 * de la fuente `related_documents`.
 */
import { http } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { FiltersStep } from '@/components/ui/data-table-config/filters-step'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import type { DataTableFilterDef } from '@/types/data-table-resolve'

const PROCEDURE_ID = '8b1c2d4e-5f60-4a71-9b82-3c4d5e6f7a80'
const POLICY_ID = '1a2b3c4d-5e6f-4a70-8b91-0c1d2e3f4a5b'

const assetTypeFilter: DataTableFilterDef = {
  id: 'related_asset_types',
  kind: 'asset_type',
  label: 'Tipo de activo',
  hint: null,
}

const directionFilter: DataTableFilterDef = {
  id: 'relationship_directions',
  kind: 'multi_enum',
  label: 'Dirección',
  options: [{ value: 'outgoing', label: 'Saliente' }],
}

function mockAssetTypes() {
  server.use(
    http.get(`${backendUrl}/document_types`, () =>
      respondOk(
        [
          { id: PROCEDURE_ID, name: 'Procedimiento', color: '#2563eb' },
          { id: POLICY_ID, name: 'Política', color: '#16a34a' },
        ],
        { has_next: false },
      ),
    ),
  )
}

describe('FiltersStep · filtro por tipo de activo', () => {
  it('elegir un tipo emite el id bajo el filtro related_asset_types', async () => {
    mockAssetTypes()
    const onChange = vi.fn()
    const { user } = renderWithProviders(
      <FiltersStep filterDefs={[assetTypeFilter]} filters={{}} onChange={onChange} />,
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByText('Procedimiento'))

    expect(onChange).toHaveBeenCalledWith('related_asset_types', [PROCEDURE_ID])
  })

  it('con valores guardados muestra el nombre del tipo y "Limpiar" vacía el filtro', async () => {
    mockAssetTypes()
    const onChange = vi.fn()
    const { user } = renderWithProviders(
      <FiltersStep filterDefs={[assetTypeFilter]} filters={{ related_asset_types: [POLICY_ID] }} onChange={onChange} />,
    )

    expect(await screen.findByText('Política')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /limpiar|clear/i }))
    expect(onChange).toHaveBeenCalledWith('related_asset_types', [])
  })

  it('no regresiona multi_enum: sigue mostrando chips de opciones', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(
      <FiltersStep filterDefs={[directionFilter]} filters={{}} onChange={onChange} />,
    )

    await user.click(screen.getByRole('button', { name: /saliente|outgoing/i }))
    expect(onChange).toHaveBeenCalledWith('relationship_directions', ['outgoing'])
  })
})
