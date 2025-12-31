import { Plus, Network, FolderIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

interface AssetActionsProps {
  onNavigateToGraph: () => void;
  onCreateFolder?: () => void;
  onCreateAsset?: () => void;
  canCreateFolder: boolean;
  canCreateAsset: boolean;
}

/**
 * Action buttons for asset management
 * Includes navigation to graph and creation controls
 */
export function AssetActions({ 
  onNavigateToGraph, 
  onCreateFolder, 
  onCreateAsset,
  canCreateFolder,
  canCreateAsset 
}: AssetActionsProps) {
  const hasCreatePermissions = canCreateFolder || canCreateAsset;

  return (
    <div className="flex items-center justify-start gap-2 md:justify-between mb-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToGraph}
          >
            <Network className="h-4 w-4 text-gray-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Asset relationships</p>
        </TooltipContent>
      </Tooltip>

      {hasCreatePermissions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-40">
            {canCreateFolder && onCreateFolder && (
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="hover:cursor-pointer"
                  onSelect={onCreateFolder}
                >
                  <FolderIcon className="h-4 w-4 mr-2" />
                  Create Folder
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
            {canCreateAsset && onCreateAsset && (
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="hover:cursor-pointer"
                  onSelect={onCreateAsset}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Asset
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
