/**
 * Plan modo administrador (docs/sso-frontend.md, Fase 7, bloque D) · BASELINE · badge del header.
 */
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeaderAdminModeBadge } from '@/components/layout/header-admin-mode-badge'
import { rootElevationStore } from '@/lib/root-elevation-store'

const MINUTE = 60 * 1000

describe('HeaderAdminModeBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-09-28T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('fuera del modo administrador no se muestra', () => {
    render(<HeaderAdminModeBadge isRootAdmin />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('sin la pista de root no se muestra aunque haya token', () => {
    rootElevationStore.setElevation('elev-1', Date.now() + 30 * MINUTE)
    render(<HeaderAdminModeBadge isRootAdmin={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('en modo administrador muestra los minutos restantes y los actualiza', async () => {
    rootElevationStore.setElevation('elev-1', Date.now() + 30 * MINUTE)
    render(<HeaderAdminModeBadge isRootAdmin />)

    expect(screen.getByRole('button', { name: 'Admin mode · 30 min' })).toHaveAttribute(
      'title',
      'Root admin actions are enabled for 30 more minutes. Click to exit admin mode.',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7 * MINUTE)
    })
    expect(screen.getByRole('button', { name: 'Admin mode · 23 min' })).toBeInTheDocument()
  })

  it('al vencer el token desaparece solo', async () => {
    rootElevationStore.setElevation('elev-1', Date.now() + 30 * MINUTE)
    render(<HeaderAdminModeBadge isRootAdmin />)
    expect(screen.getByRole('button')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30 * MINUTE)
    })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(rootElevationStore.getToken()).toBeNull()
  })

  it('clic sale del modo administrador', async () => {
    rootElevationStore.setElevation('elev-1', Date.now() + 30 * MINUTE)
    render(<HeaderAdminModeBadge isRootAdmin />)

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button'))

    expect(rootElevationStore.getToken()).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
