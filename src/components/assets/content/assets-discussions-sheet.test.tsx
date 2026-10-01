import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TDiscussion } from '@/components/plate-editor/components/discussion-kit'
import type { ContentSection } from '@/types/assets'

const state = vi.hoisted(() => ({
  discussions: [] as TDiscussion[],
  isLoading: false,
  canCreate: true,
  createExecutionDiscussion: vi.fn(),
  addComment: vi.fn(),
  resolveDiscussion: vi.fn(),
  deleteDiscussion: vi.fn(),
  refetch: vi.fn(),
}))

vi.mock('@/hooks/useDiscussions', () => ({
  useDiscussions: () => ({
    discussionsForExecution: state.discussions,
    usersMap: {
      u1: { id: 'u1', name: 'Ana Pérez', avatarUrl: '' },
      u2: { id: 'u2', name: 'Luis Gómez', avatarUrl: '' },
    },
    currentUserId: 'u1',
    isLoading: state.isLoading,
    isFetching: false,
    refetch: state.refetch,
    createExecutionDiscussion: state.createExecutionDiscussion,
    isCreatingExecutionDiscussion: false,
    addComment: state.addComment,
    isAddingComment: false,
    resolveDiscussion: state.resolveDiscussion,
    unresolveDiscussion: vi.fn(),
    deleteDiscussion: state.deleteDiscussion,
  }),
}))
vi.mock('@/hooks/useUserPermissions', () => ({
  useUserPermissions: () => ({
    canList: () => true,
    canCreate: () => state.canCreate,
    canUpdate: () => false,
    canDelete: () => false,
  }),
}))

import { AssetsDiscussionsSheet } from './assets-discussions-sheet'

function comment(id: string, discussionId: string, text: string, userId: string, extra = {}) {
  return {
    id,
    discussionId,
    contentRich: [{ type: 'p', children: [{ text }] }],
    createdAt: new Date('2026-03-01T10:00:00Z'),
    isEdited: false,
    isPublic: true,
    userId,
    ...extra,
  }
}

function discussion(over: Partial<TDiscussion> & Pick<TDiscussion, 'id'>): TDiscussion {
  return {
    comments: [],
    createdAt: new Date('2026-03-01T10:00:00Z'),
    isResolved: false,
    userId: 'u1',
    documentContent: '',
    sectionExecutionId: null,
    executionId: 'e1',
    ...over,
  } as TDiscussion
}

const sections = [{ id: 's1', section_name: 'Introducción' }] as unknown as ContentSection[]

function setup() {
  const onFocusDiscussion = vi.fn()
  render(
    <AssetsDiscussionsSheet
      open
      onOpenChange={vi.fn()}
      documentId="d1"
      executionId="e1"
      sections={sections}
      onFocusDiscussion={onFocusDiscussion}
    />,
  )
  return { onFocusDiscussion }
}

describe('AssetsDiscussionsSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.isLoading = false
    state.canCreate = true
    state.discussions = [
      discussion({
        id: 'd-section',
        sectionExecutionId: 's1',
        documentContent: 'texto citado',
        comments: [
          comment('c1', 'd-section', 'Revisar este punto', 'u1', { isPublic: false }),
          comment('c2', 'd-section', 'Listo, corregido', 'u2', { isEdited: true }),
        ],
      }),
      discussion({
        id: 'd-doc',
        userId: 'u2',
        comments: [comment('c3', 'd-doc', 'Comentario general', 'u2')],
      }),
      discussion({
        id: 'd-unknown',
        sectionExecutionId: 'gone',
        comments: [comment('c4', 'd-unknown', 'Sección borrada', 'u1')],
      }),
      discussion({
        id: 'd-resolved',
        isResolved: true,
        comments: [comment('c5', 'd-resolved', 'Ya resuelto', 'u1')],
      }),
    ]
  })

  it('muestra el resumen y un chip por alcance', () => {
    setup()

    expect(screen.getByText(/3 open · 1 resolved in this version/)).toBeInTheDocument()
    expect(screen.getByText('Introducción')).toBeInTheDocument()
    expect(screen.getByText('Whole document')).toBeInTheDocument()
    expect(screen.getByText('Unknown section')).toBeInTheDocument()
    const sectionRow = screen.getByText('Introducción').closest('article') as HTMLElement
    expect(within(sectionRow).getByText('Private')).toBeInTheDocument()
    expect(within(sectionRow).getByText('texto citado').closest('blockquote')).toHaveTextContent(
      '«texto citado»',
    )
    expect(screen.queryByText('Ya resuelto')).not.toBeInTheDocument()
  })

  it('el tab Resueltos muestra solo los hilos resueltos', async () => {
    setup()

    await userEvent.click(screen.getByRole('radio', { name: /Resolved/ }))

    expect(screen.getByText('Ya resuelto')).toBeInTheDocument()
    expect(screen.queryByText('Comentario general')).not.toBeInTheDocument()
  })

  it('filtra por texto y ofrece limpiar filtros cuando no hay resultados', async () => {
    setup()

    await userEvent.type(screen.getByRole('textbox', { name: 'Search comments…' }), 'inexistente')

    expect(await screen.findByText('No comments match these filters')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(await screen.findByText('Comentario general')).toBeInTheDocument()
  })

  it('despliega las respuestas del hilo con la marca de editado', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: '1 reply' }))

    expect(screen.getByText('Listo, corregido')).toBeInTheDocument()
    expect(screen.getByText('· edited')).toBeInTheDocument()
  })

  it('"Ver en el documento" enfoca el hilo de sección y no existe en el de documento', async () => {
    const { onFocusDiscussion } = setup()

    const links = screen.getAllByRole('button', { name: 'View in document →' })
    expect(links).toHaveLength(2)
    await userEvent.click(links[0])

    expect(onFocusDiscussion).toHaveBeenCalledWith('d-section', 's1')
  })

  it('el composer del pie deshabilita "Comentar" vacío y comenta público por defecto', async () => {
    setup()
    const submit = screen.getByRole('button', { name: 'Comment' })
    expect(submit).toBeDisabled()

    const visibility = screen.getByRole('button', { name: 'Change visibility' })
    expect(visibility).toHaveAttribute('title', 'Public')

    await userEvent.type(screen.getByRole('textbox', { name: 'Comment on this version…' }), 'Nuevo')
    await userEvent.click(submit)

    expect(state.createExecutionDiscussion).toHaveBeenCalledWith({
      contentRich: [{ type: 'p', children: [{ text: 'Nuevo' }] }],
      isPublic: true,
    })
  })

  it('el botón de visibilidad del pie alterna a privado y se envía como privado', async () => {
    setup()

    const visibility = screen.getByRole('button', { name: 'Change visibility' })
    await userEvent.click(visibility)
    expect(visibility).toHaveAttribute('title', 'Private')

    await userEvent.type(screen.getByRole('textbox', { name: 'Comment on this version…' }), 'Secreto')
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }))

    expect(state.createExecutionDiscussion).toHaveBeenCalledWith({
      contentRich: [{ type: 'p', children: [{ text: 'Secreto' }] }],
      isPublic: false,
    })
  })

  it('sin permiso de crear no hay composer ni "Responder"', () => {
    state.canCreate = false
    setup()

    expect(screen.queryByRole('button', { name: 'Comment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument()
  })

  it('muestra skeleton y oculta el composer mientras carga', () => {
    state.isLoading = true
    state.discussions = []
    setup()

    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Comment' })).not.toBeInTheDocument()
  })

  it('pide confirmación antes de eliminar un hilo propio', async () => {
    state.deleteDiscussion.mockResolvedValue(undefined)
    setup()

    const row = screen.getByText('Comentario general').closest('article') as HTMLElement
    expect(within(row).queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument()

    const ownRow = screen.getByText('Sección borrada').closest('article') as HTMLElement
    await userEvent.click(within(ownRow).getByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))

    expect(await screen.findByText('Delete discussion')).toBeInTheDocument()
  })
})
