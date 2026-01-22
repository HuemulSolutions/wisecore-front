import { BetweenHorizontalStart } from 'lucide-react';
import { DocumentActionButton } from '@/components/assets/content/assets-access-control';

interface SectionSeparatorProps {
  onAddSection: (afterIndex?: number) => void;
  index?: number;
  isLastSection?: boolean;
  isMobile?: boolean;
  accessLevels?: string[];
}

/**
 * Section Separator Component with hover add button
 */
export function SectionSeparator({ 
  onAddSection, 
  index, 
  isLastSection = false,
  isMobile = false,
  accessLevels
}: SectionSeparatorProps) {
  return (
    <div className="group relative flex items-center justify-center my-4 px-4 max-w-full">
      {/* Divider line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 group-hover:border-gray-300 transition-colors duration-200" />
      </div>
      
      {/* Add section button - appears on hover on desktop, always visible on mobile */}
      <div className="relative bg-white px-6">
        <DocumentActionButton
          accessLevels={accessLevels}
          requiredAccess={["edit", "create"]}
          requireAll={false}
          checkGlobalPermissions={true}
          resource="assets"
          onClick={() => onAddSection(index)}
          variant="ghost"
          size="sm"
          className={`
            h-8 w-8 p-0 rounded-full 
            ${isMobile 
              ? 'opacity-100' 
              : 'opacity-0 group-hover:opacity-100'
            }
            transition-all duration-300 ease-in-out
            hover:bg-[#4464f7] hover:text-white
            text-gray-400 hover:cursor-pointer
            border border-gray-200 bg-white
            shadow-sm hover:shadow-lg
            transform hover:scale-110 active:scale-95
          `}
          title={`Add section ${isLastSection ? 'at the end' : index !== undefined && index >= 0 ? `after section ${index + 1}` : 'at the beginning'}`}
        >
          <BetweenHorizontalStart className="h-4 w-4" />
        </DocumentActionButton>
      </div>
    </div>
  );
}
