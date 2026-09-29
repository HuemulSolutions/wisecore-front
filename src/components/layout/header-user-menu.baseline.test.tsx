/**
 * Plan modo administrador (docs/sso-frontend.md, Fase 7) · BASELINE · menú del avatar.
 *
 * Lo que ve un usuario común en el menú personal se conserva tal cual: el modo
 * administrador solo agrega ítems para el root admin.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HeaderUserMenu } from '@/components/layout/header-user-menu'

const user = { name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' }

function renderMenu(overrides: Partial<Parameters<typeof HeaderUserMenu>[0]> = {}) {
  const props = {
    user,
    organizationToken: 'org-token',
    canListNotifications: true,
    unreadNotificationsCount: 0,
    onUpdateProfile: vi.fn(),
    onOpenPreferences: vi.fn(),
    onOpenNotifications: vi.fn(),
    onOpenSubscriptions: vi.fn(),
    onSignOut: vi.fn(),
    ...overrides,
  }
  render(<HeaderUserMenu {...props} />)
  return props
}

async function openMenu() {
  await userEvent.setup().click(screen.getByRole('button'))
  return screen.findByRole('menu')
}

function menuItemNames(): string[] {
  return screen.getAllByRole('menuitem').map((item) => item.textContent?.trim() ?? '')
}

describe('HeaderUserMenu · usuario común', () => {
  it('con organización activa y permiso de notificaciones muestra exactamente perfil, preferencias, notificaciones, suscripciones y cerrar sesión', async () => {
    renderMenu()
    await openMenu()

    expect(menuItemNames()).toEqual(['Update Profile', 'Preferences', 'Notifications', 'My Subscriptions', 'Sign out'])
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
  })

  it('sin organización activa solo quedan perfil, preferencias y cerrar sesión', async () => {
    renderMenu({ organizationToken: null })
    await openMenu()

    expect(menuItemNames()).toEqual(['Update Profile', 'Preferences', 'Sign out'])
  })

  it('sin permiso de notificaciones no muestra el ítem de notificaciones', async () => {
    renderMenu({ canListNotifications: false })
    await openMenu()

    expect(menuItemNames()).toEqual(['Update Profile', 'Preferences', 'My Subscriptions', 'Sign out'])
  })

  it('aunque reciba callbacks del modo administrador, sin la pista de root no los ofrece', async () => {
    renderMenu({ isRootAdmin: false, onEnterAdminMode: vi.fn(), onExitAdminMode: vi.fn() })
    await openMenu()

    expect(menuItemNames()).toEqual(['Update Profile', 'Preferences', 'Notifications', 'My Subscriptions', 'Sign out'])
  })

  it('cerrar sesión llama a onSignOut', async () => {
    const props = renderMenu()
    await openMenu()

    await userEvent.setup().click(screen.getByRole('menuitem', { name: 'Sign out' }))

    expect(props.onSignOut).toHaveBeenCalledTimes(1)
  })
})

// Plan modo administrador (docs/sso-frontend.md, Fase 7, bloque D).
describe('HeaderUserMenu · root admin', () => {
  it('fuera del modo administrador ofrece "Enter admin mode" antes de cerrar sesión', async () => {
    const onEnterAdminMode = vi.fn()
    renderMenu({ isRootAdmin: true, isAdminMode: false, onEnterAdminMode, onExitAdminMode: vi.fn() })
    await openMenu()

    expect(menuItemNames()).toEqual([
      'Update Profile',
      'Preferences',
      'Notifications',
      'My Subscriptions',
      'Enter admin mode',
      'Sign out',
    ])
    await userEvent.setup().click(screen.getByRole('menuitem', { name: 'Enter admin mode' }))
    expect(onEnterAdminMode).toHaveBeenCalledTimes(1)
  })

  it('en modo administrador ofrece salir con los minutos restantes', async () => {
    const onExitAdminMode = vi.fn()
    renderMenu({ isRootAdmin: true, isAdminMode: true, adminModeRemainingMinutes: 23, onEnterAdminMode: vi.fn(), onExitAdminMode })
    await openMenu()

    expect(screen.queryByRole('menuitem', { name: 'Enter admin mode' })).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('menuitem', { name: 'Exit admin mode (23 min left)' }))
    expect(onExitAdminMode).toHaveBeenCalledTimes(1)
  })
})
