import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, Sparkles, Info, Loader2 } from "lucide-react";

interface ExecutionConfigSheetProps {
  instructions: string;
  onInstructionsChange: (value: string) => void;
  selectedLLM: string;
  onLLMChange: (value: string) => void;
  llms?: any[];
  isGenerating: boolean;
  executionStatus: string;
  isUpdatingLLM: boolean;
  readonly?: boolean;
}

export function ExecutionConfigSheet({
  instructions,
  onInstructionsChange,
  selectedLLM,
  onLLMChange,
  llms = [],
  isGenerating,
  executionStatus,
  isUpdatingLLM,
  readonly = false
}: ExecutionConfigSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isEditable = !readonly && executionStatus === "pending" && !isGenerating;
  
  const getStatusBadge = () => {
    if (isGenerating) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Generating
        </Badge>
      );
    }
    
    if (executionStatus === "pending") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          Ready to execute
        </Badge>
      );
    }
    
    if (executionStatus === "completed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          Completed
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
        {executionStatus}
      </Badge>
    );
  };

  return (
    <Card className="border-l-4 border-l-[#4464f7] bg-gradient-to-r from-blue-50/30 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#4464f7]" />
            <span className="text-gray-900">Execution Configuration</span>
            {getStatusBadge()}
          </div>
          {!isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-xs text-[#4464f7] hover:bg-[#4464f7]/10"
            >
              Configure
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      {(isExpanded || readonly) && (
        <CardContent className="space-y-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
              AI Model
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the AI model to use for content generation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select
              value={selectedLLM}
              onValueChange={onLLMChange}
              disabled={!isEditable || isUpdatingLLM}
            >
              <SelectTrigger className="w-full hover:cursor-pointer">
                <SelectValue placeholder={isUpdatingLLM ? "Updating model..." : "Select AI model"} />
              </SelectTrigger>
              <SelectContent>
                {llms.map((llm: any) => (
                  <SelectItem key={llm.id} value={llm.id}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      {llm.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="execution-instructions" className="text-xs font-medium text-gray-700 flex items-center gap-1">
              Execution Instructions
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Specific instructions for this execution. Describe requirements, constraints, or special considerations.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Textarea
              id="execution-instructions"
              value={instructions}
              onChange={(e) => onInstructionsChange(e.target.value)}
              placeholder="Enter specific instructions for this execution..."
              className={`min-h-[100px] resize-vertical transition-colors text-sm ${
                !isEditable
                  ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                  : "border-gray-300 focus:ring-2 focus:ring-[#4464f7] focus:border-[#4464f7]"
              }`}
              disabled={!isEditable}
              readOnly={!isEditable}
            />
            {!isEditable && executionStatus !== "pending" && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Instructions cannot be edited after execution has started
              </p>
            )}
          </div>

          {/* Configuration Summary */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Configuration ready</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Ready to execute</span>
              </div>
            </div>
          </div>

          {isExpanded && !readonly && (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="text-xs"
              >
                Collapse
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}