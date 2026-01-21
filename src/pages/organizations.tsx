import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { getAllOrganizations, addOrganization } from "@/services/organizations";
import { Plus, Building2 } from "lucide-react";

export default function Organizations() {
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ["organizations"],
    queryFn: getAllOrganizations,
  });

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) => addOrganization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setIsDialogOpen(false);
      setName("");
      setDescription("");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || "An error occurred while creating the organization");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    mutation.mutate({ name, description });
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setName("");
    setDescription("");
    setError(null);
  };

  if (isLoading) return <div>Loading...</div>;
  if (queryError) return <div>Error: {(queryError as Error).message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizations</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" aria-label="Add organization" className="hover:cursor-pointer">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </Dialog>

        <ReusableDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title="New Organization"
          description="Fill in the fields to create a new organization."
          icon={Building2}
          showDefaultFooter
          onCancel={handleCancel}
          onSubmit={handleSave}
          submitLabel="Save"
          cancelLabel="Cancel"
          isSubmitting={mutation.isPending}
          isValid={name.trim().length > 0}
          maxHeight="90vh"
        >
          <div className="space-y-4">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full"
            />

            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full"
            />

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
          </div>
        </ReusableDialog>
      </div>

      <ul className="space-y-2">
        {data && data.length > 0 ? (
          data.map((org: any) => (
            <li
              key={org.id}
              className="flex items-start gap-3 border rounded-md p-3"
            >
              <Building2 className="w-5 h-5 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">{org.name}</div>
                {org.description ? (
                  <div className="text-sm text-muted-foreground">{org.description}</div>
                ) : null}
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">No organizations found.</li>
        )}
      </ul>
    </div>
  );
}
