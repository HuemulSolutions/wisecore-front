import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { VersionBanner } from './version-banner'
import { VERSION_BANNER_VARIANTS, isVersionBannerVariant } from './version-banner-variants'

describe('VersionBanner', () => {
  it.each(VERSION_BANNER_VARIANTS)('renderiza la variante %s con título y texto', (variant) => {
    render(<VersionBanner variant={variant} title="Banner title" text="Banner text" />)

    const banner = screen.getByTestId('version-banner')
    expect(banner).toHaveAttribute('data-variant', variant)
    expect(screen.getByText('Banner title')).toBeInTheDocument()
    expect(screen.getByText('Banner text')).toBeInTheDocument()
  })

  it('usa el tono de la variante y permite sobreescribirlo', () => {
    const { rerender } = render(<VersionBanner variant="externalLocked" title="t" />)
    expect(screen.getByTestId('version-banner')).toHaveClass('bg-amber-50')

    rerender(<VersionBanner variant="externalLocked" tone="green" title="t" />)
    expect(screen.getByTestId('version-banner')).toHaveClass('bg-green-50')
  })

  it('muestra la barra de progreso solo si hay valor', () => {
    const { rerender } = render(<VersionBanner variant="generating" title="Generating" />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

    rerender(<VersionBanner variant="generating" title="Generating" progress={40} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('dispara las acciones y bloquea el doble click mientras corre una promesa', async () => {
    let resolve: () => void = () => undefined
    const retry = vi.fn(() => new Promise<void>((r) => { resolve = r }))
    const dismiss = vi.fn()
    render(
      <VersionBanner
        variant="externalFailed"
        title="Failed"
        actions={[
          { label: 'Retry', onClick: retry },
          { label: 'Dismiss', onClick: dismiss },
        ]}
      />,
    )

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    await userEvent.click(retryButton)
    await userEvent.click(retryButton)
    expect(retry).toHaveBeenCalledTimes(1)
    resolve()

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(dismiss).toHaveBeenCalledTimes(1)
  })
})

describe('isVersionBannerVariant', () => {
  it('valida contra las cinco variantes', () => {
    expect(isVersionBannerVariant('partialRun')).toBe(true)
    expect(isVersionBannerVariant('otra')).toBe(false)
    expect(isVersionBannerVariant(null)).toBe(false)
  })
})
