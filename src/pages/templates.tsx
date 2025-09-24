import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getAllTemplates, addTemplate } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import Template from "@/components/template";

export default function Templates() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedOrganizationId } = useOrganization();

  // state para controlar el diálogo, el valor del input y errores
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // query para listar
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ["templates"],
    queryFn: () => getAllTemplates(selectedOrganizationId!),
    enabled: !!selectedOrganizationId,
  });

  // mutation para crear
  const mutation = useMutation({
    mutationFn: (newData: { name: string; description: string; organization_id: string }) =>
      addTemplate(newData),
    onSuccess: (created) => {
      // invalidamos cache y navegamos
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      navigate(`/configTemplate/${created.id}`);
      // limpiamos estado y cerramos diálogo solo en éxito
      setNewName("");
      setNewDescription("");
      setError(null);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message || "An error occurred while creating the template");
    },
  });

  const handleAccept = () => {
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }
    if (!selectedOrganizationId) {
      setError("Organization is required");
      return;
    }
    setError(null);
    mutation.mutate({
      name: newName,
      description: newDescription,
      organization_id: selectedOrganizationId,
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (queryError) return <div>Error: {(queryError as Error).message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>

        {/* Trigger para abrir diálogo */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline" aria-label="Agregar template" className="hover:cursor-pointer">
              +
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Template</DialogTitle>
              <DialogDescription>
                Complete the fields below to create a new template.
              </DialogDescription>
            </DialogHeader>

            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full border rounded px-2 py-1"
            />

            <Input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full border rounded px-2 py-1 mt-2"
            />

            {/* Mostrar error si existe */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mt-2">
                <div className="flex items-center">
                  <span className="font-medium">Error:</span>
                  <span className="ml-2">{error}</span>
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNewName("");
                  setNewDescription("");
                  setError(null);
                  setIsDialogOpen(false);
                }}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button onClick={handleAccept} disabled={!newName.trim() || !selectedOrganizationId || mutation.isPending} className="hover:cursor-pointer">
                {mutation.isPending ? "Creating..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ul className="space-y-4">
        {data?.map((doc: any) => (
          <Template key={doc.id} doc={doc} />
        ))}
      </ul>
    </div>
  );
}