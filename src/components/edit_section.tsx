import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Item {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
}

interface Section {
  id: string;
  name: string;
}

interface EditSectionProps {
  item: Item;
  onCancel: () => void;
  onSave: (updatedItem: Item) => void;
  existingSections?: Section[];
}

export default function EditSection({ item, onCancel, onSave, existingSections = [] }: EditSectionProps) {
  const [formData, setFormData] = useState<Item>({
    ...item,
    dependencies: [...item.dependencies]
  });
  const [selectValue, setSelectValue] = useState<string>("");

  const handleInputChange = (field: keyof Item, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDependency = (sectionId: string) => {
    if (!formData.dependencies.some(dep => dep.id === sectionId)) {
      let sectionInfo = existingSections.find(section => section.id === sectionId);
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, { id: sectionId, name: sectionInfo?.name || `Section ${sectionId}` }]
      }));
    }
    setSelectValue(""); // reset select
  };

  const removeDependency = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(dep => dep.id !== sectionId)
    }));
  };

  const availableSections = existingSections.filter(
    section => section.id !== item.id && !formData.dependencies.some(dep => dep.id === section.id)
  );

  const handleSave = () => {
    // order se mantiene sin edición
    onSave(formData);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Edit Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter section name"
          />
        </div>

        {/* Prompt Field */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            value={formData.prompt}
            onChange={(e) => handleInputChange('prompt', e.target.value)}
            placeholder="Enter section prompt"
            rows={4}
            className="resize-vertical"
          />
        </div>

        {/* Dependencies Field */}
        <div className="space-y-2">
          <Label>Internal Dependencies</Label>
          {availableSections.length > 0 ? (
            <Select value={selectValue} onValueChange={addDependency}>
              <SelectTrigger className="hover:cursor-pointer">
                <SelectValue placeholder="Select a section to add as dependency" />
              </SelectTrigger>
              <SelectContent>
                {availableSections.map(section => (
                  <SelectItem key={section.id} value={section.id} className="hover:cursor-pointer">
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
          {formData.dependencies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.dependencies.map(dep => {
                const section = existingSections.find(s => s.id === dep.id);
                return (
                  <span
                    key={dep.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {section?.name || `Section ${dep.id}`}
                    <button
                      type="button"
                      onClick={() => removeDependency(dep.id)}
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="hover:cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
