import { useState } from "react";
import { Folder, ChevronLeft, Search, Home, Loader2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateFolder from "../create_folder";
import CreateDocumentLib from "./create_document_lib";
import { LibrarySidebarItem } from "../library/library-sidebar-item";

// API response interface
interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface LibrarySidebarProps {
  breadcrumb: BreadcrumbItem[];
  setBreadcrumb: (breadcrumb: BreadcrumbItem[]) => void;
  selectedFile: LibraryItem | null;
  setSelectedFile: (file: LibraryItem | null) => void;
  currentItems: LibraryItem[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export function LibrarySidebar({
  breadcrumb,
  setBreadcrumb,
  selectedFile,
  setSelectedFile,
  currentItems,
  isLoading,
  onRefresh
}: LibrarySidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Get current folder ID for parent folder parameter
  const getCurrentFolderId = (): string | undefined => {
    if (breadcrumb.length === 0) return undefined;
    return breadcrumb[breadcrumb.length - 1].id;
  };

  // Filter items based on search
  const getFilteredItems = (): LibraryItem[] => {
    if (!searchTerm) return currentItems;
    return currentItems.filter((item: LibraryItem) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleFolderClick = (folder: LibraryItem) => {
    setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
    setSelectedFile(null);
  };

  const handleFileClick = (file: LibraryItem) => {
    setSelectedFile(file);
  };

  const handleBackClick = () => {
    if (breadcrumb.length > 0) {
      setBreadcrumb(breadcrumb.slice(0, -1));
      setSelectedFile(null);
    }
  };

  const handleHomeClick = () => {
    setBreadcrumb([]);
    setSelectedFile(null);
  };

  const getCurrentFolderName = (): string => {
    if (breadcrumb.length === 0) return "Library";
    return breadcrumb[breadcrumb.length - 1].name;
  };

  const handleDocumentCreated = (createdDocument: { id: string; name: string; type: "document" }) => {
    // Refresh the library content
    if (onRefresh) {
      onRefresh();
    }
    // Select the newly created document
    setSelectedFile(createdDocument);
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Sidebar Header */}
      <div className="px-2 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHomeClick}
            className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-gray-100"
            disabled={breadcrumb.length === 0}
          >
            <Home className="h-4 w-4" />
          </Button>
          {breadcrumb.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-sm font-medium text-gray-900">{getCurrentFolderName()}</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* File/Folder List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : (
          <div className="py-2">
            {getFilteredItems().map((item) => (
              <LibrarySidebarItem
                key={item.id}
                item={item}
                isSelected={selectedFile?.id === item.id}
                onClick={() => item.type === "folder" ? handleFolderClick(item) : handleFileClick(item)}
                onRefresh={onRefresh}
                setSelectedFile={setSelectedFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Button */}
      <div className="relative">
        <div className="absolute bottom-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:cursor-pointer hover:bg-gray-100 rounded-full shadow-sm border border-gray-200 bg-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <CreateFolder
                trigger={
                  <DropdownMenuItem 
                    className="hover:cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Folder
                  </DropdownMenuItem>
                }
                parentFolder={getCurrentFolderId()}
              />
              <CreateDocumentLib
                trigger={
                  <DropdownMenuItem 
                    className="hover:cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Asset
                  </DropdownMenuItem>
                }
                folderId={getCurrentFolderId()}
                onDocumentCreated={handleDocumentCreated}
              />
              
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
