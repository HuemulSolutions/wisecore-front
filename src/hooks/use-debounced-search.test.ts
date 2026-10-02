import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedSearch } from '@/hooks/use-debounced-search'

describe('useDebouncedSearch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('queda pendiente hasta que el texto (sin espacios) se asienta', () => {
    const { result, rerender } = renderHook(({ query }) => useDebouncedSearch(query, 300), {
      initialProps: { query: 'ana' },
    })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toEqual({ debounced: 'ana', isPending: false })

    rerender({ query: 'ana pérez' })
    expect(result.current).toEqual({ debounced: 'ana', isPending: true })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toEqual({ debounced: 'ana pérez', isPending: false })

    // Solo espacios de más no es una búsqueda nueva.
    rerender({ query: '  ana pérez ' })
    expect(result.current.isPending).toBe(false)
  })
})
