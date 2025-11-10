import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

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
}

export function CollapsibleSidebar({
  isOpen,
  onToggle,
  width = "w-80",
  position = 'left',
  toggleAriaLabel = "Toggle sidebar",
  children,
  header,
  className = "",
  contentClassName = "",
  headerClassName = ""
}: CollapsibleSidebarProps) {
  const borderClass = position === 'left' ? 'border-r' : 'border-l';
  const toggleBorderClass = position === 'left' ? 'border-r' : 'border-l';
  
  const getToggleIcon = () => {
    if (position === 'left') {
      return isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;
    } else {
      return isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />;
    }
  };

  return (
    <TooltipProvider>
      {position === 'left' && (
        <>
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

          {/* Toggle Button */}
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className={`h-12 w-12 p-0 rounded-none ${toggleBorderClass} border-border hover:bg-muted`}
            aria-label={toggleAriaLabel}
          >
            {getToggleIcon()}
          </Button>
        </>
      )}

      {position === 'right' && (
        <>
          {/* Toggle Button */}
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className={`h-12 w-12 p-0 rounded-none ${toggleBorderClass} border-border hover:bg-muted`}
            aria-label={toggleAriaLabel}
          >
            {getToggleIcon()}
          </Button>

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
        </>
      )}
    </TooltipProvider>
  );
}