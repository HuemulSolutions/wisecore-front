import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocumentContent } from '@/services/assets';
import { useLifecycleActions } from '@/hooks/useLifecycleActions';
import { executionQueryKeys } from '@/hooks/useAllExecutions';
import { HuemulLifecycleActions } from '@/huemul/components/huemul-lifecycle-actions';
import { HuemulLifecycleSheets } from '@/huemul/components/huemul-lifecycle-sheets';
import { HomeWorkGroupRow } from './home-work-group-row';
import type { HomeWorkGroupRow as HomeWorkGroupRowData } from '@/types/home';

export interface HomeApprovedRowProps {
  row: HomeWorkGroupRowData;
  organizationId: string;
  /** `can('transitionAsset')` — asset:u. Sin permiso la fila queda navegable, sin botón. */
  canTransition: boolean;
  onOpen: () => void;
  isExiting: boolean;
  /** Se dispara una sola vez cuando `advanceMutation` pasa de pending a success. */
  onPublished: (rowId: string, documentName: string) => void;
}

/**
 * Fila real del grupo "Aprobados" — a diferencia de `HomeWorkGroupRow` (chrome
 * genérico), esta monta su propio `useLifecycleActions` para tener un botón
 * "Publicar" que funciona de verdad, sin esperar al Punto 4 del spec de
 * backend (que resolvería esto para 12+ filas sin el N+1 de acá). Con solo 3
 * filas visibles por card, 3 requests extra a `GET /documents/{id}/content`
 * es un costo aceptable — mismo query key que ya usa `assets-content.tsx`,
 * así que si el usuario tiene el activo abierto en otra pestaña comparte caché.
 */
export function HomeApprovedRow({ row, organizationId, canTransition, onOpen, isExiting, onPublished }: HomeApprovedRowProps) {
  const { data: documentContent } = useQuery({
    queryKey: ['document-content', row.documentId],
    queryFn: () => getDocumentContent(row.documentId, organizationId),
    staleTime: 30_000,
  });

  const lifecycle = useLifecycleActions({
    documentId: row.documentId,
    executionId: row.id,
    organizationId,
    documentTypeId: documentContent?.document_type?.id,
    lifecycleStatus: documentContent?.lifecycle_status,
    lifecyclePermissions: documentContent?.lifecycle_permissions,
    rbac: { canTransition },
    // La lista "Aprobados" del Home no está entre las keys que
    // `useLifecycleActions` refresca por default (solo document-content y
    // document-section-access) — sin esto, publicar dejaría la fila
    // fantasma en la card hasta el próximo refresh manual.
    extraRefreshKeys: () => [executionQueryKeys.listBase()],
  });

  // Detecta la transición pending→success de `advanceMutation` (Publicar) una
  // sola vez por mutate — no hay forma de inyectar un onSuccess por-llamada:
  // `HuemulLifecycleSheets` arma el `.mutate(...)` internamente, compartido
  // con el resto de la app.
  const wasPendingRef = useRef(false);
  useEffect(() => {
    if (wasPendingRef.current && !lifecycle.advanceMutation.isPending && lifecycle.advanceMutation.isSuccess) {
      onPublished(row.id, row.documentName);
    }
    wasPendingRef.current = lifecycle.advanceMutation.isPending;
  }, [lifecycle.advanceMutation.isPending, lifecycle.advanceMutation.isSuccess, onPublished, row.id, row.documentName]);

  return (
    <>
      <HomeWorkGroupRow
        row={row}
        onOpen={onOpen}
        isExiting={isExiting}
        actions={canTransition ? <HuemulLifecycleActions controller={lifecycle} variant="row" hideComplete /> : undefined}
      />
      <HuemulLifecycleSheets controller={lifecycle} executionId={row.id} organizationId={organizationId} />
    </>
  );
}
