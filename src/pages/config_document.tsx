import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DocumentSection } from "@/components/document_section";
import { AddSectionForm } from "@/components/add_document_section";
import { Trash2, PlusCircle, ArrowLeft } from "lucide-react";
import { getDocumentById, getDocumentSections } from "@/services/documents";
import { Button } from "@/components/ui/button";

export default function ConfigDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isAddingSection, setIsAddingSection] = useState(false);

  const {
    data: document,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentById(id!),
    enabled: !!id, // Solo ejecutar si id está definido
  });

  const {
    data: sections,
    isLoading: isSectionsLoading,
    error: sectionsError,
  } = useQuery({
    queryKey: ["documentSections", id],
    queryFn: () => getDocumentSections(id!),
    enabled: !!id, // Solo ejecutar si id está definido
  });

  if (isLoading || isSectionsLoading) return <div>Loading...</div>;
if (error || sectionsError) {
    const errorMessage = error ? (error as Error).message : (sectionsError as Error).message;
    return <div>Error: {errorMessage}</div>;
}

  if (!document) {
    return <div>No document found with ID: {id}</div>;
  }

  const handleDelete = async () => {
    try {
      // Aquí deberías implementar la lógica para eliminar el documento
      // Por ejemplo, llamar a un servicio de API para eliminar el documento
      console.log("Document deleted successfully");
      navigate("/documents"); // Redirigir a la lista de documentos
    } catch (deleteError) {
      console.error("Error deleting document:", deleteError);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hover:cursor-pointer"
            onClick={() => navigate(`/document/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Configure Document</h1>
        </div>
      </div>

      <div className="bg-slate-100 border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Name: {document.name}
            </h2>
            <p className="text-gray-600">Description: {document.description}</p>
            <p className="text-gray-400 text-sm pt-3">
              Created At: {new Date(document.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="hover:cursor-pointer ml-4"
            onClick={handleDelete}
            title="Delete Template"
          >
            <Trash2 className="h-4 w-4 m-2" />
          </Button>
        </div>
      </div>
      {isAddingSection ? (
        <AddSectionForm
          documentId={document.id}
          //   onSubmit={(values) => addSectionMutation.mutate(values)}
          onSubmit={(values) => {
            console.log("Section added:", values);
            setIsAddingSection(false);
          }}
          onCancel={() => setIsAddingSection(false)}
          //   isPending={addSectionMutation.isPending}
          isPending={false}
          existingSections={document.sections}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          className="hover:cursor-pointer"
          onClick={() => setIsAddingSection(true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      )}

      <div className="space-y-4">
        {sections && sections.length > 0 ? (
          sections.map((section: any) => (
           <DocumentSection key={section.id} item={section} />
          ))
        ) : (
          <div className="text-gray-500">No sections available.</div>
        )}
    </div>
    </div>
  );
}
