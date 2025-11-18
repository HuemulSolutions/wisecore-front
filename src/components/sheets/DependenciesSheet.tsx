import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AddDependencySheet from "@/components/add_dependency_sheet";

interface DependenciesSheetProps {
  selectedFile: {
    id: string;
    name: string;
    type: "folder" | "document";
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile?: boolean;
}

export function DependenciesSheet({
  selectedFile,
  isOpen,
  onOpenChange,
  isMobile = false
}: DependenciesSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={isMobile 
            ? "h-8 w-8 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors rounded-full" 
            : "h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
          }
          title="Manage Dependencies"
        >
          <Link2 className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5 mr-1.5"} />
          {!isMobile && "Dependencies"}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-[90vw] lg:max-w-[800px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <Link2 className="h-4 w-4" />
                  Document Dependencies
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Configure document dependencies and relationships with other assets.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="space-y-6">
              {/* Document Info */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Document: {selectedFile?.name}</h3>
                <p className="text-xs text-gray-600">Link this document with other documents, templates, or external resources to create relationships and shared context.</p>
              </div>

              {/* Dependencies Component */}
              {selectedFile && (
                <AddDependencySheet id={selectedFile.id} />
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}