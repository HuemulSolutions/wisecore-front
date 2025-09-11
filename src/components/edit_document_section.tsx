import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Section {
  id: string;
  name: string;
  prompt: string;
  dependencies: string[];
}

interface EditSectionFormProps {
  section: Section;
  onSubmit: (values: { id: string; name: string; prompt: string; dependencies: string[] }) => void;
  onCancel: () => void;
  isPending: boolean;
  existingSections: Section[];
}

export function EditSectionForm({ section, onSubmit, onCancel, isPending, existingSections }: EditSectionFormProps) {
  const [name, setName] = useState(section.name);
  const [prompt, setPrompt] = useState(section.prompt);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(section.dependencies || []);
  const [selectValue, setSelectValue] = useState<string>("");

  useEffect(() => {
    setName(section.name);
    setPrompt(section.prompt);
    setSelectedDependencies(section.dependencies || []);
  }, [section]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;
    onSubmit({ 
      id: section.id,
      name, 
      prompt, 
      dependencies: selectedDependencies
    });
  };

  const addDependency = (sectionId: string) => {
    if (!selectedDependencies.includes(sectionId)) {
      setSelectedDependencies([...selectedDependencies, sectionId]);
    }
    setSelectValue("");
  };

  const removeDependency = (sectionId: string) => {
    setSelectedDependencies(selectedDependencies.filter(id => id !== sectionId));
  };

  const availableSections = existingSections.filter(
    s => s.id !== section.id && !selectedDependencies.includes(s.id)
  );

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Edit Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="section-name" className="block text-sm font-medium mb-1">
              Section Name
            </label>
            <Input
              id="section-name"
              placeholder="Enter section name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="section-prompt" className="block text-sm font-medium mb-1">
              Prompt
            </label>
            <Textarea
              id="section-prompt"
              placeholder="Enter the prompt for this section"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isPending}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="dependencies" className="block text-sm font-medium mb-1">
              Internal Dependencies
            </label>
            {availableSections.length > 0 ? (
              <Select value={selectValue} onValueChange={addDependency} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section to add as dependency" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No sections available to add as dependencies
              </p>
            )}
            
            {selectedDependencies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedDependencies.map(depId => {
                  const dependentSection = existingSections.find(s => s.id === depId);
                  return (
                    <span
                      key={depId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {dependentSection?.name || `Section ${depId}`}
                      <button
                        type="button"
                        onClick={() => removeDependency(depId)}
                        className="text-blue-600 hover:text-blue-800 hover:cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 py-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending} className="hover:cursor-pointer">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !name.trim() || !prompt.trim()} className="hover:cursor-pointer">
            {isPending ? "Updating..." : "Update"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}