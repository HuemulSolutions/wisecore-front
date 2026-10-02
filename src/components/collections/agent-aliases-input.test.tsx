/**
 * Alias de una colección para agentes: chips que se agregan con Enter o coma, normalizados como
 * el identificador, sin repetidos, sin el propio identificador y hasta 10.
 */
import { useState } from 'react'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AgentAliasesInput } from '@/components/collections/agent-aliases-input'
import { renderWithProviders } from '@/test/render'

function Harness({ initial = [], slug = 'auditoria-ti', disabled = false, onChange }: {
  initial?: string[]
  slug?: string
  disabled?: boolean
  onChange?: (aliases: string[]) => void
}) {
  const [value, setValue] = useState<string[]>(initial)
  return (
    <AgentAliasesInput
      value={value}
      slug={slug}
      disabled={disabled}
      onChange={(aliases) => {
        setValue(aliases)
        onChange?.(aliases)
      }}
    />
  )
}

const input = () => screen.getByLabelText('Other names (aliases)')

describe('AgentAliasesInput', () => {
  it('agrega con Enter y con coma, normalizando lo escrito', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)

    await user.type(input(), 'Auditor TI{Enter}')
    await user.type(input(), 'aud,')

    expect(onChange).toHaveBeenLastCalledWith(['auditor-ti', 'aud'])
    expect(screen.getByText('auditor-ti')).toBeInTheDocument()
    expect(input()).toHaveValue('')
  })

  it('rechaza repetidos, el propio identificador y lo que no tiene letras ni números', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness initial={['auditor']} onChange={onChange} />)

    await user.type(input(), 'Auditor{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('"auditor" is already in the list')

    await user.clear(input())
    await user.type(input(), 'Auditoria TI{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('"auditoria-ti" is the agent identifier')

    await user.clear(input())
    await user.type(input(), '!!!{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('"!!!" is not valid')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('no pasa de 10', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => `a${i}`)
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness initial={ten} onChange={onChange} />)

    await user.type(input(), 'otro{Enter}')

    expect(screen.getByRole('alert')).toHaveTextContent('Up to 10 aliases')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('quita con la X del chip y con Backspace en el campo vacío', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness initial={['auditor', 'aud', 'revisor']} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Remove alias "aud"' }))
    expect(onChange).toHaveBeenLastCalledWith(['auditor', 'revisor'])

    await user.click(input())
    await user.keyboard('{Backspace}')
    expect(onChange).toHaveBeenLastCalledWith(['auditor'])
  })

  it('deshabilitado muestra los alias sin poder editarlos', () => {
    renderWithProviders(<Harness initial={['auditor']} disabled />)

    expect(screen.getByText('auditor')).toBeInTheDocument()
    expect(input()).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Remove alias "auditor"' })).not.toBeInTheDocument()
  })
})
