import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import Section from "./section";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

type Dependency = { id: string; name: string };

export interface SortableSectionItem {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: Dependency[];
}

interface SortableSectionProps {
  item: SortableSectionItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
}

export default function SortableSection({ item, existingSections, onSave }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Visual hint while dragging
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative pr-12">
      {/* Drag handle at the left side */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="hover:cursor-grab cursor-grabbing active:cursor-grabbing"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Actual content */}
      <Section item={item as any} existingSections={existingSections} onSave={onSave} />
    </div>
  );
}
