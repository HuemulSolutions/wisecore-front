import { createRef } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HuemulFileTree } from '@/huemul/components/huemul-file-tree'
import type { HuemulFileTreeProps, HuemulFileTreeRef, HuemulTreeNode, HuemulTreePage } from '@/types/huemul'

// jsdom no trae IntersectionObserver: este stub deja disparar la intersección a mano.
class IntersectionObserverStub {
  static instances: IntersectionObserverStub[] = []
  private target: Element | null = null
  private readonly callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    IntersectionObserverStub.instances.push(this)
  }
  observe(el: Element) { this.target = el }
  unobserve() {}
  disconnect() {
    IntersectionObserverStub.instances = IntersectionObserverStub.instances.filter((i) => i !== this)
  }
  trigger() {
    this.callback(
      [{ isIntersecting: true, target: this.target } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

const doc = (i: number): HuemulTreeNode => ({ id: `d${i}`, name: `Doc ${i}`, type: 'document' })
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k) => doc(from + k))
const folder = (id: string, name: string): HuemulTreeNode => ({ id, name, type: 'folder', hasChildren: true })

type Loader = NonNullable<HuemulFileTreeProps['onLoadChildren']>

// Raíz con las carpetas dadas; cada carpeta tiene 143 hijos paginados de a 25
// (página 1 = Doc 1..25, cursor "c2" = Doc 26..50, cursor "c3" cierra).
function pagedLoader(rootFolders: HuemulTreeNode[] = [folder('f1', 'Docs')]) {
  return vi.fn<Loader>(async (folderId, _node, page): Promise<HuemulTreePage> => {
    if (folderId === null) return { items: rootFolders, hasMore: false, nextCursor: null }
    if (page?.cursor === 'c2') return { items: range(26, 50), total: 143, hasMore: true, nextCursor: 'c3' }
    return { items: range(1, 25), total: 143, hasMore: true, nextCursor: 'c2' }
  })
}

const folderCalls = (loader: ReturnType<typeof pagedLoader>, id: string) =>
  loader.mock.calls.filter((call) => call[0] === id)

beforeEach(() => {
  IntersectionObserverStub.instances = []
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('HuemulFileTree — paginación por nodo', () => {
  it('al expandir pide la primera página y muestra "Mostrar más" con el avance', async () => {
    const loader = pagedLoader()
    const user = userEvent.setup()
    render(<HuemulFileTree onLoadChildren={loader} />)

    await user.click(await screen.findByText('Docs'))

    expect(await screen.findByRole('button', { name: /Show 25 more/ })).toBeInTheDocument()
    expect(screen.getByText('25 of 143')).toBeInTheDocument()
    // contador de la carpeta junto al nombre
    expect(screen.getByText('143')).toBeInTheDocument()
    expect(loader).toHaveBeenCalledWith('f1', expect.objectContaining({ id: 'f1' }), { cursor: null, limit: 25 })
  })

  it('"Mostrar más" agrega solo a esa carpeta y no recarga el resto del árbol', async () => {
    const loader = pagedLoader()
    const user = userEvent.setup()
    render(<HuemulFileTree onLoadChildren={loader} />)

    await user.click(await screen.findByText('Docs'))
    await user.click(await screen.findByRole('button', { name: /Show 25 more/ }))

    expect(await screen.findByText('Doc 26')).toBeInTheDocument()
    expect(screen.getByText('Doc 1')).toBeInTheDocument()
    expect(screen.getByText('50 of 143')).toBeInTheDocument()
    expect(loader).toHaveBeenCalledWith('f1', expect.objectContaining({ id: 'f1' }), { cursor: 'c2', limit: 25 })
    // la raíz se pidió una sola vez: nada más se recargó
    expect(loader.mock.calls.filter((call) => call[0] === null)).toHaveLength(1)
  })

  it('colapsar y volver a expandir conserva lo cargado sin pedir de nuevo', async () => {
    const loader = pagedLoader()
    const user = userEvent.setup()
    render(<HuemulFileTree onLoadChildren={loader} />)

    await user.click(await screen.findByText('Docs'))
    await user.click(await screen.findByRole('button', { name: /Show 25 more/ }))
    await screen.findByText('Doc 26')

    await user.click(screen.getByText('Docs'))
    expect(screen.queryByText('Doc 26')).not.toBeInTheDocument()
    await user.click(screen.getByText('Docs'))

    expect(screen.getByText('Doc 26')).toBeInTheDocument()
    expect(screen.getByText('50 of 143')).toBeInTheDocument()
    expect(folderCalls(loader, 'f1')).toHaveLength(2)
  })

  it('refresh repite las mismas páginas que estaban visibles', async () => {
    const loader = pagedLoader()
    const ref = createRef<HuemulFileTreeRef>()
    const user = userEvent.setup()
    render(<HuemulFileTree ref={ref} onLoadChildren={loader} />)

    await user.click(await screen.findByText('Docs'))
    await user.click(await screen.findByRole('button', { name: /Show 25 more/ }))
    await screen.findByText('Doc 26')

    await act(async () => {
      await ref.current!.refresh()
    })

    // 2 páginas al abrir + las mismas 2 al refrescar, encadenando el cursor
    expect(folderCalls(loader, 'f1').map((call) => call[2]?.cursor)).toEqual([null, 'c2', null, 'c2'])
    expect(await screen.findByText('Doc 26')).toBeInTheDocument()
    expect(screen.getByText('50 of 143')).toBeInTheDocument()
  })

  it('un consumidor que devuelve un array no ve "Mostrar más" ni contador', async () => {
    const loader = vi.fn<Loader>(async (folderId) =>
      folderId === null ? [folder('f1', 'Docs')] : range(1, 3),
    )
    const user = userEvent.setup()
    render(<HuemulFileTree onLoadChildren={loader} />)

    await user.click(await screen.findByText('Docs'))

    expect(await screen.findByText('Doc 3')).toBeInTheDocument()
    expect(screen.queryByText(/Show .* more/)).not.toBeInTheDocument()
    expect(screen.queryByText(/ of /)).not.toBeInTheDocument()
  })

  describe('autocarga', () => {
    it('solo la fila del final del árbol observa el scroll', async () => {
      const loader = pagedLoader([folder('f1', 'Docs A'), folder('f2', 'Docs B')])
      const user = userEvent.setup()
      render(<HuemulFileTree onLoadChildren={loader} />)

      // f1 no es la última raíz: su fila se carga solo con clic
      await user.click(await screen.findByText('Docs A'))
      await screen.findByRole('button', { name: /Show 25 more/ })
      expect(IntersectionObserverStub.instances).toHaveLength(0)

      // f2 expandida cierra el árbol: ahora su fila es la de la cola
      await user.click(screen.getByText('Docs B'))
      await waitFor(() => expect(screen.getAllByRole('button', { name: /Show 25 more/ })).toHaveLength(2))
      expect(IntersectionObserverStub.instances).toHaveLength(1)
    })

    it('al llegar al final carga la siguiente página una sola vez aunque el observer dispare dos', async () => {
      let release!: () => void
      const gate = new Promise<void>((resolve) => { release = resolve })
      const loader = vi.fn<Loader>(async (folderId, _node, page): Promise<HuemulTreePage> => {
        if (folderId === null) return { items: [folder('f1', 'Docs')], hasMore: false, nextCursor: null }
        if (page?.cursor === 'c2') {
          await gate
          return { items: range(26, 50), total: 143, hasMore: false, nextCursor: null }
        }
        return { items: range(1, 25), total: 143, hasMore: true, nextCursor: 'c2' }
      })
      const user = userEvent.setup()
      render(<HuemulFileTree onLoadChildren={loader} />)

      await user.click(await screen.findByText('Docs'))
      await screen.findByRole('button', { name: /Show 25 more/ })
      expect(IntersectionObserverStub.instances).toHaveLength(1)

      const observer = IntersectionObserverStub.instances[0]
      act(() => {
        observer.trigger()
        observer.trigger()
      })
      expect(folderCalls(loader, 'f1').filter((call) => call[2]?.cursor === 'c2')).toHaveLength(1)

      await act(async () => { release() })
      expect(await screen.findByText('Doc 26')).toBeInTheDocument()
      // sin más páginas desaparece la fila
      expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument()
    })
  })

  it('un "Mostrar más" fallido conserva lo cargado y deja reintentar', async () => {
    let fail = true
    const loader = vi.fn<Loader>(async (folderId, _node, page): Promise<HuemulTreePage> => {
      if (folderId === null) return { items: [folder('f1', 'Docs')], hasMore: false, nextCursor: null }
      if (page?.cursor === 'c2') {
        if (fail) throw new Error('boom')
        return { items: range(26, 50), total: 143, hasMore: false, nextCursor: null }
      }
      return { items: range(1, 25), total: 143, hasMore: true, nextCursor: 'c2' }
    })
    const user = userEvent.setup()
    render(<HuemulFileTree onLoadChildren={loader} />)

    await user.click(await screen.findByText('Docs'))
    await user.click(await screen.findByRole('button', { name: /Show 25 more/ }))

    // sigue lo ya cargado y la fila quedó habilitada
    await waitFor(() => expect(screen.getByRole('button', { name: /Show 25 more/ })).toBeEnabled())
    expect(screen.getByText('Doc 25')).toBeInTheDocument()

    fail = false
    await user.click(screen.getByRole('button', { name: /Show 25 more/ }))
    expect(await screen.findByText('Doc 26')).toBeInTheDocument()
  })

  it('la selección en cascada de una carpeta recorre todas sus páginas', async () => {
    const loader = vi.fn<Loader>(async (folderId, _node, page): Promise<HuemulTreePage> => {
      if (folderId === null) return { items: [folder('f1', 'Docs')], hasMore: false, nextCursor: null }
      if (page?.cursor === 'c2') return { items: [doc(3), doc(4)], hasMore: false, nextCursor: null }
      return { items: [doc(1), doc(2)], hasMore: true, nextCursor: 'c2' }
    })
    const onSelectionChange = vi.fn()
    const user = userEvent.setup()
    render(
      <HuemulFileTree
        onLoadChildren={loader}
        cascadeSelection
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    )

    await user.click(await screen.findByRole('checkbox', { name: 'Docs' }))

    await waitFor(() => expect(onSelectionChange).toHaveBeenCalled())
    expect(Array.from(onSelectionChange.mock.calls[0][0] as Set<string>).sort()).toEqual(['d1', 'd2', 'd3', 'd4'])
  })
})
