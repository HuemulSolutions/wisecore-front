import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { getTemplateById, deleteTemplate, createTemplateSection } from "@/services/templates";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TemplateSection } from "@/components/template_section";
import { AddSectionForm } from "@/components/add_template_section";
import { Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function ConfigTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddingSection, setIsAddingSection] = useState(false);

  const { data: template, isLoading, error } = useQuery({
    queryKey: ["template", id],
    queryFn: () => getTemplateById(id!),
    enabled: !!id, // Solo ejecutar si id está definido
  });

  const addSectionMutation = useMutation({
    mutationFn: (sectionData: { name: string; template_id: string, prompt: string, dependencies: string[] }) => 
      createTemplateSection(sectionData),
    onSuccess: () => {
      // 4. Al tener éxito, invalidar la query para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      setIsAddingSection(false); // Ocultar el formulario
    },
    onError: (error) => {
      console.error("Error creating section:", error);
      toast.error("Error creating section: " + (error as Error).message);
    }
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
      // Aquí podrías redirigir o actualizar el estado de la lista de templates
      console.log("Template deleted successfully");
      navigate("/templates"); // Redirigir a la lista de templates
    } catch (deleteError) {
      console.error("Error deleting template:", deleteError);
    }
  }

  console.log("Template data:", template);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configure Template</h1>
      </div>

      <div className="bg-slate-100 border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Name: {template.name}</h2>
            <p className="text-gray-600">Description: {template.description}</p>
            <p className="text-gray-400 text-sm pt-3">Created At: {new Date(template.created_at).toLocaleDateString()}</p>
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

      <div className="space-y-4">
        {template.template_sections.map((section: any) => (
          <TemplateSection key={section.id} item={section} />
        ))}
      </div>
    </div>
  );
} 