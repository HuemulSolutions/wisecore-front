/**
 * Hoja de crear colección: audiencia (personas o agentes, con su permiso), tipo de
 * agente explicado, reglas generales y el 409 del identificador.
 */
import { http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { CollectionFormSheet } from '@/components/collections/collection-form-sheet'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondApiError, respondOk } from '@/test/msw/respond'
import type { Collection } from '@/types/collections'

const saved: Collection = {
  id: 'col-1',
  name: 'Arquitectura',
  description: null,
  instructions: null,
  show_instructions_in_menu: false,
  is_public: false,
  for_agent: false,
  agent_slug: null,
  agent_usage: null,
  agent_kind: 'knowledge',
  created_by: null,
  updated_by: null,
  created_at: null,
  updated_at: null,
}

function captureCreate(respond: (body: unknown) => Response) {
  const bodies: unknown[] = []
  server.use(
    http.post(`${backendUrl}/collections/`, async ({ request }) => {
      const body = await request.json()
      bodies.push(body)
      return respond(body)
    }),
  )
  return bodies
}

describe('CollectionFormSheet', () => {
  it('una colección para personas manda solo los campos generales y las reglas', async () => {
    const bodies = captureCreate((body) => respondOk({ ...saved, ...(body as object) }))
    const { user } = renderWithProviders(
      <CollectionFormSheet open onOpenChange={() => {}} collection={null} canManageAgentCollections />,
    )

    await user.type(screen.getByPlaceholderText(/Onboarding for new analysts/), 'Inducción')
    await user.type(screen.getByPlaceholderText(/Read the assets in order/), 'Lee en orden.')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      name: 'Inducción',
      description: undefined,
      instructions: 'Lee en orden.',
      show_instructions_in_menu: false,
      is_public: false,
      for_agent: false,
    })
  })

  it('para agentes sugiere el identificador, exige cuándo usarla y manda el tipo elegido', async () => {
    const bodies = captureCreate((body) => respondOk({ ...saved, ...(body as object) }))
    const { user } = renderWithProviders(
      <CollectionFormSheet open onOpenChange={() => {}} collection={null} canManageAgentCollections />,
    )

    await user.type(screen.getByPlaceholderText(/Onboarding for new analysts/), 'Revisor de Contratos')
    await user.click(screen.getByRole('radio', { name: /AI agents/ }))
    expect(screen.getByDisplayValue('revisor-de-contratos')).toBeInTheDocument()
    expect(screen.getByText(/Not a platform role and grants no permissions/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(await screen.findByText('Describe when agents should use it')).toBeInTheDocument()
    expect(bodies).toHaveLength(0)

    await user.type(screen.getByPlaceholderText(/Before designing, writing or reviewing/), 'Al revisar contratos')
    await user.click(screen.getByRole('radio', { name: /Behavior/ }))
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      name: 'Revisor de Contratos',
      for_agent: true,
      agent_slug: 'revisor-de-contratos',
      agent_usage: 'Al revisar contratos',
      agent_kind: 'behavior',
    })
  })

  it('el identificador sigue al nombre hasta que se edita a mano', async () => {
    const { user } = renderWithProviders(
      <CollectionFormSheet open onOpenChange={() => {}} collection={null} canManageAgentCollections />,
    )
    const name = screen.getByPlaceholderText(/Onboarding for new analysts/)
    await user.click(screen.getByRole('radio', { name: /AI agents/ }))
    await user.type(name, 'Guía Backend')
    const slug = screen.getByDisplayValue('guia-backend')

    await user.clear(slug)
    await user.type(slug, 'backend')
    await user.type(name, ' v2')
    expect(screen.getByDisplayValue('backend')).toBeInTheDocument()
  })

  it('sin el permiso de agentes la opción queda deshabilitada y se explica', () => {
    renderWithProviders(
      <CollectionFormSheet open onOpenChange={() => {}} collection={null} canManageAgentCollections={false} />,
    )
    expect(screen.getByRole('radio', { name: /AI agents/ })).toBeDisabled()
    expect(screen.getByText('You need the permission to create collections for agents.')).toBeInTheDocument()
  })

  it('un 409 marca el identificador como duplicado', async () => {
    captureCreate(() => respondApiError(409, 'AGENT_SLUG_CONFLICT', 'agent_slug already exists'))
    const { user } = renderWithProviders(
      <CollectionFormSheet open onOpenChange={() => {}} collection={null} canManageAgentCollections />,
    )

    await user.type(screen.getByPlaceholderText(/Onboarding for new analysts/), 'Arquitectura')
    await user.click(screen.getByRole('radio', { name: /AI agents/ }))
    await user.type(screen.getByPlaceholderText(/Before designing, writing or reviewing/), 'uso')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    const messages = await screen.findAllByText('Another collection already uses the identifier "arquitectura". Choose a different one.')
    expect(messages.length).toBeGreaterThanOrEqual(1)
  })
})
