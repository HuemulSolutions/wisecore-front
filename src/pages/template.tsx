import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useParams, useNavigate } from "react-router-dom";
import { getTemplateById, deleteTemplate, createTemplateSection, updateTemplateSection, updateSectionsOrder } from "@/services/templates";
import { formatDate } from "@/services/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
// import Section  from "@/components/section";
import SortableSection from "@/components/sortable_section";
import { AddSectionForm } from "@/components/add_template_section";
import { Trash2, PlusCircle, MoreVertical, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

export default function ConfigTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const { data: template, isLoading, error } = useQuery({
    queryKey: ["template", id],
    queryFn: () => getTemplateById(id!),
    enabled: !!id, // Solo ejecutar si id está definido
  });

  const addSectionMutation = useMutation({
    mutationFn: (sectionData: { name: string; template_id: string, prompt: string, dependencies: string[] }) => 
      createTemplateSection(sectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      setIsAddingSection(false);
    },
    onError: (error) => {
      console.error("Error creating section:", error);
      toast.error("Error creating section: " + (error as Error).message);
    }
  });

  // Nueva mutation para actualizar sección
  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionData }: { sectionId: string; sectionData: any }) =>
      updateTemplateSection(sectionId, sectionData),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
    onError: (error) => {
      console.error("Error updating section:", error);
      toast.error("Error updating section: " + (error as Error).message);
    }
  });

  // Mutation para reordenar secciones y persistir en backend
  const reorderSectionsMutation = useMutation({
    mutationFn: (sections: { section_id: string; order: number }[]) => updateSectionsOrder(sections),
    onSuccess: () => {
      toast.success("Sections order updated");
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
    onError: (error) => {
      console.error("Error updating sections order:", error);
      toast.error("Error updating sections order: " + (error as Error).message);
    },
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching template:", error);
    }
  }, [error]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  if (!template) {
    return <div>No template found with ID: {id}</div>;
  }

  const handleDelete = async () => {
    try {
      await deleteTemplate(template.id);
      toast.success("Template deleted successfully");
      navigate("/templates"); // Redirigir a la lista de templates
      setShowDeleteDialog(false);
    } catch (deleteError) {
      console.error("Error deleting template:", deleteError);
      toast.error("Error deleting template");
    }
  }

  const handleExport = () => {
    const templateData = {
      name: template.name,
      description: template.description,
      sections: template.template_sections.map((section: any) => ({
        name: section.name,
        prompt: section.prompt,
        dependencies: section.dependencies
      }))
    };
    
    const dataStr = JSON.stringify(templateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Template exported successfully");
  }

  console.log("Template data:", template);

  // Keep UI order as returned, but compute a sorted view for DnD reference
  const sections = [...template.template_sections].sort(
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
            onClick={() => navigate("/templates")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Configure Template</h1>
        </div>
      </div>

      <div className="border border-gray-400 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Name: {template.name}</h2>
            <p className="text-gray-600">Description: {template.description}</p>
            <p className="text-gray-400 text-sm pt-3">Created: {formatDate(template.created_at)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:cursor-pointer ml-4" 
                title="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                className="hover:cursor-pointer" 
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 hover:cursor-pointer" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isAddingSection ? (
        <AddSectionForm
          templateId={template.id}
          onSubmit={(values) => addSectionMutation.mutate(values)}
          onCancel={() => setIsAddingSection(false)}
          isPending={addSectionMutation.isPending}
          existingSections={template.template_sections}
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
            {sections.map((section: any) => (
              <SortableSection
                key={section.id}
                item={section}
                existingSections={template.template_sections}
                onSave={(sectionId: string, sectionData: object) =>
                  updateSectionMutation.mutate({ sectionId, sectionData })
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template "{template.name}" and all its sections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 hover:cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}