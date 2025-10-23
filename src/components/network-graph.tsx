import type React from "react"
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getDocumentDependencies } from "@/services/dependencies"
import { getDocumentSections } from "@/services/documents"
import {
  File,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  MoreVertical,
  Network,
  Settings,
} from "lucide-react"

interface NetworkNode {
  id: string
  label: string
  fullLabel: string
  x: number
  y: number
  icon: React.ReactNode
  type: "document"
  dependencyCount?: number
  documentType?: { id: string; name: string; color: string }
}

interface Connection {
  from: string
  to: string
  type: "dependency"
}

interface Viewport {
  x: number
  y: number
  scale: number
}

interface DragState {
  isDragging: boolean
  nodeId: string | null
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

interface NetworkGraphProps {
  documents?: any[]
}

export default function NetworkGraph({ documents = [] }: NetworkGraphProps) {
  const navigate = useNavigate()
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [allDependencies, setAllDependencies] = useState<{[documentId: string]: any[]}>({})
  const [allSections, setAllSections] = useState<{[documentId: string]: any[]}>({})
  const [dependencyNames, setDependencyNames] = useState<{[documentId: string]: string}>({})
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Load dependencies and sections for all documents
  useEffect(() => {
    const loadAllData = async () => {
      if (!documents || documents.length === 0) return

      const dependenciesMap: {[documentId: string]: any[]} = {}
      const sectionsMap: {[documentId: string]: any[]} = {}
      const namesMap: {[documentId: string]: string} = {}
      
      // Create name map to resolve dependencies
      documents.forEach((doc: any) => {
        namesMap[doc.id] = doc.name
      })
      
      await Promise.all(
        documents.map(async (doc: any) => {
          try {
            // Load dependencies
            const dependencies = await getDocumentDependencies(doc.id)
            dependenciesMap[doc.id] = dependencies || []

            // Load sections using specific endpoint
            const sections = await getDocumentSections(doc.id)
            sectionsMap[doc.id] = sections || []
          } catch (error) {
            console.error(`Error loading data for document ${doc.id}:`, error)
            dependenciesMap[doc.id] = []
            sectionsMap[doc.id] = []
          }
        })
      )
      
      setAllDependencies(dependenciesMap)
      setAllSections(sectionsMap)
      setDependencyNames(namesMap)
      
      // Debug: Log sections data
      console.log('Sections loaded for documents:', sectionsMap)
    }

    loadAllData()
  }, [documents])

  // Generate nodes based on documents data
  useEffect(() => {
    const generateNodes = (): NetworkNode[] => {
      const newNodes: NetworkNode[] = []
      
      // Configuration for spacing
      const documentSpacing = 400
      const verticalSpacing = 180
      const centerX = 640
      const centerY = 200
      
      // Only show documents
      const documentCount = documents.length
      const maxDocsPerRow = 3
      
      documents.forEach((doc: any, docIndex: number) => {
        const row = Math.floor(docIndex / maxDocsPerRow)
        const colInRow = docIndex % maxDocsPerRow
        const docsInThisRow = Math.min(maxDocsPerRow, documentCount - (row * maxDocsPerRow))
        
        // Center documents in each row
        const rowStartX = centerX - ((docsInThisRow - 1) * documentSpacing / 2)
        const docX = rowStartX + (colInRow * documentSpacing)
        const docY = centerY + (row * verticalSpacing)

        // Get dependency count
        const dependencyCount = (allDependencies[doc.id] || []).length

        newNodes.push({
          id: `doc-${doc.id}`,
          label: doc.name.length > 20 ? doc.name.substring(0, 20) + "..." : doc.name,
          fullLabel: doc.name,
          x: docX,
          y: docY,
          icon: <File className="w-4 h-4" />,
          type: "document",
          dependencyCount,
          documentType: doc.document_type
        })
      })

      return newNodes
    }

    setNodes(generateNodes())
  }, [documents, allDependencies, allSections])

  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [nodeDrag, setNodeDrag] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  
  const getNodeInlineStyles = (node: NetworkNode) => {
    if (node.type === "document" && node.documentType?.color) {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };

      const rgb = hexToRgb(node.documentType.color);
      if (rgb) {
        return {
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
          borderColor: node.documentType.color,
          borderWidth: '2px'
        };
      }
    }
    return {};
  };

  // Function to calculate whether to use white or black text based on background luminosity
  const getTextColorForBackground = (hexColor: string) => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 128, g: 128, b: 128 };
    };

    const { r, g, b } = hexToRgb(hexColor);
    
    // Calculate luminosity using standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // If luminosity is high (light color), use black text; if low (dark color), use white text
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Function to generate badge styles based on document type
  const getBadgeStyles = (node: NetworkNode) => {
    if (node.type === "document" && node.documentType?.color) {
      const backgroundColor = node.documentType.color;
      const textColor = getTextColorForBackground(backgroundColor);
      
      return {
        backgroundColor,
        color: textColor,
        borderColor: backgroundColor,
        fontWeight: '600' as const,
        textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 1px rgba(255,255,255,0.8)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      };
    }
    return {};
  };

  const handleZoomIn = () => {
    setViewport((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }))
  }

  const handleZoomOut = () => {
    setViewport((prev) => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.3) }))
  }

  const handlePan = (deltaX: number, deltaY: number) => {
    setViewport((prev) => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))
  }

  const handleReset = () => {
    setViewport({ x: 0, y: 0, scale: 1 })
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current) {
        setIsDragging(true)
        setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y })
      }
    },
    [viewport.x, viewport.y],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && !nodeDrag.isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        setViewport((prev) => ({ ...prev, x: newX, y: newY }))
      }

      if (nodeDrag.isDragging && nodeDrag.nodeId) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const newX = (e.clientX - rect.left - viewport.x) / viewport.scale - nodeDrag.offsetX
          const newY = (e.clientY - rect.top - viewport.y) / viewport.scale - nodeDrag.offsetY

          setNodes((prev) => prev.map((node) => (node.id === nodeDrag.nodeId ? { ...node, x: newX, y: newY } : node)))
        }
      }
    },
    [isDragging, dragStart, nodeDrag, viewport],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setNodeDrag({
      isDragging: false,
      nodeId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    })
  }, [])

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()
      const rect = containerRef.current?.getBoundingClientRect()
      const node = nodes.find((n) => n.id === nodeId)

      if (rect && node) {
        const mouseX = (e.clientX - rect.left - viewport.x) / viewport.scale
        const mouseY = (e.clientY - rect.top - viewport.y) / viewport.scale

        setNodeDrag({
          isDragging: true,
          nodeId,
          startX: mouseX,
          startY: mouseY,
          offsetX: mouseX - node.x,
          offsetY: mouseY - node.y,
        })
      }
    },
    [nodes, viewport],
  )

  // const handleWheel = useCallback((e: React.WheelEvent) => {
  //   // Only zoom when Ctrl key is pressed
  //   if (!e.ctrlKey) {
  //     return
  //   }
  //   
  //   e.preventDefault()
  //   e.stopPropagation()
  //   const delta = e.deltaY > 0 ? 0.9 : 1.1
  //   setViewport((prev) => ({
  //     ...prev,
  //     scale: Math.max(0.3, Math.min(3, prev.scale * delta)),
  //   }))
  // }, [])

  const connections = useMemo(() => {
    const generateConnections = (): Connection[] => {
      const connections: Connection[] = []
      
      // Dependency connections between documents
      const dependencyConnections: Connection[] = []
      
      if (documents && Array.isArray(documents)) {
        documents.forEach((doc: any) => {
          const sourceNodeId = `doc-${doc.id}`
          const dependencies = allDependencies[doc.id] || []
          
          dependencies.forEach((dep: any) => {
            const targetNodeId = `doc-${dep.document_id}`
            
            // Only add connection if target node exists
            if (nodes.some(node => node.id === targetNodeId)) {
              dependencyConnections.push({
                from: sourceNodeId,
                to: targetNodeId,
                type: "dependency"
              })
            }
          })
        })
      }
      
      connections.push(...dependencyConnections)
      
      return connections
    }

    return generateConnections()
  }, [nodes, documents, allDependencies, allSections])

  // Calculate SVG bounds based on nodes positions
  const svgBounds = useMemo(() => {
    if (nodes.length === 0) {
      return { left: 0, top: 0, width: 1000, height: 1000 }
    }
    
    const padding = 500
    const minX = Math.min(...nodes.map(n => n.x))
    const maxX = Math.max(...nodes.map(n => n.x))
    const minY = Math.min(...nodes.map(n => n.y))
    const maxY = Math.max(...nodes.map(n => n.y))
    
    return {
      left: minX - padding,
      top: minY - padding,
      width: maxX - minX + (padding * 2),
      height: maxY - minY + (padding * 2)
    }
  }, [nodes])

  const handleMenuAction = (action: string, nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    switch (action) {
      case "view-document-details":
        const documentId = nodeId.replace('doc-', '')
        navigate(`/document/${documentId}`)
        break
      case "view-document-dependencies":
        const docId = nodeId.replace('doc-', '')
        navigate(`/docDepend/${docId}`)
        break
      case "configure-sections":
        const configDocId = nodeId.replace('doc-', '')
        navigate(`/configDocument/${configDocId}`)
        break
      default:
        break
    }
  }

  const renderMenuOptions = (node: NetworkNode) => {
    const options = []

    if (node.type === "document") {
      options.push(
        <DropdownMenuItem key="document-details" onClick={() => handleMenuAction("view-document-details", node.id)}>
          <File className="w-4 h-4 mr-2" />
          View Asset Details
        </DropdownMenuItem>,
        <DropdownMenuItem key="document-dependencies" onClick={() => handleMenuAction("view-document-dependencies", node.id)}>
          <Network className="w-4 h-4 mr-2" />
          View Dependencies
        </DropdownMenuItem>,
        <DropdownMenuItem key="configure-sections" onClick={() => handleMenuAction("configure-sections", node.id)}>
          <Settings className="w-4 h-4 mr-2" />
          Configure Sections
        </DropdownMenuItem>,
      )
    }

    return options
  }

  return (
    <TooltipProvider>
      <div className="w-full h-screen bg-gray-50 relative overflow-hidden">
        <div className="absolute top-8 left-8 z-30 space-y-2">
          <div className="bg-white p-4 rounded-lg shadow-md space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Navigation</h3>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleZoomIn} className="text-xs">
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={handleZoomOut} className="text-xs">
                <ZoomOut className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset} className="text-xs bg-transparent">
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>

            {/* <div className="text-xs text-gray-500 mb-2">
              Ctrl + scroll to zoom
            </div> */}

            <div className="grid grid-cols-3 gap-1">
              <div></div>
              <Button size="sm" onClick={() => handlePan(0, 50)} className="text-xs">
                <ArrowUp className="w-3 h-3" />
              </Button>
              <div></div>
              <Button size="sm" onClick={() => handlePan(50, 0)} className="text-xs">
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <div className="text-xs text-center text-gray-500 flex items-center justify-center">
                {Math.round(viewport.scale * 100)}%
              </div>
              <Button size="sm" onClick={() => handlePan(-50, 0)} className="text-xs">
                <ArrowRight className="w-3 h-3" />
              </Button>
              <div></div>
              <Button size="sm" onClick={() => handlePan(0, -50)} className="text-xs">
                <ArrowDown className="w-3 h-3" />
              </Button>
              <div></div>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          // onWheel={handleWheel}
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg 
            className="absolute z-20" 
            style={{ 
              pointerEvents: "none",
              left: svgBounds.left,
              top: svgBounds.top,
              width: svgBounds.width,
              height: svgBounds.height,
            }}
          >
            {/* Define arrowhead markers */}
            <defs>
              {/* Simple arrowhead */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#9CA3AF"
                />
              </marker>

              {/* Dependency arrowhead */}
              <marker
                id="arrowhead-dependency"
                markerWidth="10"
                markerHeight="8"
                refX="9"
                refY="4"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 4, 0 8"
                  fill="#374151"
                />
              </marker>
            </defs>
            {connections.map((connection, index) => {
              const fromNode = nodes.find((n) => n.id === connection.from)
              const toNode = nodes.find((n) => n.id === connection.to)

              if (!fromNode || !toNode) return null

              const isDependency = connection.type === "dependency"

              // Calculate the direction vector from source to target
              const dx = toNode.x - fromNode.x
              const dy = toNode.y - fromNode.y
              const length = Math.sqrt(dx * dx + dy * dy)
              
              // Normalize the direction vector
              const normalizedDx = dx / length
              const normalizedDy = dy / length
              
              // Card dimensions (approximate)
              const cardWidth = 280
              const cardHeight = 80
              
              // Calculate SVG offset
              const svgOffsetX = svgBounds.left
              const svgOffsetY = svgBounds.top
              
              // Calculate connection points at the edges of the cards, relative to SVG
              const fromX = fromNode.x + (normalizedDx * cardWidth / 2) - svgOffsetX
              const fromY = fromNode.y + (normalizedDy * cardHeight / 2) - svgOffsetY
              const toX = toNode.x - (normalizedDx * cardWidth / 2) - svgOffsetX
              const toY = toNode.y - (normalizedDy * cardHeight / 2) - svgOffsetY

              return (
                <g key={index}>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={isDependency ? "#374151" : "#9CA3AF"}
                    strokeWidth={isDependency ? "2" : "1.5"}
                    strokeDasharray={isDependency ? "5,3" : "none"}
                    opacity="0.8"
                    markerEnd={isDependency ? "url(#arrowhead-dependency)" : "url(#arrowhead)"}
                  />
                  {isDependency && (
                    <text
                      x={(fromX + toX) / 2}
                      y={(fromY + toY) / 2 - 8}
                      fill="#374151"
                      fontSize="10"
                      textAnchor="middle"
                      className="select-none"
                    >
                      depends on
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {nodes.map((node) => {
            const isDropdownOpen = openDropdown === node.id
            
            return (
                <Tooltip key={node.id} open={isDropdownOpen ? false : undefined}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: node.x, top: node.y }}
                    >
                      <Card
                        className={`p-4 shadow-lg hover:shadow-xl transition-all duration-200 cursor-move relative bg-white border-2 min-w-[280px] ${
                          nodeDrag.nodeId === node.id ? "ring-2 ring-blue-400 scale-105" : ""
                        }`}
                        style={{
                          ...getNodeInlineStyles(node),
                          backgroundColor: '#fff', // Fondo sólido blanco
                        }}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      >
                      {/* Badge for node type - Positioned above the card */}
                      <div className="absolute -top-3 left-3 flex gap-2 flex-wrap z-10">
                        {node.type === "document" && node.documentType ? (
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-2 py-1 border shadow-md"
                            style={getBadgeStyles(node)}
                          >
                            {node.documentType.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-600 text-white border-gray-700 shadow-md font-semibold">
                            Document
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 min-w-0 mt-1">
                        <div className="flex-shrink-0">
                          {node.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate flex-1 max-w-[200px]">{node.fullLabel}</span>
                        <DropdownMenu
                          open={openDropdown === node.id}
                          onOpenChange={(open) => {
                            setOpenDropdown(open ? node.id : null)
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-200 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 z-50">
                            {renderMenuOptions(node)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-lg p-4 bg-white border border-gray-200 shadow-lg rounded-lg">
                  <div className="space-y-3">
                    {/* Header with document title */}
                    <div className="border-b border-gray-100 pb-2">
                      <h3 className="font-semibold text-base text-gray-800">{node.fullLabel}</h3>
                      <p className="text-xs text-gray-600 capitalize">Asset</p>
                    </div>

                    {/* Document specific information */}
                    {node.type === 'document' && (
                      <div className="space-y-3">
                        {/* Document type */}
                        {node.documentType && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-600 mb-1">Type</h4>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: node.documentType.color }}
                              />
                              <span className="text-sm text-gray-700">{node.documentType.name}</span>
                            </div>
                          </div>
                        )}

                        {/* Dependencies */}
                        {typeof node.dependencyCount === 'number' && node.dependencyCount > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-600 mb-1">
                              Dependencies ({node.dependencyCount})
                            </h4>
                            <div className="space-y-1">
                              {(() => {
                                const nodeId = node.id.replace('doc-', '')
                                const deps = allDependencies[nodeId] || []
                                return deps.slice(0, 3).map((dep: any, idx: number) => {
                                  const depName = dependencyNames[dep.document_id] || `Document ${dep.document_id}`
                                  return (
                                    <div key={idx} className="text-xs text-blue-700 flex items-center gap-1">
                                      <span>•</span>
                                      <span className="truncate">{depName}</span>
                                    </div>
                                  )
                                })
                              })()}
                              {(() => {
                                const nodeId = node.id.replace('doc-', '')
                                const deps = allDependencies[nodeId] || []
                                return deps.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{deps.length - 3} more...
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Document sections */}
                        {(() => {
                          const nodeId = node.id.replace('doc-', '')
                          const sections = allSections[nodeId] || []
                          
                          // Always show sections area for debugging
                          return (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2">
                                Sections ({sections.length})
                              </h4>
                              {sections.length === 0 ? (
                                <div className="text-xs text-gray-500 italic">
                                  No sections found
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {sections.slice(0, 6).map((section: any, idx: number) => (
                                    <div key={section.id || idx} className="bg-gray-50 border border-gray-200 rounded-md p-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-xs font-medium text-gray-800 truncate">
                                            {section.name}
                                          </h5>
                                          {section.prompt && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                              {section.prompt.length > 60 
                                                ? `${section.prompt.substring(0, 60)}...` 
                                                : section.prompt
                                              }
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500">
                                              Order: {section.order || idx + 1}
                                            </span>
                                            {section.dependencies && section.dependencies.length > 0 && (
                                              <span className="text-xs text-blue-600">
                                                {section.dependencies.length} dep{section.dependencies.length !== 1 ? 's' : ''}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {sections.length > 6 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                      +{sections.length - 6} more sections...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
