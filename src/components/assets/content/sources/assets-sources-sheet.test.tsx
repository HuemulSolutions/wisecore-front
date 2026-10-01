import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { FakeXhr } from '@/test/fake-xhr'
import { server } from '@/test/msw/server'
import { respondApiError, respondOk } from '@/test/msw/respond'
import { AssetsSourcesSheet } from './assets-sources-sheet'

vi.mock('@/contexts/organization-context', () => ({
  useOrganization: () => ({ selectedOrganizationId: 'org-1' }),
}))
// El árbol de la biblioteca no es parte de lo que se prueba acá.
vi.mock('@/huemul/components/huemul-asset-tree-picker', () => ({
  HuemulAssetTreePickerDialog: () => null,
}))

const DOC_ID = 'doc-1'

const dependency = {
  id: 'd1',
  document_id: 'a1',
  document_name: 'Política de seguridad',
  section_name: null,
  dependency_type: 'document',
  version_mode: 'published',
  depends_on_execution_id: null,
  depends_on_execution_name: null,
  document_type: { id: 't1', name: 'Política', color: '#000000' },
}
const textReady = { id: 'c1', name: 'Glosario', content: 'hola mundo', context_type: 'text', required: false }
const filePending = { id: 'c2', name: 'Manual.pdf', content: null, context_type: 'file', required: true }
const textPending = { id: 'c3', name: 'Notas', content: null, context_type: 'text', required: true }

function mockSources(deps: unknown[] = [], contexts: unknown[] = []) {
  server.use(
    http.get(`${backendUrl}/context/${DOC_ID}/get_context`, () => respondOk(contexts)),
    http.get(`${backendUrl}/documents/${DOC_ID}/dependencies`, () => respondOk(deps)),
  )
}

function renderSheet(overrides: Partial<React.ComponentProps<typeof AssetsSourcesSheet>> = {}) {
  const onSwitchToEditor = vi.fn()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AssetsSourcesSheet
        selectedFile={{ id: DOC_ID }}
        isOpen
        onOpenChange={() => {}}
        lifecyclePermissions={{ create: true, edit: true }}
        stage="edit"
        isViewMode={false}
        onSwitchToEditor={onSwitchToEditor}
        {...overrides}
      />
    </QueryClientProvider>,
  )
  return { onSwitchToEditor, ...utils }
}

beforeEach(() => {
  vi.spyOn(toast, 'success').mockImplementation(() => 1)
  vi.spyOn(toast, 'info').mockImplementation(() => 1)
  vi.spyOn(toast, 'error').mockImplementation(() => 1)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('AssetsSourcesSheet — estados', () => {
  it('abre con el skeleton mientras carga y luego muestra el contenido', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.get(`${backendUrl}/context/${DOC_ID}/get_context`, async () => {
        await gate
        return respondOk([])
      }),
      http.get(`${backendUrl}/documents/${DOC_ID}/dependencies`, () => respondOk([])),
    )

    renderSheet()

    const skeleton = await screen.findByTestId('sources-skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    expect(skeleton).toHaveAccessibleName('Loading sources')
    expect(screen.queryByText('This asset has no sources yet')).not.toBeInTheDocument()

    release()
    expect(await screen.findByText('This asset has no sources yet')).toBeInTheDocument()
    expect(screen.queryByTestId('sources-skeleton')).not.toBeInTheDocument()
  })

  it('muestra el error con Reintentar, sin cerrar el panel', async () => {
    let attempts = 0
    server.use(
      http.get(`${backendUrl}/context/${DOC_ID}/get_context`, () => {
        attempts += 1
        return attempts === 1 ? respondApiError(500, 'INTERNAL_ERROR', 'boom') : respondOk([])
      }),
      http.get(`${backendUrl}/documents/${DOC_ID}/dependencies`, () => respondOk([])),
    )

    renderSheet()
    const user = userEvent.setup()

    expect(await screen.findByText("We couldn't load the sources")).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('This asset has no sources yet')).toBeInTheDocument()
    expect(screen.queryByText("We couldn't load the sources")).not.toBeInTheDocument()
  })

  it('vacío: pasos numerados y tarjetas de agregar debajo', async () => {
    mockSources()
    renderSheet()

    expect(await screen.findByText('This asset has no sources yet')).toBeInTheDocument()
    expect(screen.getByText('Choose a source: a WiseCore asset, a file or pasted text')).toBeInTheDocument()
    expect(screen.getByText('Mark the required ones')).toBeInTheDocument()
    expect(screen.getByText('Generate with AI')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Link asset/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upload file/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Paste text/ })).toBeInTheDocument()
    expect(screen.queryByTestId('sources-summary')).not.toBeInTheDocument()
    // Las tres acciones para agregar van después de los pasos
    const steps = screen.getByText('Mark the required ones')
    const linkAsset = screen.getByRole('button', { name: /Link asset/ })
    expect(steps.compareDocumentPosition(linkAsset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('con datos: grupos, resumen, alerta de pendientes y estados por fila', async () => {
    mockSources([dependency], [textReady, filePending, textPending])
    renderSheet()

    expect(await screen.findByText('Linked assets')).toBeInTheDocument()
    expect(screen.getByText('Files')).toBeInTheDocument()
    expect(screen.getByText('Texts')).toBeInTheDocument()

    const summary = screen.getByTestId('sources-summary')
    expect(within(summary).getByText('1 asset')).toBeInTheDocument()
    expect(within(summary).getByText('3 files and texts')).toBeInTheDocument()
    expect(within(summary).getByText('2 pending')).toBeInTheDocument()

    expect(screen.getByRole('alert')).toHaveTextContent('There are 2 required sources without content')
    // Sin columna de estado: lo pendiente se marca en la propia fila
    expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument()
    // La tercera columna (acciones) no tiene título: queda oculta para lectores de pantalla
    expect(screen.getAllByRole('columnheader').map((el) => el.textContent)).toEqual(['Source', 'Version / detail'])
    expect(screen.getAllByText('No content · blocks AI generation')).toHaveLength(2)
    expect(document.querySelectorAll('[data-testid="source-row"][data-pending]')).toHaveLength(2)
  })

  it('sin pendientes muestra "Completed" y ninguna alerta', async () => {
    mockSources([dependency], [textReady])
    renderSheet()

    const summary = await screen.findByTestId('sources-summary')
    expect(within(summary).getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByText(/required source/)).not.toBeInTheDocument()
  })
})

describe('AssetsSourcesSheet — avisos y solo lectura', () => {
  it('elaboración externa en curso: aviso ámbar y nada editable', async () => {
    mockSources([dependency], [filePending])
    renderSheet({ isExternalElaborationLocked: true })

    const notice = await screen.findByTestId('sources-notice')
    expect(notice).toHaveAttribute('data-kind', 'external')
    expect(notice).toHaveClass('bg-amber-50')
    expect(notice).toHaveTextContent('While it lasts, sources can be viewed but not changed. Editing returns when it finishes.')
    expect(screen.queryByRole('button', { name: /Link asset/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remove:/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Complete:/ })).not.toBeInTheDocument()
    // La alerta informa pero no ofrece completar
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument()
  })

  it('modo Lector con permiso: aviso gris con "Switch to Editor"', async () => {
    mockSources([dependency], [textReady])
    const { onSwitchToEditor } = renderSheet({ isViewMode: true })
    const user = userEvent.setup()

    const notice = await screen.findByTestId('sources-notice')
    expect(notice).toHaveAttribute('data-kind', 'reader')
    expect(notice).toHaveTextContent('To add or remove sources, switch to Editor mode.')
    expect(screen.queryByRole('button', { name: /Paste text/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to Editor' }))
    expect(onSwitchToEditor).toHaveBeenCalledTimes(1)
  })

  it('sin permiso de edición: aviso de solo lectura', async () => {
    mockSources([dependency], [textReady])
    renderSheet({ lifecyclePermissions: { review: true } })

    const notice = await screen.findByTestId('sources-notice')
    expect(notice).toHaveAttribute('data-kind', 'readOnly')
    expect(notice).toHaveTextContent('Your profile can view the sources but not change them.')
    expect(screen.queryByRole('button', { name: /Switch to Editor/ })).not.toBeInTheDocument()
  })

  it('en solo lectura el selector de versión se ve pero no abre', async () => {
    mockSources([dependency], [])
    renderSheet({ isViewMode: true })

    expect(await screen.findByText('Published')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Version the AI uses/ })).not.toBeInTheDocument()
  })

  it('sin ningún permiso sobre el activo no renderiza el panel', () => {
    mockSources()
    renderSheet({ lifecyclePermissions: {} })

    expect(screen.queryByText('Sources')).not.toBeInTheDocument()
  })
})

describe('AssetsSourcesSheet — acciones', () => {
  it('el selector de versión actualiza el modo de la dependencia', async () => {
    mockSources([dependency], [])
    let patchBody: unknown = null
    server.use(
      http.patch(`${backendUrl}/documents/${DOC_ID}/dependencies/d1`, async ({ request }) => {
        patchBody = await request.json()
        return respondOk({ ...dependency, version_mode: 'latest_approved' })
      }),
    )
    renderSheet()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Version the AI uses: Published/ }))
    await user.click(screen.getByRole('menuitem', { name: /Latest approved/ }))

    await waitFor(() => expect(patchBody).toEqual({ version_mode: 'latest_approved', depends_on_execution_id: null }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Version updated'))
  })

  it('"Pegar texto" crea una fuente; Guardar exige nombre y respeta Obligatorio', async () => {
    mockSources([], [])
    let postBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${backendUrl}/context/${DOC_ID}/add_text`, async ({ request }) => {
        postBody = (await request.json()) as Record<string, unknown>
        return respondOk({ id: 'new' })
      }),
    )
    renderSheet()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Paste text/ }))
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Source name'), 'Reglas internas')
    expect(save).toBeEnabled()

    // Sin contenido y sin "Obligatorio": se rechaza con el aviso inline y no se envía nada
    await user.click(save)
    expect(screen.getByRole('alert')).toHaveTextContent('Add the text')
    expect(postBody).toBeNull()

    await user.click(screen.getByRole('checkbox', { name: /Required/ }))
    await user.click(save)

    await waitFor(() => expect(postBody).toMatchObject({ name: 'Reglas internas', required: true }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Text added'))
  })

  it('editar un texto precarga el formulario y guarda con PATCH', async () => {
    mockSources([], [textReady])
    let patchBody: Record<string, unknown> | null = null
    server.use(
      http.patch(`${backendUrl}/context/c1/text`, async ({ request }) => {
        patchBody = (await request.json()) as Record<string, unknown>
        return respondOk({ id: 'c1' })
      }),
    )
    renderSheet()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Edit: Glosario' }))
    expect(screen.getByRole('heading', { name: 'Edit text' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Source name')).toHaveValue('Glosario')
    expect(screen.getByPlaceholderText('Paste or write the text')).toHaveValue('hola mundo')

    await user.clear(screen.getByPlaceholderText('Source name'))
    await user.type(screen.getByPlaceholderText('Source name'), 'Glosario v2')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(patchBody).toMatchObject({ name: 'Glosario v2', content: 'hola mundo', required: false }),
    )
  })

  it('"Complete" de la alerta abre la primera pendiente; en un texto abre el formulario de edición', async () => {
    mockSources([], [textPending])
    renderSheet()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Complete' }))

    expect(screen.getByRole('heading', { name: 'Edit text' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Source name')).toHaveValue('Notas')
    expect(screen.getByRole('checkbox', { name: /Required/ })).toBeChecked()
  })

  it('quitar un texto pide confirmación y avisa "Source removed"', async () => {
    mockSources([], [textReady])
    let deleted = false
    server.use(
      http.delete(`${backendUrl}/context/c1`, () => {
        deleted = true
        return respondOk(null)
      }),
    )
    renderSheet()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Remove: Glosario' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(deleted).toBe(true))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Source removed'))
  })

  it('quitar un activo vinculado avisa "Dependency removed"', async () => {
    mockSources([dependency], [])
    server.use(
      http.delete(`${backendUrl}/documents/${DOC_ID}/dependencies/d1`, () => new HttpResponse(null, { status: 200 })),
    )
    renderSheet()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Remove: Política de seguridad' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Dependency removed'))
  })
})

describe('AssetsSourcesSheet — subida de archivos', () => {
  it('muestra el progreso real y permite cancelar la subida', async () => {
    mockSources([], [])
    FakeXhr.reset()
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    renderSheet()
    const user = userEvent.setup()

    await screen.findByText('This asset has no sources yet')
    const file = new File(['%PDF'], 'contrato.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByTestId('sources-upload-input'), file)

    expect(await screen.findByTestId('source-upload-row')).toHaveTextContent('contrato.pdf')
    FakeXhr.last.emitProgress(64, 100)
    expect(await screen.findByText('Uploading · 64%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Cancel upload: contrato.pdf/ }))

    await waitFor(() => expect(screen.queryByTestId('source-upload-row')).not.toBeInTheDocument())
    expect(FakeXhr.last.aborted).toBe(true)
    expect(toast.info).toHaveBeenCalledWith('Upload cancelled')
  })
})
