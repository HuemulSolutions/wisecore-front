import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import SortableSection from "@/components/sortable_section";
import { AddSectionForm } from "@/components/add_document_section";
import { PlusCircle, ArrowLeft, Sparkles } from "lucide-react";
import { getDocumentById, generateDocumentStructure } from "@/services/documents";
import { createSection, updateSection, updateSectionsOrder, deleteSection } from "@/services/section";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/services/utils";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

export default function ConfigDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [orderedSections, setOrderedSections] = useState<any[]>([]);

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
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      setIsAddingSection(false);
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

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteSection(sectionId),
    onSuccess: () => {
      toast.success("Section deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
    onError: (error) => {
      console.error("Error deleting section:", error);
      toast.error("Error deleting section: " + (error as Error).message);
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

  // Mutation para generar secciones con AI
  const generateSectionsMutation = useMutation({
    mutationFn: (documentId: string) => generateDocumentStructure(documentId),
    onSuccess: () => {
      toast.success("Sections generated successfully with AI");
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
    onError: (error) => {
      console.error("Error generating sections with AI:", error);
      toast.error("Error generating sections with AI: " + (error as Error).message);
    }
  });

  // Sincroniza estado local cuando cambien las secciones del documento
  useEffect(() => {
    if (document?.sections) {
      const sorted = [...document.sections].sort(
        (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
      );
      setOrderedSections(sorted);
    }
  }, [document?.sections]);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    console.error("Error fetching document:", error);
    return <div>Error loading assset.</div>;
  }

  if (!document) {
    return <div>No asset found with ID: {id}</div>;
  }

  const handleGenerateWithAI = async () => {
    if (!document?.id) return;
    generateSectionsMutation.mutate(document.id);
  };

  // DnD: usa orderedSections para evitar "snap back"
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSections.findIndex((s: any) => s.id === active.id);
    const newIndex = orderedSections.findIndex((s: any) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = [...orderedSections];
    const reordered = arrayMove(orderedSections, oldIndex, newIndex);

    // Optimista en UI
    setOrderedSections(reordered);

    const payload = reordered.map((s: any, idx: number) => ({ section_id: s.id, order: idx + 1 }));
    reorderSectionsMutation.mutate(payload, {
      onError: () => setOrderedSections(prev),
    });
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
              Created At: {formatDate(document.created_at)}
            </p>
          </div>
        </div>
      </div>
      {isAddingSection ? (
        <AddSectionForm
          documentId={document.id}
          onSubmit={(values) => addSectionMutation.mutate(values)}
          onCancel={() => setIsAddingSection(false)}
          isPending={false}
          existingSections={document.sections}
        />
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="hover:cursor-pointer"
            onClick={() => setIsAddingSection(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          {(!document.sections || document.sections.length === 0) && (
            <Button
              type="button"
              variant="outline"
              className="hover:cursor-pointer"
              onClick={handleGenerateWithAI}
              disabled={generateSectionsMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generateSectionsMutation.isPending ? "Generating..." : "Generate sections with AI"}
            </Button>
          )}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedSections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {orderedSections.map((section: any) => (
                <SortableSection
                  key={section.id}
                  item={section}
                  existingSections={document.sections}
                  onSave={(sectionId: string, sectionData: object) =>
                    updateSectionMutation.mutate({ sectionId, sectionData })
                  }
                  onDelete={(sectionId: string) => deleteSectionMutation.mutate(sectionId)}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
