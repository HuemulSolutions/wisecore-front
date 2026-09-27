import { useEffect, useMemo } from "react";
import { CustomFieldsList } from "@/components/assets/content/assets-custom-fields-list";
import type { CustomFieldDocument } from "@/types/custom-fields";

export interface AssetsPanelFieldsTabProps {
  /** Todos los campos del documento (fetch server-side sin paginar, hasta 100 —
   * misma query que la validación preventiva del lifecycle, ver assets-content.tsx). */
  customFields: CustomFieldDocument[];
  isLoading: boolean;
  isRefreshing: boolean;
  /** Paginado CLIENTE (mismo tamaño que el fetch, 100) — no viaja al backend. */
  page: number;
  pageSize: number;
  uploadingImageFieldId?: string | null;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (field: CustomFieldDocument) => void;
  onEditContent: (field: CustomFieldDocument) => void;
  onDelete: (field: CustomFieldDocument) => void;
  onRefresh: () => void;
}

/**
 * Tab "Campos" del panel de detalle — wrapper de `CustomFieldsList` con
 * `showHeader={false}` (título/refresh/"+" los pone `AssetsDetailPanel`) y
 * paginado hecho en el cliente sobre el array ya cargado (mismo tamaño que el fetch).
 */
export function AssetsPanelFieldsTab({
  customFields,
  isLoading,
  isRefreshing,
  page,
  pageSize,
  uploadingImageFieldId,
  canCreate,
  canUpdate,
  canDelete,
  onPageChange,
  onAdd,
  onEdit,
  onEditContent,
  onDelete,
  onRefresh,
}: AssetsPanelFieldsTabProps) {
  const pageItems = useMemo(
    () => customFields.slice((page - 1) * pageSize, page * pageSize),
    [customFields, page, pageSize],
  );

  // Si se elimina el único campo de la última página, no dejar el paginado varado
  // en una página vacía.
  useEffect(() => {
    if (page > 1 && pageItems.length === 0 && customFields.length > 0) {
      onPageChange(Math.max(1, Math.ceil(customFields.length / pageSize)));
    }
  }, [page, pageItems.length, customFields.length, pageSize, onPageChange]);

  return (
    <CustomFieldsList
      showHeader={false}
      customFields={pageItems}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onAdd={onAdd}
      onEdit={onEdit}
      onEditContent={onEditContent}
      onDelete={onDelete}
      onRefresh={onRefresh}
      uploadingImageFieldId={uploadingImageFieldId}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
      page={page}
      pageSize={pageSize}
      totalItems={customFields.length}
      hasNext={page * pageSize < customFields.length}
      onPageChange={onPageChange}
    />
  );
}
