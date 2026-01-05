import { useState, useMemo, useEffect } from "react";
import { FileText, Search, X, Filter, ChevronRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
// Note: ScrollArea component not available, using div with scroll
import { useQuery } from "@tanstack/react-query";
import { getLibraryContent } from "@/services/folders";
import { useOrganization } from "@/contexts/organization-context";

interface Document {
    id: string;
    name: string;
    type: "folder" | "document";
    document_type?: {
        id: string;
        name: string;
        color: string;
    };
}

interface DocumentType {
    id: string;
    name: string;
    color: string;
}

interface TreeNode extends Document {
    children?: TreeNode[];
    isExpanded?: boolean;
    isLoading?: boolean;
    level?: number;
    parentPath?: string;
}

interface DocumentTreeSelectorProps {
    documentTypes: DocumentType[];
    selectedDocumentTypes: string[];
    onDocumentSelect: (document: { id: string; name: string; type: "document" }) => void;
    onFilterChange: (selectedTypes: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    excludeDocumentIds?: string[]; // Documents to exclude from selection
    showContainer?: boolean; // Whether to show border and background
    customPadding?: string; // Custom padding classes
}

interface TreeItemProps {
    node: TreeNode;
    onSelect: (document: { id: string; name: string; type: "document" }) => void;
    searchTerm: string;
    excludeDocumentIds: string[];
    onLoadChildren: (folderId: string) => Promise<TreeNode[]>;
    onToggleExpand: (nodeId: string) => void;
}

function TreeItem({ 
    node, 
    onSelect, 
    searchTerm, 
    excludeDocumentIds,
    onLoadChildren,
    onToggleExpand 
}: TreeItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isFolder = node.type === "folder";
    const isDocument = node.type === "document";
    const isExcluded = excludeDocumentIds.includes(node.id);
    const level = node.level || 0;

    // Highlight search term in document name
    const highlightSearchTerm = (text: string, term: string) => {
        if (!term) return text;
        
        const regex = new RegExp(`(${term})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? (
                <span key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
                    {part}
                </span>
            ) : part
        );
    };

    const handleToggleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder) {
            if (!node.isExpanded && (!node.children || node.children.length === 0)) {
                // Load children if not loaded yet
                try {
                    await onLoadChildren(node.id);
                    // Children loading is handled by parent component
                } catch (error) {
                    console.error('Error loading children:', error);
                }
            }
            onToggleExpand(node.id);
        }
    };

    const handleSelect = () => {
        if (isDocument && !isExcluded) {
            onSelect({ id: node.id, name: node.name, type: "document" });
        }
    };

    return (
        <div className="w-full">
            <div
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 group",
                    isDocument && !isExcluded && "cursor-pointer hover:bg-gray-100 hover:shadow-sm",
                    isDocument && isExcluded && "opacity-50 cursor-not-allowed",
                    isFolder && "cursor-default hover:bg-gray-50",
                    isHovered && isDocument && !isExcluded && "bg-[#4464f7]/10 text-[#4464f7] border-l-2 border-[#4464f7]"
                )}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleSelect}
            >
                {/* Expand/Collapse Button for Folders */}
                {isFolder && (
                    <button
                        onClick={handleToggleExpand}
                        className={cn(
                            "flex-shrink-0 p-0.5 hover:bg-foreground/10 rounded transition-transform",
                            node.isExpanded && "rotate-90"
                        )}
                    >
                        {node.isLoading ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                )}

                {/* Spacer for documents */}
                {isDocument && <div className="w-5 h-4 flex-shrink-0" />}

                {/* Icon */}
                {isFolder ? (
                    <Folder className="w-4 h-4 flex-shrink-0" />
                ) : (
                    <FileText 
                        className="w-4 h-4 flex-shrink-0" 
                        style={{ 
                            color: node.document_type?.color || '#2563eb' // Use document type color or default blue
                        }}
                    />
                )}

                {/* Name */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={cn(
                        "text-sm flex-1 truncate",
                        isDocument && !isExcluded ? "text-gray-900" : "text-gray-600"
                    )}>
                        {highlightSearchTerm(node.name, searchTerm)}
                    </span>
                </div>

                {/* Hover indicator for selectable documents */}
                {isDocument && !isExcluded && (
                    <div className={cn(
                        "w-2 h-2 rounded-full bg-[#4464f7] opacity-0 transition-opacity",
                        isHovered && "opacity-100"
                    )} />
                )}
            </div>

            {/* Children */}
            {isFolder && node.isExpanded && node.children && (
                <div className="w-full">
                    {node.children.map((child) => (
                        <TreeItem
                            key={child.id}
                            node={{ ...child, level: level + 1 }}
                            onSelect={onSelect}
                            searchTerm={searchTerm}
                            excludeDocumentIds={excludeDocumentIds}
                            onLoadChildren={onLoadChildren}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function DocumentTreeSelector({
    documentTypes,
    selectedDocumentTypes,
    onDocumentSelect,
    onFilterChange,
    placeholder = "Search documents...",
    disabled = false,
    excludeDocumentIds = [],
    showContainer = true,
    customPadding = "p-4"
}: DocumentTreeSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
    const { selectedOrganizationId } = useOrganization();

    // Build initial tree structure from root folders
    const { data: rootContent } = useQuery({
        queryKey: ['library-root', selectedOrganizationId],
        queryFn: () => getLibraryContent(selectedOrganizationId!, undefined),
        enabled: !!selectedOrganizationId,
    });

    // Initialize tree nodes
    useEffect(() => {
        if (rootContent?.content) {
            const nodes: TreeNode[] = rootContent.content.map((item: Document) => ({
                ...item,
                level: 0,
                isExpanded: false,
                isLoading: false,
                children: item.type === 'folder' ? [] : undefined
            }));
            setTreeNodes(nodes);
        }
    }, [rootContent?.content]);

    // Handle loading children for a folder
    const handleLoadChildren = async (folderId: string): Promise<TreeNode[]> => {
        if (!selectedOrganizationId) return [];
        
        try {
            const folderContent = await getLibraryContent(selectedOrganizationId, folderId);
            return folderContent?.content?.map((item: Document) => ({
                ...item,
                level: 0, // Will be set by parent
                isExpanded: false,
                isLoading: false,
                children: item.type === 'folder' ? [] : undefined
            })) || [];
        } catch (error) {
            console.error('Error loading folder children:', error);
            return [];
        }
    };

    // Handle expand/collapse
    const handleToggleExpand = async (nodeId: string) => {
        const updateNodeExpansion = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
                if (node.id === nodeId && node.type === 'folder') {
                    const newExpanded = !node.isExpanded;
                    
                    if (newExpanded && (!node.children || node.children.length === 0)) {
                        // Load children
                        return { ...node, isExpanded: newExpanded, isLoading: true };
                    } else {
                        return { ...node, isExpanded: newExpanded };
                    }
                }
                if (node.children) {
                    return { ...node, children: updateNodeExpansion(node.children) };
                }
                return node;
            });
        };

        setTreeNodes(prev => updateNodeExpansion(prev));

        // Load children if expanding and no children loaded
        const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                    const found = findNode(node.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const targetNode = findNode(treeNodes, nodeId);
        if (targetNode && targetNode.type === 'folder' && (!targetNode.children || targetNode.children.length === 0)) {
            try {
                const children = await handleLoadChildren(nodeId);
                
                // Update tree with loaded children
                const updateNodeWithChildren = (nodes: TreeNode[]): TreeNode[] => {
                    return nodes.map(node => {
                        if (node.id === nodeId) {
                            return { ...node, children, isLoading: false };
                        }
                        if (node.children) {
                            return { ...node, children: updateNodeWithChildren(node.children) };
                        }
                        return node;
                    });
                };

                setTreeNodes(prev => updateNodeWithChildren(prev));
            } catch (error) {
                // Handle error - stop loading state
                const stopLoading = (nodes: TreeNode[]): TreeNode[] => {
                    return nodes.map(node => {
                        if (node.id === nodeId) {
                            return { ...node, isLoading: false, isExpanded: false };
                        }
                        if (node.children) {
                            return { ...node, children: stopLoading(node.children) };
                        }
                        return node;
                    });
                };
                setTreeNodes(prev => stopLoading(prev));
            }
        }
    };

    // Filter tree nodes based on search and document types
    const filteredNodes = useMemo(() => {
        const filterNode = (node: TreeNode): TreeNode | null => {
            // Check if document type matches filter
            if (selectedDocumentTypes.length > 0 && node.type === 'document') {
                if (!node.document_type || !selectedDocumentTypes.includes(node.document_type.id)) {
                    return null;
                }
            }

            // Check if name matches search
            let nameMatches = true;
            if (searchTerm) {
                nameMatches = node.name.toLowerCase().includes(searchTerm.toLowerCase());
            }

            // For folders, check if any children match
            let hasMatchingChildren = false;
            let filteredChildren: TreeNode[] = [];
            
            if (node.children) {
                filteredChildren = node.children
                    .map(child => filterNode(child))
                    .filter(child => child !== null) as TreeNode[];
                hasMatchingChildren = filteredChildren.length > 0;
            }

            // Include node if:
            // 1. It's a document that matches all criteria
            // 2. It's a folder with matching children
            // 3. It's a folder that matches search (for navigation)
            if (node.type === 'document' && nameMatches) {
                return node;
            } else if (node.type === 'folder' && (hasMatchingChildren || nameMatches)) {
                return { ...node, children: filteredChildren };
            }

            return null;
        };

        return treeNodes
            .map(node => filterNode(node))
            .filter(node => node !== null) as TreeNode[];
    }, [treeNodes, searchTerm, selectedDocumentTypes]);

    // Count total selectable documents
    const countSelectableDocuments = (nodes: TreeNode[]): number => {
        return nodes.reduce((count, node) => {
            if (node.type === 'document' && !excludeDocumentIds.includes(node.id)) {
                count += 1;
            }
            if (node.children) {
                count += countSelectableDocuments(node.children);
            }
            return count;
        }, 0);
    };

    const totalSelectableDocuments = countSelectableDocuments(filteredNodes);

    const clearSearch = () => {
        setSearchTerm("");
    };

    const clearFilters = () => {
        onFilterChange([]);
    };

    const handleTypeFilterChange = (typeId: string, checked: boolean) => {
        if (checked) {
            onFilterChange([...selectedDocumentTypes, typeId]);
        } else {
            onFilterChange(selectedDocumentTypes.filter(id => id !== typeId));
        }
    };

    if (disabled) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 text-center">No documents available to select</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-3">
            {/* Search and Filter Header */}
            <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-8"
                    />
                    {searchTerm && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="h-3 w-3 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Filter Button */}
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            className="hover:cursor-pointer"
                        >
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                            {selectedDocumentTypes.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                                    {selectedDocumentTypes.length}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm">Filter by Type</h4>
                                {selectedDocumentTypes.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={clearFilters}
                                        className="h-6 px-2 text-xs hover:cursor-pointer"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                <div className="space-y-2">
                                    {documentTypes.map((type) => (
                                        <div key={type.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={type.id}
                                                checked={selectedDocumentTypes.includes(type.id)}
                                                onCheckedChange={(checked: boolean) => {
                                                    handleTypeFilterChange(type.id, checked);
                                                }}
                                            />
                                            <label
                                                htmlFor={type.id}
                                                className="flex items-center space-x-2 text-sm cursor-pointer flex-1"
                                            >
                                                <div 
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: type.color }}
                                                />
                                                <span className="truncate">{type.name}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Results Info */}
            {(searchTerm || selectedDocumentTypes.length > 0) && (
                <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                    <span>
                        {totalSelectableDocuments} selectable documents
                        {searchTerm && ` matching "${searchTerm}"`}
                    </span>
                    {(searchTerm || selectedDocumentTypes.length > 0) && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                clearSearch();
                                clearFilters();
                            }}
                            className="h-5 px-2 text-xs hover:cursor-pointer"
                        >
                            Clear all
                        </Button>
                    )}
                </div>
            )}

            {/* Document Tree */}
            <div className={cn(
                "flex-1 flex flex-col",
                showContainer && "border border-gray-200 rounded-lg bg-white"
            )}>
                <div className="flex-1 overflow-y-auto">
                    {filteredNodes.length === 0 ? (
                        <div className={cn("text-center", customPadding === "p-2" ? "p-4" : "p-6")}>
                            <Folder className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                                {searchTerm || selectedDocumentTypes.length > 0 
                                    ? "No documents match your criteria" 
                                    : "No documents available"}
                            </p>
                            {(searchTerm || selectedDocumentTypes.length > 0) && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        clearSearch();
                                        clearFilters();
                                    }}
                                    className="mt-2 text-xs hover:cursor-pointer"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className={cn(customPadding, "space-y-0.5")}>
                            {filteredNodes.map((node) => (
                                <TreeItem
                                    key={node.id}
                                    node={node}
                                    onSelect={onDocumentSelect}
                                    searchTerm={searchTerm}
                                    excludeDocumentIds={excludeDocumentIds}
                                    onLoadChildren={handleLoadChildren}
                                    onToggleExpand={handleToggleExpand}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}