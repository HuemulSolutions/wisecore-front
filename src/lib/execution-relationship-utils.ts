/**
 * Helpers puros compartidos por todo lo que muestra `ExecutionRelationshipWithDetails` —
 * el panel lateral (`assets-related-documents.tsx`) y la fuente `related_documents` del nodo
 * Plate `data_table` (`data-table-sources.ts`).
 */
import type {
  ExecutionRelationshipInlineExecution,
  ExecutionRelationshipWithDetails,
} from '@/types/execution-relationships';

/** Etiqueta visible de la relación: nombre del catálogo (default) o nombre libre (manual). */
export function getRelationshipLabel(rel: ExecutionRelationshipWithDetails, untitledFallback: string): string {
  const isManual = rel.relationship_type === 'manual' || !rel.document_type_relationship;
  return isManual
    ? rel.execution_relationship_name ?? untitledFallback
    : rel.document_type_relationship!.name;
}

/** La ejecución "del otro lado" de la relación, relativa a la dirección ya resuelta por el backend
 * (`direction: 'source'` = la relación sale del documento actual, así que el otro extremo es
 * `target_execution`; `'target'` = entra, el otro extremo es `source_execution`). */
export function getOtherExecution(rel: ExecutionRelationshipWithDetails): ExecutionRelationshipInlineExecution {
  return rel.direction === 'source' ? rel.target_execution : rel.source_execution;
}
