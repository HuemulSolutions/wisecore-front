import { forwardRef, useImperativeHandle, useRef } from "react";
import { AssetsRelatedDocuments, type AssetsRelatedDocumentsHandle } from "@/components/assets/content/assets-related-documents";

export interface AssetsPanelLinksTabProps {
  organizationId: string;
  executionId?: string;
  currentDocumentId?: string;
  versionLabel?: string;
  canOpenDiagrams: boolean;
  canListAssetTypes: boolean;
  canDeleteRelationship: boolean;
  onFetchingChange?: (isFetching: boolean) => void;
  onCountChange?: (count: number) => void;
}

export interface AssetsPanelLinksTabHandle {
  refresh: () => void | Promise<unknown>;
}

/**
 * Tab "Vínculos" del panel de detalle — wrapper delgado de `AssetsRelatedDocuments`
 * en variant="panel" (sin su Collapsible/header propio: el título y el refresh los
 * pone `AssetsDetailPanel`).
 */
export const AssetsPanelLinksTab = forwardRef<AssetsPanelLinksTabHandle, AssetsPanelLinksTabProps>(
  function AssetsPanelLinksTab(props, ref) {
    const innerRef = useRef<AssetsRelatedDocumentsHandle>(null);
    useImperativeHandle(ref, () => ({ refresh: () => innerRef.current?.refresh() }), []);

    return (
      <AssetsRelatedDocuments
        ref={innerRef}
        variant="panel"
        organizationId={props.organizationId}
        executionId={props.executionId}
        currentDocumentId={props.currentDocumentId}
        versionLabel={props.versionLabel}
        canOpenDiagrams={props.canOpenDiagrams}
        canListAssetTypes={props.canListAssetTypes}
        canDeleteRelationship={props.canDeleteRelationship}
        onFetchingChange={props.onFetchingChange}
        onCountChange={props.onCountChange}
      />
    );
  },
);
