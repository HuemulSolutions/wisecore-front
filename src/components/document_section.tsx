import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronUp, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface TemplateItem {
  name: string;
  prompt: string;
  order: number;
  dependencies: string[];
}

interface DocumentSectionProps {
  item: TemplateItem;
  maxPreviewLength?: number;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({ 
  item, 
  maxPreviewLength = 150 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldShowExpandButton = item.prompt.length > maxPreviewLength;
  const displayText = isExpanded || !shouldShowExpandButton 
    ? item.prompt 
    : `${item.prompt.substring(0, maxPreviewLength)}...`;

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
            <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded w-fit">
              Order: {item.order}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:cursor-pointer">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="hover:cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:cursor-pointer text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {item.dependencies && item.dependencies.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-sm text-muted-foreground">Depende de:</span>
              {item.dependencies.map((dependency, index) => (
                <span 
                  key={index}
                  className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full"
                >
                  {dependency}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm text-gray-700 leading-relaxed">
            <strong>Prompt:</strong> {displayText}
          </div>
          {shouldShowExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:cursor-pointer"
            >
              <span className="flex items-center gap-1">
                {isExpanded ? (
                  <>
                    Mostrar menos
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Mostrar más
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};