import type { BreadcrumbItem } from "../types";

interface AssetBreadcrumbProps {
  breadcrumb: BreadcrumbItem[];
  onNavigate: (index: number) => void;
  onNavigateRoot: () => void;
}

/**
 * Breadcrumb navigation component for assets
 * Shows the current location in the folder hierarchy
 */
export function AssetBreadcrumb({ breadcrumb, onNavigate, onNavigateRoot }: AssetBreadcrumbProps) {
  if (breadcrumb.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 bg-muted/50 flex-shrink-0">
      <div className="text-xs font-medium text-muted-foreground mb-1">Current Location</div>
      <div className="text-sm">
        <span 
          className="hover:cursor-pointer text-primary hover:underline" 
          onClick={onNavigateRoot}
        >
          Asset
        </span>
        {breadcrumb.map((item, index) => (
          <span key={item.id}>
            <span className="mx-1 text-muted-foreground">/</span>
            <span 
              className="hover:cursor-pointer text-primary hover:underline"
              onClick={() => onNavigate(index)}
            >
              {item.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
