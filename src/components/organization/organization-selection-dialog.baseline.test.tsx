/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · diálogo de selección de organización.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OrganizationSelectionDialog } from '@/components/organization/organization-selection-dialog'
import { renderWithProviders } from '@/test/render'
import { makeLoginToken } from '@/test/jwt'
import { activeUser, ORG_A_ID, rootAdmin } from '@/test/fixtures'

describe('OrganizationSelectionDialog', () => {
  it('lista las organizaciones del usuario, deshabilita las no-miembro y genera el token de la elegida', async () => {
    const { user } = renderWithProviders(<OrganizationSelectionDialog open />, {
      session: { token: makeLoginToken({ sub: activeUser.id }), user: activeUser },
    })

    const trigger = await screen.findByRole('combobox')
    await waitFor(() => expect(trigger).toBeEnabled())
    await user.click(trigger)

    const listbox = await screen.findByRole('listbox')
    expect(within(listbox).getByText('Org A')).toBeInTheDocument()
    expect(within(listbox).getByText('Org B')).toBeInTheDocument()
    const notMember = within(listbox).getByText('Org sin membresía').closest('[role="option"]')
    expect(notMember).toHaveAttribute('aria-disabled', 'true')

    await user.click(within(listbox).getByText('Org A'))
    await user.click(screen.getByRole('button', { name: 'Continue with Selected Organization' }))

    await waitFor(() => expect(localStorage.getItem('selectedOrganizationId')).toBe(ORG_A_ID))
    expect(localStorage.getItem('organizationToken')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Go to Global Admin' })).not.toBeInTheDocument()
  })

  it('el root admin ve el acceso a Global Admin', async () => {
    renderWithProviders(<OrganizationSelectionDialog open />, {
      session: { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin },
    })

    expect(await screen.findByRole('button', { name: 'Go to Global Admin' })).toBeInTheDocument()
  })
})
