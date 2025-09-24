import { useQuery } from "@tanstack/react-query";
import { getAllDocuments } from "@/services/documents";
import NetworkGraph from "@/components/network-graph";
import { useOrganization } from "@/contexts/organization-context";

export default function Graph() {
  const { selectedOrganizationId } = useOrganization();

  const {
    data: documents,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["documents", selectedOrganizationId],
    queryFn: () => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }
      return getAllDocuments(selectedOrganizationId);
    },
    enabled: !!selectedOrganizationId,
  });

  if (!selectedOrganizationId) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to view the network graph.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading network graph...</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">Failed to load documents for the network graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <NetworkGraph documents={documents || []} />
    </div>
  );
}