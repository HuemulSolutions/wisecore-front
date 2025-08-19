import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Organization</DialogTitle>
              <DialogDescription>
                Fill in the fields to create a new organization.
              </DialogDescription>
            </DialogHeader>

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
              className="w-full mt-2"
            />

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setName("");
                  setDescription("");
                  setError(null);
                }}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!name.trim() || mutation.isPending}
                className="hover:cursor-pointer"
              >
                {mutation.isPending ? "Creating..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
