import React, { useState } from 'react';
// import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Markdown from './ui/markdown';

interface ContextItem {
  id: string;
  name: string;
  content: string;
}

interface ContextDisplayProps {
  item: ContextItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  hideHeader?: boolean;
}

export const ContextDisplay: React.FC<ContextDisplayProps> = ({
  item,
  onDelete,
  hideHeader = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (hideHeader) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between p-3 bg-gray-50">
          <div className="flex-1">
            <p className="text-xs text-gray-600 truncate">
              {item.content.length > 100 
                ? `${item.content.substring(0, 100)}...` 
                : item.content
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 h-6 w-6 p-0 hover:cursor-pointer text-gray-500 hover:text-gray-700"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
        {isExpanded && (
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <Markdown>{item.content}</Markdown>
            </div>
          </div>
        )}
      </div>
    );
  }

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
            <Markdown>{item.content}</Markdown>
          </div>
        </CardContent>
      )}
    </Card>
  );
};