import React, { useState } from 'react';
// import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ContextItem {
  id: string;
  name: string;
  content: string;
}

interface ContextDisplayProps {
  item: ContextItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ContextDisplay: React.FC<ContextDisplayProps> = ({
  item,
  onEdit,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <span className="text-sm font-medium">{item.name}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(item.id)}
            className="hover:cursor-pointer"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete?.(item.id)}
            className="hover:cursor-pointer text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p>{item.content}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};