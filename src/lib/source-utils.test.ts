import { describe, expect, it } from 'vitest'

import { buildSourceGroups, countPendingSources, getSourceFileType, isContextPending } from './source-utils'

describe('isContextPending', () => {
  it('solo es pendiente si es obligatorio y no tiene contenido útil', () => {
    expect(isContextPending({ required: true, content: null })).toBe(true)
    expect(isContextPending({ required: true, content: '   ' })).toBe(true)
    expect(isContextPending({ required: true, content: 'texto' })).toBe(false)
    expect(isContextPending({ required: false, content: null })).toBe(false)
    expect(isContextPending({ content: null })).toBe(false)
  })
})

describe('getSourceFileType', () => {
  it.each([
    ['manual.PDF', 'pdf'],
    ['informe.docx', 'word'],
    ['datos.xlsm', 'excel'],
    ['notas.md', 'text'],
    ['imagen.png', 'other'],
    ['sin-extension', 'other'],
  ])('%s → %s', (name, expected) => {
    expect(getSourceFileType(name)).toBe(expected)
  })
})

describe('buildSourceGroups', () => {
  const dependency = {
    id: 'd1',
    document_id: 'a1',
    document_name: 'Política',
    section_name: null,
    dependency_type: 'document',
    version_mode: 'published' as const,
    depends_on_execution_id: null,
    depends_on_execution_name: null,
  }

  it('separa activos, archivos y textos y calcula pendientes y caracteres', () => {
    const groups = buildSourceGroups(
      [dependency],
      [
        { id: 'c1', name: 'Glosario', content: 'hola', context_type: 'text', required: false },
        { id: 'c2', name: 'Manual.pdf', content: null, context_type: 'file', required: true },
        { id: 'c3', name: 'Notas', content: null, context_type: 'text', required: true },
      ],
    )

    expect(groups.assets.map((row) => row.name)).toEqual(['Política'])
    expect(groups.files.map((row) => [row.name, row.fileType, row.pending])).toEqual([['Manual.pdf', 'pdf', true]])
    expect(groups.texts.map((row) => [row.name, row.characters, row.pending])).toEqual([
      ['Glosario', 4, false],
      ['Notas', 0, true],
    ])
  })

  it('cualquier context_type distinto de "text" es un archivo', () => {
    const groups = buildSourceGroups([], [{ id: 'c1', name: 'x.docx', content: 'a', context_type: 'document' }])
    expect(groups.files).toHaveLength(1)
    expect(groups.texts).toHaveLength(0)
  })

  it('tolera entradas vacías', () => {
    expect(buildSourceGroups()).toEqual({ assets: [], files: [], texts: [] })
  })
})

describe('countPendingSources', () => {
  it('cuenta solo los contextos obligatorios sin contenido', () => {
    expect(
      countPendingSources([
        { id: '1', name: 'a', content: null, required: true },
        { id: '2', name: 'b', content: 'x', required: true },
        { id: '3', name: 'c', content: null },
      ]),
    ).toBe(1)
    expect(countPendingSources(undefined)).toBe(0)
  })
})
