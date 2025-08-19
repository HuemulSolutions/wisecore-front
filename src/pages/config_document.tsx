import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import SortableSection from "@/components/sortable_section";
import { AddSectionForm } from "@/components/add_document_section";
import { Trash2, PlusCircle, ArrowLeft } from "lucide-react";
import { getDocumentById } from "@/services/documents";
import { createSection, updateSection, updateSectionsOrder } from "@/services/section";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

export default function ConfigDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddingSection, setIsAddingSection] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const {
    data: document,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentById(id!),
    enabled: !!id, // Solo ejecutar si id está definido
  });

  const addSectionMutation = useMutation({
    mutationFn: (sectionData: { name: string; document_id: string; prompt: string; dependencies: string[] }) =>
      createSection(sectionData),
    onSuccess: () => {
      // 4. Al tener éxito, invalidar la query para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      setIsAddingSection(false); // Ocultar el formulario
    },
    onError: (error) => {
      console.error("Error creating section:", error);
      toast.error("Error creating section: " + (error as Error).message);
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateSection(sectionId, sectionData),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
    onError: (error) => {
      console.error("Error updating section:", error);
      toast.error("Error updating section: " + (error as Error).message);
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sections: { section_id: string; order: number }[]) => updateSectionsOrder(sections),
    onSuccess: () => {
      toast.success("Sections order updated");
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
    onError: (error) => {
      console.error("Error updating sections order:", error);
      toast.error("Error updating sections order: " + (error as Error).message);
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    console.error("Error fetching document:", error);
    return <div>Error loading document.</div>;
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

  // Mantener el orden de UI como viene, pero calcular vista ordenada para DnD
  const sections = [...(document.sections || [])].sort(
    (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s: any) => s.id === active.id);
    const newIndex = sections.findIndex((s: any) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sections, oldIndex, newIndex);
    const payload = reordered.map((s: any, idx: number) => ({ section_id: s.id, order: idx + 1 }));
    reorderSectionsMutation.mutate(payload);
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
          onSubmit={(values) => addSectionMutation.mutate(values)}
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections && sections.length > 0 ? (
              sections.map((section: any) => (
                <SortableSection
                  key={section.id}
                  item={section}
                  existingSections={document.sections}
                  onSave={(sectionId: string, sectionData: object) =>
                    updateSectionMutation.mutate({ sectionId, sectionData })
                  }
                />
              ))
            ) : (
              <div className="text-gray-500">No sections available.</div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
