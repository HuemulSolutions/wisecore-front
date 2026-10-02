import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditSectionDialog } from '@/components/sections/sections-edit-sheet'
import { renderWithProviders } from '@/test/render'

// El form real monta el editor rico; acá solo importa el contrato submit -> onSave -> cierre.
vi.mock('@/components/sections/sections-edit-form', () => ({
  EditSectionForm: ({ onSubmit, onValidationChange }: {
    onSubmit: (item: unknown) => void
    onValidationChange?: (valid: boolean) => void
  }) => {
    onValidationChange?.(true)
    return (
      <form
        id="edit-section-form"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ id: 's1', name: 'Sección' })
        }}
      />
    )
  },
}))

const item = { id: 's1', name: 'Sección', prompt: '', order: 1, dependencies: [] }

function setup(onSave: (data: unknown) => Promise<unknown> | void) {
  const onOpenChange = vi.fn()
  const utils = renderWithProviders(
    <EditSectionDialog open onOpenChange={onOpenChange} item={item} onSave={onSave} />,
  )
  return { onOpenChange, ...utils }
}

describe('EditSectionDialog — guardado', () => {
  it('mantiene el sheet abierto con el botón en loader mientras onSave está pendiente', async () => {
    let resolveSave!: () => void
    const onSave = vi.fn(() => new Promise<void>((resolve) => { resolveSave = resolve }))
    const { user, onOpenChange } = setup(onSave)

    const saveButton = await screen.findByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(saveButton).toBeDisabled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    await act(async () => { resolveSave() })
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('no cierra el sheet si onSave rechaza', async () => {
    const onSave = vi.fn(() => Promise.reject(new Error('502')))
    const { user, onOpenChange } = setup(onSave)

    await user.click(await screen.findByRole('button', { name: /save/i }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByRole('button', { name: /save/i })).toBeEnabled())
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('cierra el sheet cuando onSave resuelve', async () => {
    const onSave = vi.fn(() => Promise.resolve())
    const { user, onOpenChange } = setup(onSave)

    await user.click(await screen.findByRole('button', { name: /save/i }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
