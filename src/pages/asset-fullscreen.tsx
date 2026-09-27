import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AssetContent } from "@/components/assets";
import { useOrganization } from "@/contexts/organization-context";
import { useOrgNavigate } from "@/hooks/useOrgRouter";
import { useNavKnowledgeRefresh } from "@/contexts/nav-knowledge-context";
import { usePageAccess } from "@/hooks/usePageAccess";
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import type { LibraryItem } from "@/types/assets";

/**
 * Vista de un asset a pantalla completa (ver ia context/fullscreen-share-route-guide.md).
 * AppLayout la monta en su modo "bare" (sin header/nav/árbol) pero con los mismos
 * providers que /asset — ver app-layout.tsx. Se llega acá desde el menú ⋯ o el botón
 * de expandir del header de AssetContent (assets-more-options-dropdown.tsx /
 * assets-content.tsx), o directamente por un link con el assetId en la URL.
 *
 * A diferencia de /asset, NO usa useAssetNavigation: ese hook resuelve jerarquía de
 * carpetas a partir del pathname y reescribiría esta URL. Acá el id del asset viene
 * directo del param de ruta; AssetContent resuelve nombre/tipo/permisos desde su
 * propia query de contenido (getDocumentContent), así que alcanza con un stub mínimo
 * — mismo shape que arma useAssetNavigation.ts para un documento recién resuelto.
 */
export default function AssetFullscreenPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useOrgNavigate();
  const { selectedOrganizationId } = useOrganization();
  const refreshFileTree = useNavKnowledgeRefresh();
  const { canAccessPage, isLoading: isLoadingPermissions } = usePageAccess("asset");

  const [selectedExecutionId, setSelectedExecutionIdState] = useState<string | null>(
    () => searchParams.get("execution"),
  );
  const [selectedSectionId, setSelectedSectionIdState] = useState<string | null>(
    () => searchParams.get("section"),
  );

  // Refleja versión/sección seleccionadas de vuelta a la URL (replace, sin agregar
  // entradas al historial) — un refresh cae en la misma versión, igual que /asset.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (selectedExecutionId) next.set("execution", selectedExecutionId);
    else next.delete("execution");
    if (selectedSectionId) next.set("section", selectedSectionId);
    else next.delete("section");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExecutionId, selectedSectionId]);

  const selectedFile: LibraryItem | null = useMemo(
    () => (assetId ? { id: assetId, name: "", type: "document" } : null),
    [assetId],
  );

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["library", selectedOrganizationId] });
    queryClient.invalidateQueries({ queryKey: ["document-content"] });
    refreshFileTree();
  }, [queryClient, selectedOrganizationId, refreshFileTree]);

  const handleExitFullscreen = useCallback(() => {
    if (!assetId) return;
    navigate(`/asset/${assetId}`);
  }, [navigate, assetId]);

  if (isLoadingPermissions) {
    return <PageSkeleton />;
  }

  if (!canAccessPage || !assetId) {
    return <HuemulAccessDenied />;
  }

  return (
    <div className="h-full bg-white">
      <AssetContent
        variant="fullscreen"
        selectedFile={selectedFile}
        breadcrumb={[]}
        selectedExecutionId={selectedExecutionId}
        setSelectedExecutionId={setSelectedExecutionIdState}
        selectedSectionId={selectedSectionId}
        setSelectedSectionId={setSelectedSectionIdState}
        setSelectedFile={() => {}}
        onRefresh={handleRefresh}
        isSidebarOpen={false}
        onToggleSidebar={() => {}}
        onExitFullscreen={handleExitFullscreen}
      />
    </div>
  );
}
