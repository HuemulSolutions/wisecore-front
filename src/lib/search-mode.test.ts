/**
 * Modos de búsqueda (Clásica / Avanzada / Profunda) y agrupación por activo.
 */
import { describe, expect, it } from 'vitest'

import { parseDisplayFromURL, parseModeFromURL } from '@/lib/search-mode'
import { groupPassagesByAsset } from '@/lib/search-passages'
import type { SearchPassage } from '@/types/search'

const url = (query: string) => new URLSearchParams(query)

function passage(id: string, rank: number, documentId: string): SearchPassage {
  return {
    passage_id: id,
    rank,
    score: 1 / rank,
    source_kind: 'section_output',
    text: `texto ${id}`,
    snippet: `texto ${id}`,
    context: null,
    citation: {
      document_id: documentId,
      document_name: `Activo ${documentId}`,
      internal_code: null,
      document_type_id: null,
      document_type_name: null,
      execution_id: `ex-${documentId}`,
      execution_name: null,
      version_string: null,
      lifecycle_state: null,
      section_execution_id: null,
      section_id: `sec-${id}`,
      section_name: `Sección ${id}`,
      heading_path: [],
      url: null,
    },
    media: [],
    related_assets: [],
  }
}

describe('parseModeFromURL', () => {
  it('abre en Avanzada por defecto y respeta mode', () => {
    expect(parseModeFromURL(url(''))).toBe('advanced')
    expect(parseModeFromURL(url('mode=classic'))).toBe('classic')
    expect(parseModeFromURL(url('mode=deep'))).toBe('deep')
    expect(parseModeFromURL(url('mode=otra'))).toBe('advanced')
  })

  it('traduce los enlaces anteriores (view=passages y high_precision)', () => {
    expect(parseModeFromURL(url('view=passages'))).toBe('advanced')
    expect(parseModeFromURL(url('view=passages&high_precision=true'))).toBe('deep')
    expect(parseModeFromURL(url('mode=classic&view=passages&high_precision=true'))).toBe('classic')
  })

  it('la presentación es por fragmento salvo group=asset', () => {
    expect(parseDisplayFromURL(url(''))).toBe('passage')
    expect(parseDisplayFromURL(url('group=asset'))).toBe('asset')
  })
})

describe('groupPassagesByAsset', () => {
  it('agrupa en el orden del mejor pasaje de cada activo', () => {
    const groups = groupPassagesByAsset([
      passage('p3', 3, 'A'),
      passage('p1', 1, 'B'),
      passage('p2', 2, 'A'),
      passage('p4', 4, 'C'),
      passage('p5', 5, 'B'),
    ])
    expect(groups.map((g) => g.documentId)).toEqual(['B', 'A', 'C'])
    expect(groups.map((g) => g.bestRank)).toEqual([1, 2, 4])
    expect(groups[0].passages.map((p) => p.passage_id)).toEqual(['p1', 'p5'])
    expect(groups[1].passages.map((p) => p.passage_id)).toEqual(['p2', 'p3'])
  })

  it('sin pasajes no hay grupos', () => {
    expect(groupPassagesByAsset([])).toEqual([])
  })
})
