import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddTemplate() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-6">Add Template</h1>
      
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter template name"
          />
        </div>
        
        <Button type="button" variant="outline" className="hover:cursor-pointer">
          Add Section
        </Button>
      </form>
    </div>
  );
}