import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AddContextSheet from "@/components/add_context_sheet";

interface ContextSheetProps {
  selectedFile: {
    id: string;
    name: string;
    type: "folder" | "document";
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContextSheet({
  selectedFile,
  isOpen,
  onOpenChange
}: ContextSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
          title="Manage Context"
        >
          <Users className="h-3.5 w-3.5 mr-1.5" />
          Context
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="sm:max-w-[800px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-4 w-4" />
                  Document Context
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-500 mt-1">
                  Configure document context, variables, and execution environment.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Document Info */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Document: {selectedFile?.name}</h3>
                <p className="text-xs text-gray-600">Set up context variables, user permissions, and environmental settings that influence document execution and content generation.</p>
              </div>

              {/* Context Component */}
              {selectedFile && (
                <AddContextSheet id={selectedFile.id} />
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}