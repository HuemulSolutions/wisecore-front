import type { ContextItem } from '@/types/context'
import type { Dependency } from '@/types/dependency/sheets'
import type {
  AssetSourceRow,
  ContextSourceRow,
  SourceFileType,
  SourceGroups,
} from '@/types/assets/sources'

/** Obligatoria y sin contenido: misma regla que `context-add.tsx`. Bloquea la generación con IA. */
export function isContextPending(context: Pick<ContextItem, 'required' | 'content'>): boolean {
  return !!context.required && !context.content?.trim()
}

const FILE_TYPE_BY_EXTENSION: Record<string, SourceFileType> = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  xls: 'excel',
  xlsx: 'excel',
  xlsm: 'excel',
  txt: 'text',
  md: 'text',
}

/** El backend no guarda MIME: el tipo sale de la extensión del nombre. */
export function getSourceFileType(name: string): SourceFileType {
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  return FILE_TYPE_BY_EXTENSION[extension] ?? 'other'
}

/** Convierte las respuestas crudas en filas tipadas, separadas en los tres grupos de la tabla. */
export function buildSourceGroups(
  dependencies: Dependency[] = [],
  contexts: ContextItem[] = [],
): SourceGroups {
  const assets: AssetSourceRow[] = dependencies.map((dependency) => ({
    key: `asset:${dependency.id}`,
    kind: 'asset',
    name: dependency.document_name,
    dependency,
  }))

  const files: ContextSourceRow[] = []
  const texts: ContextSourceRow[] = []
  for (const context of contexts) {
    const isText = context.context_type === 'text'
    const row: ContextSourceRow = {
      key: `context:${context.id}`,
      kind: isText ? 'text' : 'file',
      name: context.name,
      context,
      required: !!context.required,
      pending: isContextPending(context),
      fileType: isText ? null : getSourceFileType(context.name),
      characters: context.content?.length ?? 0,
    }
    ;(isText ? texts : files).push(row)
  }

  return { assets, files, texts }
}

/** Cuántas fuentes obligatorias siguen sin contenido (solo los contextos pueden serlo). */
export function countPendingSources(contexts: ContextItem[] | undefined): number {
  return contexts?.filter(isContextPending).length ?? 0
}
