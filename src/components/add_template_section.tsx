import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { redactPrompt } from "@/services/generate";

interface Section {
  id: string;
  name: string;
}

interface AddSectionFormProps {
  templateId: string;
  onSubmit: (values: { name: string; prompt: string; dependencies: string[]; template_id: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  existingSections?: Section[];
}

export function AddSectionForm({ templateId, onSubmit, onCancel, isPending, existingSections = [] }: AddSectionFormProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePrompt = async () => {
    if (!name.trim()) return;
    
    setIsGenerating(true);
    setPrompt(""); // Clear existing prompt
    
    try {
      await redactPrompt({
        name: name.trim(),
        onData: (text: string) => {
          setPrompt(prev => prev + text);
        },
        onError: (error: Event) => {
          console.error('Error generating prompt:', error);
          setIsGenerating(false);
        },
        onClose: () => {
          setIsGenerating(false);
        }
      });
    } catch (error) {
      console.error('Error generating prompt:', error);
      setIsGenerating(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;
    onSubmit({ 
      name, 
      prompt, 
      dependencies: selectedDependencies, 
      template_id: templateId 
    });
  };

  const addDependency = (sectionId: string) => {
    const id = sectionId;
    console.log('Adding dependency:', id);
    if (!selectedDependencies.includes(id)) {
      setSelectedDependencies([...selectedDependencies, id]);
    }
    setSelectValue(""); // Reiniciar el valor del select
  };

  const removeDependency = (sectionId: string) => {
    setSelectedDependencies(selectedDependencies.filter(id => id !== sectionId));
  };

  const availableSections = existingSections.filter(
    section => !selectedDependencies.includes(section.id)
  );

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Add New Section</CardTitle>
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
              autoFocus
              disabled={isPending}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between pb-2">
              <label htmlFor="section-prompt" className="block text-sm font-medium mb-1">
                Prompt
              </label>
              <Button
                type="button"
                size="sm"
                onClick={handleGeneratePrompt}
                disabled={!name.trim() || isGenerating}
                className="hover:cursor-pointer"
              >
                {isGenerating ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </div>
            <Textarea
              id="section-prompt"
              placeholder="Enter the prompt for this section"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isPending || isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="dependencies" className="block text-sm font-medium mb-1">
              Internal Dependencies
            </label>
            {availableSections.length > 0 ? (
              <Select value={selectValue} onValueChange={addDependency} disabled={isPending}>
                <SelectTrigger className="hover:cursor-pointer">
                  <SelectValue placeholder="Select a section to add as dependency" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
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
                  const section = existingSections.find(s => s.id === depId);
                  console.log('Debug:', { depId, section, existingSections }); // Línea temporal para debug
                  return (
                    <span
                      key={depId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {section?.name || `Section ${depId}`}
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
          <Button type="button" variant="ghost" onClick={onCancel} className="hover:cursor-pointer" disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || !prompt.trim() || isPending} className="hover:cursor-pointer">
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}