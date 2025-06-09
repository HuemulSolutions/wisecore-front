import { getAllDocuments } from "@/services/documents";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Document from "@/components/document";

export default function Documents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: getAllDocuments,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <Button className="ml-2" variant="outline" size="icon" aria-label="Agregar documento">
          +
        </Button>
      </div>
      <ul className="space-y-2">
        {data?.map((doc: any) => {
          return (
            <Document
              key={doc.id}
              doc={doc}
            />
          );
        })}
      </ul>
    </div>
  );
}