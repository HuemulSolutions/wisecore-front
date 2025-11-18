import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface CollapsibleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  width?: string;
  position?: 'left' | 'right';
  toggleAriaLabel?: string;
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  mobileTitle?: string; // Title for mobile sheet
  showToggleButton?: boolean; // Whether to show the internal toggle button
  customToggleIcon?: ReactNode; // Custom icon for toggle button
  customToggleIconMobile?: ReactNode; // Custom icon for mobile toggle button
}

export function CollapsibleSidebar({
  isOpen,
  onToggle,
  width = "w-64",
  position = 'left',
  toggleAriaLabel = "Toggle sidebar",
  children,
  header,
  className = "",
  contentClassName = "",
  headerClassName = "",
  mobileTitle = "Menu",
  showToggleButton = true,
  customToggleIcon,
  customToggleIconMobile
}: CollapsibleSidebarProps) {
  const isMobile = useIsMobile();
  const borderClass = position === 'left' ? 'border-r' : 'border-l';
  
  const getToggleIcon = () => {
    if (customToggleIcon) {
      return customToggleIcon;
    }
    if (position === 'left') {
      return isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;
    } else {
      return isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />;
    }
  };

  const getToggleIconMobile = () => {
    if (customToggleIconMobile) {
      return customToggleIconMobile;
    }
    if (position === 'left') {
      return isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />;
    } else {
      return isOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />;
    }
  };

  // Mobile view - use Sheet
  if (isMobile) {
    return (
      <TooltipProvider>
        {/* Mobile Toggle Button */}
        {showToggleButton && (
          <div className="flex items-center">
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-muted rounded-md"
              aria-label={toggleAriaLabel}
            >
              {getToggleIconMobile()}
            </Button>
          </div>
        )}

        {/* Mobile Sheet */}
        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetContent 
            side={position}
            className="w-85 p-0 bg-white border-0 shadow-xl"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{mobileTitle}</SheetTitle>
              <SheetDescription>
                Mobile navigation sidebar
              </SheetDescription>
            </SheetHeader>
            
            {header && (
              <div className={`border-b border-gray-200 shadow-sm bg-white ${headerClassName}`}>
                {header}
              </div>
            )}
            
            {/* Content */}
            <div className={`flex-1 overflow-y-auto min-h-0 bg-white ${contentClassName}`}>
              {children}
            </div>
          </SheetContent>
        </Sheet>
      </TooltipProvider>
    );
  }

  // Desktop view - use collapsible sidebar
  return (
    <TooltipProvider>
      {position === 'left' && (
        <div className="relative flex">
          {/* Sidebar */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${borderClass} border-border bg-white flex flex-col ${
              isOpen ? width : "w-0"
            } ${className}`}
          >
            {header && (
              <div className={`border-b border-gray-200 shadow-sm bg-white ${headerClassName}`}>
                {header}
              </div>
            )}
            
            {/* Content */}
            <div className={`flex-1 overflow-y-auto min-h-0 bg-white ${contentClassName}`}>
              {children}
            </div>
          </div>

          {/* Integrated Toggle Tab - Always visible */}
          {showToggleButton && (
            <div className="relative">
              <Button
                onClick={onToggle}
                variant="ghost"
                size="sm"
                className="absolute top-20 -left-0 h-10 w-6 p-0 rounded-none rounded-r-md bg-white/90 backdrop-blur-sm border border-l-0 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 z-50 group hover:w-7"
                aria-label={toggleAriaLabel}
              >
                <div className="flex items-center justify-center">
                  <div className="transition-transform duration-200 group-hover:scale-105">
                    <div className="text-gray-600 group-hover:text-gray-800">
                      {getToggleIcon()}
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          )}
        </div>
      )}

      {position === 'right' && (
        <div className="relative flex">
          {/* Integrated Toggle Tab - Always visible */}
          {showToggleButton && (
            <div className="relative">
              <Button
                onClick={onToggle}
                variant="ghost"
                size="sm"
                className="absolute top-20 -right-0 h-10 w-6 p-0 rounded-none rounded-l-md bg-white/90 backdrop-blur-sm border border-r-0 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 z-50 group hover:w-7"
                aria-label={toggleAriaLabel}
              >
                <div className="flex items-center justify-center">
                  <div className="transition-transform duration-200 group-hover:scale-105">
                    <div className="text-gray-600 group-hover:text-gray-800">
                      {getToggleIcon()}
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          )}

          {/* Sidebar */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${borderClass} border-border bg-white flex flex-col ${
              isOpen ? width : "w-0"
            } ${className}`}
          >
            {header && (
              <div className={`border-b border-gray-200 shadow-sm bg-white ${headerClassName}`}>
                {header}
              </div>
            )}
            
            {/* Content */}
            <div className={`flex-1 overflow-y-auto min-h-0 bg-white ${contentClassName}`}>
              {children}
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}