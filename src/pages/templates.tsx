import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import Template from "@/components/template";

export default function Templates() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // state para controlar el diálogo, el valor del input y errores
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // query para listar
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ["templates"],
    queryFn: getAllTemplates,
  });

  // mutation para crear
  const mutation = useMutation({
    mutationFn: addTemplate,
    onSuccess: (created) => {
      // invalidamos cache y navegamos
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      navigate(`/configTemplate/${created.id}`);
      // limpiamos estado y cerramos diálogo solo en éxito
      setNewName("");
      setError(null);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      // solo manejamos el error, mantenemos el diálogo abierto
      setError(error.message || "Ocurrió un error al crear el template");
    },
  });

  const handleAccept = () => {
    if (!newName.trim()) return;
    // limpiamos errores previos antes de hacer la mutación
    setError(null);
    mutation.mutate(newName);
    // NO cerramos el diálogo ni limpiamos el input aquí
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
            <Button variant="outline" size="icon" aria-label="Agregar template" className="hover:cursor-pointer">
              +
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Template</DialogTitle>
              <DialogDescription>
                Ingresa el nombre para tu nuevo template.
              </DialogDescription>
            </DialogHeader>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del template"
              className="w-full border rounded px-2 py-1"
            />

            {/* Mostrar error si existe */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNewName("");
                  setError(null);
                  setIsDialogOpen(false);
                }}
                className="hover:cursor-pointer"
              >
                Cancelar
              </Button>
              <Button onClick={handleAccept} disabled={mutation.isPending} className="hover:cursor-pointer">
                {mutation.isPending ? "Creando..." : "Aceptar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ul className="space-y-2">
        {data?.map((doc: any) => (
          <Template key={doc.id} doc={doc} />
        ))}
      </ul>
    </div>
  );
}