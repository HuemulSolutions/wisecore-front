"use client"

import type React from "react"
import type { HuemulTreeNode, HuemulTreeMenuAction, HuemulFileTreeLabels } from "@/types/huemul"
import type { HuemulFileTreeProps, HuemulFileTreeRef } from "@/types/huemul"
export type { HuemulFileTreeProps, HuemulFileTreeRef }

import { useState, useCallback, useEffect, useImperativeHandle, forwardRef, useRef } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, RefreshCw, MoreVertical, Trash2, Share } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { useTranslation } from "react-i18next"

// ─── Default labels ───────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────
export const HuemulFileTree = forwardRef<HuemulFileTreeRef, HuemulFileTreeProps>(
  (
    {
      onLoadChildren,
      onRefresh: onRefreshProp,
      onCreateFile,
      onCreateFolder,
      onDelete,
      onShare,
      onMoveFolder,
      onMoveFile,
      onFileClick,
      onFolderClick,
      activeNodeId,
      menuActions = [],
      showDefaultActions = { create: true, delete: true, share: true },
      customDialogs,
      folderType = "folder",
      renderLeafIcon,
      renderFolderIcon,
      renderNodeClassName,
      alwaysShowMenuActions = false,
      showCreateButtons = true,
      initialFolderId = null,
      showBorder = true,
      showRefreshButton = false,
      minHeight = "530px",
      labels: labelOverrides,
      onDragStart: onDragStartProp,
      selectable = false,
      selectedIds,
      onSelectionChange,
      isNodeSelectable,
      cascadeSelection = false,
      isNodeExpandable,
      renderNodeSuffix,
      isSectionHeader,
      preserveExpandedOnRefresh = true,
      canDragNode,
      canDropNode,
      onExpandedFoldersChange,
      isNodePersistable,
    },
    ref,
  ) => {
    const { t } = useTranslation("huemul-file-tree")
    const labels: Required<HuemulFileTreeLabels> = {
      newFile: t("newFile"),
      newFolder: t("newFolder"),
      shareLink: t("shareLink"),
      deleteFolder: t("deleteFolder"),
      deleteFile: t("deleteFile"),
      loading: t("loading"),
      empty: t("empty"),
      createFile: t("createFile"),
      createFolder: t("createFolder"),
      inputPlaceholder: t("inputPlaceholder"),
      ...labelOverrides,
    }

    const [nodes, setNodes] = useState<HuemulTreeNode[]>([])
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [creatingNode, setCreatingNode] = useState<{
      parentId: string | null
      type: "file" | "folder"
    } | null>(null)
    const [newNodeName, setNewNodeName] = useState("")
    const [draggedNode, setDraggedNode] = useState<string | null>(null)
    // `null` = ningún destino activo; `{ kind: "root" }` = zona raíz (fuera de
    // toda carpeta); `{ kind: "node"; id }` = subárbol de esa carpeta. Antes
    // era un simple `string | null` que no distinguía "sin target" de "raíz",
    // lo que hacía que el contenedor entero se pintara mientras el cursor
    // pasaba sobre contenido indentado sin carpeta propia bajo el puntero.
    const [dropTarget, setDropTarget] = useState<{ kind: "node"; id: string } | { kind: "root" } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dragClientYRef = useRef<number>(0)
    const autoScrollFrameRef = useRef<number | null>(null)
    const scrollableParentRef = useRef<HTMLElement | null>(null)

    const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
      if (!el) return null
      if (el.scrollHeight > el.clientHeight) return el
      return findScrollableParent(el.parentElement)
    }

    const startAutoScroll = useCallback(() => {
      if (autoScrollFrameRef.current !== null) return
      const loop = () => {
        const container = scrollableParentRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const y = dragClientYRef.current
        const threshold = 60
        const maxSpeed = 12
        if (y > rect.top && y < rect.top + threshold) {
          const factor = 1 - (y - rect.top) / threshold
          container.scrollTop -= maxSpeed * factor
        } else if (y > rect.bottom - threshold && y < rect.bottom) {
          const factor = 1 - (rect.bottom - y) / threshold
          container.scrollTop += maxSpeed * factor
        }
        autoScrollFrameRef.current = requestAnimationFrame(loop)
      }
      autoScrollFrameRef.current = requestAnimationFrame(loop)
    }, [])

    const stopAutoScroll = useCallback(() => {
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current)
        autoScrollFrameRef.current = null
      }
    }, [])
    const [isLoading, setIsLoading] = useState(false)
    const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null)
    const [cascadeLoadingIds, setCascadeLoadingIds] = useState<Set<string>>(new Set())
    const [isInitialized, setIsInitialized] = useState(false)
    const [activeDialog, setActiveDialog] = useState<{
      type: "createFile" | "createFolder" | "delete" | "share"
      nodeId: string | null
      nodeType?: string
    } | null>(null)

    const isExpandable = useCallback(
      (node: HuemulTreeNode) => (isNodeExpandable ? isNodeExpandable(node) : node.type === folderType),
      [isNodeExpandable, folderType],
    )

    // Refs para no forzar a los consumidores a memoizar el callback ni a
    // meterlo como dependencia de este efecto — `isNodeExpandable` típicamente
    // llega como flecha inline (nav-knowledge.tsx, assets-file-tree.tsx), así
    // que `isExpandable` cambia de identidad en cada render del padre. Si
    // quedara en el dep array de abajo, el efecto correría en cada render y
    // `setExpandedFolders(new Set(...))` (siempre una referencia nueva) nunca
    // dejaría que React hiciera bail-out → "Maximum update depth exceeded".
    const onExpandedFoldersChangeRef = useRef(onExpandedFoldersChange)
    onExpandedFoldersChangeRef.current = onExpandedFoldersChange
    const isExpandableRef = useRef(isExpandable)
    isExpandableRef.current = isExpandable
    // Default: todo nodo expandible es persistible. Ver la nota de la prop en
    // types/huemul/file-tree.ts — existe para modos donde un nodo se vuelve
    // expandible sin ser una carpeta real de la biblioteca.
    const isPersistableRef = useRef(isNodePersistable)
    isPersistableRef.current = isNodePersistable

    useEffect(() => {
      const getExpandedIds = (nodeList: HuemulTreeNode[]): string[] => {
        const expanded: string[] = []
        for (const node of nodeList) {
          // Una carpeta colapsada oculta su subárbol: reportar lo que hay adentro
          // haría que el backend reexpandiera esta misma carpeta por la vía de los
          // ancestros (ver expanded_folder_ids en
          // respuestas/backend-arbol-expansion-persistente.md).
          if (isExpandableRef.current(node) && !node.isExpanded) continue
          if (node.isExpanded && isExpandableRef.current(node)) {
            if (!isPersistableRef.current || isPersistableRef.current(node)) {
              expanded.push(node.id)
            }
          }
          if (node.children) {
            expanded.push(...getExpandedIds(node.children))
          }
        }
        return expanded
      }
      // Sin la poda por colapso: todo nodo persistible materializado en
      // memoria ahora mismo, expandido o no. Le dice a quien persiste qué
      // porción del universo total este árbol puede dar por buena, para
      // mergear en vez de reemplazar (ver onExpandedFoldersChange en
      // types/huemul/file-tree.ts).
      const getKnownIds = (nodeList: HuemulTreeNode[]): string[] => {
        const known: string[] = []
        for (const node of nodeList) {
          if (isExpandableRef.current(node) && (!isPersistableRef.current || isPersistableRef.current(node))) {
            known.push(node.id)
          }
          if (node.children) known.push(...getKnownIds(node.children))
        }
        return known
      }
      const expandedIds = getExpandedIds(nodes)
      // Comparación de contenido, no solo de referencia: si `nodes` cambió
      // pero el set de carpetas expandidas es el mismo, no generar un `Set`
      // nuevo — evita un render de más y, sobre todo, evita retroalimentar el
      // loop de arriba si algún día `isExpandableRef` volviera a colarse en
      // las deps.
      setExpandedFolders((prev) => {
        if (prev.size === expandedIds.length && expandedIds.every((id) => prev.has(id))) return prev
        return new Set(expandedIds)
      })
      // Antes de isInitialized, nodes es [] — emitir acá pisaría con un set
      // vacío cualquier estado persistido antes de que la carga inicial lo
      // restaure.
      if (isInitialized) {
        onExpandedFoldersChangeRef.current?.(expandedIds, { knownIds: getKnownIds(nodes) })
      }
    }, [nodes, isInitialized])

    // Clear per-node loading indicator when activeNodeId changes to match
    useEffect(() => {
      if (loadingNodeId && activeNodeId === loadingNodeId) {
        setLoadingNodeId(null)
      }
    }, [activeNodeId, loadingNodeId])

    // Safety timeout: clear loading indicator after 3s to avoid stuck state
    useEffect(() => {
      if (!loadingNodeId) return
      const timeout = setTimeout(() => setLoadingNodeId(null), 3000)
      return () => clearTimeout(timeout)
    }, [loadingNodeId])

    // Ref guard to prevent concurrent loadInitialData calls (e.g. from
    // React StrictMode double-firing effects or rapid prop changes).
    const isLoadingInitialRef = useRef(false)

    const loadInitialData = useCallback(async () => {
      if (!onLoadChildren || isLoadingInitialRef.current) return
      isLoadingInitialRef.current = true
      setIsLoading(true)
      try {
        const data = await onLoadChildren(initialFolderId)
        setNodes(data)
        setIsInitialized(true)
      } catch (error) {
        logger.error("Error loading initial data:", error)
      } finally {
        setIsLoading(false)
        isLoadingInitialRef.current = false
      }
    }, [onLoadChildren, initialFolderId])

    useEffect(() => {
      if (!isInitialized) {
        loadInitialData()
      }
    }, [isInitialized, loadInitialData])

    const refresh = useCallback(async () => {
      if (!onLoadChildren) return
      setIsLoading(true)
      try {
        const currentExpandedIds = Array.from(expandedFolders)

        const reloadExpandedFolders = async (nodeList: HuemulTreeNode[]): Promise<HuemulTreeNode[]> => {
          const result: HuemulTreeNode[] = []
          for (const node of nodeList) {
            const newNode = { ...node }
            const alreadyExpanded = newNode.isExpanded && newNode.children
            if (alreadyExpanded) {
              newNode.children = await reloadExpandedFolders(newNode.children!)
            } else if (isExpandable(node) && currentExpandedIds.includes(node.id)) {
              try {
                const children = await onLoadChildren(node.id, node)
                newNode.children = await reloadExpandedFolders(children)
                newNode.isExpanded = true
                newNode.hasChildren = children.length > 0
              } catch (error) {
                logger.error(`Error reloading folder ${node.id}:`, error)
                newNode.children = []
                newNode.isExpanded = false
              }
            }
            result.push(newNode)
          }
          return result
        }

        const rootData = onRefreshProp ? await onRefreshProp() : await onLoadChildren(initialFolderId)
        if (!preserveExpandedOnRefresh) {
          setNodes(rootData)
          return
        }
        const refreshedNodes = await reloadExpandedFolders(rootData)
        setNodes(refreshedNodes)
      } catch (error) {
        logger.error("Error refreshing tree:", error)
      } finally {
        setIsLoading(false)
      }
    }, [onLoadChildren, onRefreshProp, expandedFolders, initialFolderId, isExpandable, preserveExpandedOnRefresh])

    useImperativeHandle(ref, () => ({ refresh }))

    const updateNode = useCallback((nodeId: string, updates: Partial<HuemulTreeNode>, nodeList: HuemulTreeNode[]): HuemulTreeNode[] => {
      return nodeList.map((node) => {
        if (node.id === nodeId) return { ...node, ...updates }
        if (node.children) return { ...node, children: updateNode(nodeId, updates, node.children) }
        return node
      })
    }, [])

    const findNode = useCallback((nodeId: string, nodeList: HuemulTreeNode[]): HuemulTreeNode | null => {
      for (const node of nodeList) {
        if (node.id === nodeId) return node
        if (node.children) {
          const found = findNode(nodeId, node.children)
          if (found) return found
        }
      }
      return null
    }, [])

    const isDescendant = useCallback(
      (ancestorId: string, nodeId: string, nodeList: HuemulTreeNode[]): boolean => {
        const ancestor = findNode(ancestorId, nodeList)
        if (!ancestor || !ancestor.children) return false
        for (const child of ancestor.children) {
          if (child.id === nodeId) return true
          if (isDescendant(child.id, nodeId, nodeList)) return true
        }
        return false
      },
      [findNode],
    )

    // Un nodo carpeta acepta drop si: es del tipo carpeta, no está deshabilitado,
    // no es el propio nodo arrastrado, no es descendiente suyo (evita ciclos) y
    // pasa canDropNode (si el consumidor la define).
    const isDropAllowed = useCallback(
      (node: HuemulTreeNode) => {
        if (node.type !== folderType || node.disabled || !draggedNode) return false
        if (draggedNode === node.id) return false
        if (isDescendant(draggedNode, node.id, nodes)) return false
        return canDropNode ? canDropNode(node) : true
      },
      [folderType, draggedNode, nodes, isDescendant, canDropNode],
    )

    const handleToggle = async (node: HuemulTreeNode) => {
      if (node.disabled || !isExpandable(node)) return

      if (node.isExpanded) {
        setExpandedFolders((prev) => {
          const newSet = new Set(prev)
          newSet.delete(node.id)
          return newSet
        })
        setNodes((prev) => updateNode(node.id, { isExpanded: false }, prev))
        return
      }

      setExpandedFolders((prev) => new Set(prev).add(node.id))

      if (!node.children && onLoadChildren) {
        setNodes((prev) => updateNode(node.id, { isLoading: true }, prev))
        try {
          const children = await onLoadChildren(node.id, node)
          setNodes((prev) =>
            updateNode(node.id, { children, isExpanded: true, isLoading: false, hasChildren: children.length > 0 }, prev),
          )
        } catch (error) {
          logger.error("Error loading children:", error)
          setNodes((prev) => updateNode(node.id, { isLoading: false }, prev))
        }
      } else {
        setNodes((prev) => updateNode(node.id, { isExpanded: true }, prev))
      }
    }

    const handleFileClick = async (node: HuemulTreeNode) => {
      if (node.disabled) return
      if (node.type !== folderType && onFileClick) {
        setLoadingNodeId(node.id)
        try {
          await onFileClick(node)
        } catch {
          setLoadingNodeId(null)
        }
      }
    }

    const handleFolderClick = async (node: HuemulTreeNode) => {
      await handleToggle(node)
      if (!node.disabled && onFolderClick) {
        await onFolderClick(node)
      }
    }

    const handleCreate = (parentId: string | null, type: "file" | "folder") => {
      const dialogType = type === "file" ? "createFile" : "createFolder"
      if (customDialogs && customDialogs[dialogType]) {
        setActiveDialog({ type: dialogType, nodeId: parentId })
      } else {
        setCreatingNode({ parentId, type })
        setNewNodeName("")
      }
    }

    const handleConfirmCreate = async () => {
      if (!newNodeName.trim() || !creatingNode) return
      setIsLoading(true)
      try {
        if (creatingNode.type === "file" && onCreateFile) {
          await onCreateFile(creatingNode.parentId, newNodeName)
        } else if (creatingNode.type === "folder" && onCreateFolder) {
          await onCreateFolder(creatingNode.parentId, newNodeName)
        }
        await refresh()
        setCreatingNode(null)
        setNewNodeName("")
      } catch (error) {
        logger.error("Error creating node:", error)
        setIsLoading(false)
      }
    }

    const handleCancelCreate = () => {
      setCreatingNode(null)
      setNewNodeName("")
    }

    const handleDelete = async (nodeId: string, nodeType: string) => {
      if (customDialogs?.delete) {
        setActiveDialog({ type: "delete", nodeId, nodeType })
      } else {
        setIsLoading(true)
        try {
          if (onDelete) await onDelete(nodeId, nodeType)
          await refresh()
        } catch (error) {
          logger.error("Error deleting node:", error)
          setIsLoading(false)
        }
      }
    }

    const handleShare = async (nodeId: string) => {
      if (customDialogs?.share) {
        setActiveDialog({ type: "share", nodeId })
      } else {
        setIsLoading(true)
        try {
          if (onShare) await onShare(nodeId)
        } finally {
          setIsLoading(false)
        }
      }
    }

    const handleMenuAction = (action: HuemulTreeMenuAction, nodeId: string) => {
      setTimeout(() => {
        setIsLoading(true)
        Promise.resolve(action.onClick(nodeId)).finally(() => setIsLoading(false))
      }, 0)
    }

    const handleDragStart = (e: React.DragEvent, nodeId: string, node: HuemulTreeNode) => {
      if (node.disabled) { e.preventDefault(); return }
      setDraggedNode(nodeId)
      e.dataTransfer.effectAllowed = "copyMove"
      e.dataTransfer.setData(
        "application/wisy-context",
        JSON.stringify({ type: node.type === folderType ? "folder" : "document", id: node.id, name: node.name })
      )
      onDragStartProp?.(e, node)
      scrollableParentRef.current = findScrollableParent(containerRef.current)
      dragClientYRef.current = e.clientY
      startAutoScroll()
    }

    // Zona de drop de una carpeta: fila + hijos + franja de indentación (ver
    // dónde se engancha en el wrapper del nodo, más abajo). Una hoja no tiene
    // handler propio — el evento burbujea hasta encontrar el ancestro carpeta
    // más cercano bajo el cursor, que es quien lo captura primero.
    const handleFolderDragOver = (e: React.DragEvent, node: HuemulTreeNode) => {
      dragClientYRef.current = e.clientY
      if (!isDropAllowed(node)) {
        // Carpeta inválida como destino: se frena acá (no delega al ancestro)
        // para que el usuario vea "acá no" en vez de que el highlight salte a
        // un padre inesperado.
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = "none"
        setDropTarget(null)
        return
      }
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = "move"
      setDropTarget((prev) => (prev?.kind === "node" && prev.id === node.id ? prev : { kind: "node", id: node.id }))
    }

    const handleRootDragOver = (e: React.DragEvent) => {
      dragClientYRef.current = e.clientY
      if (!draggedNode) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDropTarget((prev) => (prev?.kind === "root" ? prev : { kind: "root" }))
    }

    // Único listener de dragleave, en el contenedor raíz: limpia el target solo
    // cuando el cursor sale de verdad del árbol (no al cruzar entre nodos hijos).
    const handleContainerDragLeave = (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDropTarget(null)
      }
    }

    const commitDrop = async (targetId: string | null) => {
      setDropTarget(null)
      stopAutoScroll()
      if (!draggedNode) return

      setIsLoading(true)
      try {
        const node = findNode(draggedNode, nodes)
        if (!node) return
        // Último freno del gesto: `draggable` ya está apagado para los nodos sin
        // permiso, pero un drop sintético (o un nodo cuyo permiso cambió a mitad
        // de sesión) no debe llegar a la mutación.
        if (canDragNode && !canDragNode(node)) { setIsLoading(false); return }

        if (node.type === folderType && onMoveFolder) {
          await onMoveFolder(draggedNode, targetId)
        } else if (node.type !== folderType && onMoveFile) {
          await onMoveFile(draggedNode, targetId)
        }
        await refresh()
      } catch (error) {
        logger.error("Error moving node:", error)
        setIsLoading(false)
      } finally {
        setDraggedNode(null)
      }
    }

    const handleFolderDrop = async (e: React.DragEvent, node: HuemulTreeNode) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDropAllowed(node)) { setDropTarget(null); return }
      await commitDrop(node.id)
    }

    const handleRootDrop = async (e: React.DragEvent) => {
      e.preventDefault()
      if (!draggedNode) return
      await commitDrop(null)
    }

    const handleDialogSuccess = async () => {
      setActiveDialog(null)
      await refresh()
    }

    // ─── Selección (opt-in) ───────────────────────────────────────────────────────
    const selectionEnabled = selectable || cascadeSelection

    const canSelectNode = useCallback(
      (node: HuemulTreeNode) => {
        if (cascadeSelection) return isNodeSelectable ? isNodeSelectable(node) : true
        return selectable && (isNodeSelectable ? isNodeSelectable(node) : node.type !== folderType)
      },
      [selectable, cascadeSelection, isNodeSelectable, folderType],
    )

    const toggleSelection = useCallback(
      (nodeId: string) => {
        if (!onSelectionChange) return
        const next = new Set(selectedIds)
        if (next.has(nodeId)) next.delete(nodeId)
        else next.add(nodeId)
        onSelectionChange(next)
      },
      [onSelectionChange, selectedIds],
    )

    // ─── Selección en cascada tri-estado (opt-in) ──────────────────────────────
    const getCheckState = useCallback(
      (node: HuemulTreeNode): "checked" | "indeterminate" | "unchecked" => {
        if (!isExpandable(node)) {
          return selectedIds?.has(node.id) ? "checked" : "unchecked"
        }
        if (!node.children || node.children.length === 0) return "unchecked"
        let allChecked = true
        let anyChecked = false
        for (const child of node.children) {
          const state = getCheckState(child)
          if (state !== "unchecked") anyChecked = true
          if (state !== "checked") allChecked = false
        }
        return allChecked ? "checked" : anyChecked ? "indeterminate" : "unchecked"
      },
      [isExpandable, selectedIds],
    )

    const collectLeafIds = useCallback(
      async (node: HuemulTreeNode): Promise<string[]> => {
        if (!isExpandable(node)) return [node.id]
        let children = node.children
        if (!children && onLoadChildren) {
          children = await onLoadChildren(node.id, node)
          setNodes((prev) => updateNode(node.id, { children, hasChildren: children!.length > 0 }, prev))
        }
        const result: string[] = []
        for (const child of children ?? []) {
          result.push(...(await collectLeafIds(child)))
        }
        return result
      },
      [isExpandable, onLoadChildren, updateNode],
    )

    const toggleCascade = useCallback(
      async (node: HuemulTreeNode) => {
        if (!onSelectionChange) return
        const turnOn = getCheckState(node) !== "checked"

        if (!isExpandable(node)) {
          const next = new Set(selectedIds)
          if (turnOn) next.add(node.id)
          else next.delete(node.id)
          onSelectionChange(next)
          return
        }

        setCascadeLoadingIds((prev) => new Set(prev).add(node.id))
        try {
          const ids = await collectLeafIds(node)
          const next = new Set(selectedIds)
          ids.forEach((id) => (turnOn ? next.add(id) : next.delete(id)))
          onSelectionChange(next)
        } finally {
          setCascadeLoadingIds((prev) => {
            const next = new Set(prev)
            next.delete(node.id)
            return next
          })
        }
      },
      [onSelectionChange, selectedIds, getCheckState, isExpandable, collectLeafIds],
    )

    // ─── Renderers ──────────────────────────────────────────────────────────────
    const defaultLeafIcon = () => <File className="h-3.5 w-3.5 shrink-0" />
    const defaultFolderIcon = (_node: HuemulTreeNode, expanded: boolean) =>
      expanded
        ? <FolderOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        : <Folder className="h-3.5 w-3.5 text-blue-500 shrink-0" />

    const renderNode = (node: HuemulTreeNode, level = 0, isLastChild = false) => {
      const isFolder = node.type === folderType
      const isExpanded = node.isExpanded
      const isCreating = creatingNode?.parentId === node.id
      const isDragging = draggedNode === node.id
      // Solo una carpeta puede ser destino: cubre su propia fila y todo su
      // subárbol (hijos + franja de indentación), no solo la fila del nombre.
      const isDropTarget = isFolder && dropTarget?.kind === "node" && dropTarget.id === node.id
      const isActive = activeNodeId === node.id
      const isNodeLoading = loadingNodeId === node.id || cascadeLoadingIds.has(node.id)
      const isSelectable = canSelectNode(node)
      const checkState = cascadeSelection ? getCheckState(node) : undefined
      const isSelected = cascadeSelection ? checkState === "checked" : !!selectedIds?.has(node.id)
      const isSection = level === 0 && !!isSectionHeader?.(node)

      const hasCustomMenuActions = menuActions.some((action) => (action.show ? action.show(node) : true))
      const hasVisibleMenuActions =
        (isFolder && showDefaultActions.create) ||
        showDefaultActions.delete ||
        showDefaultActions.share ||
        hasCustomMenuActions

      return (
        <div
          key={node.id}
          className={cn(
            "relative min-w-0 rounded-md transition-colors",
            level > 0 && "ml-4",
            // Zona de drop del subárbol completo: fila + hijos + franja de
            // indentación quedan dentro de esta misma caja.
            isDropTarget && "bg-primary/5 ring-1 ring-inset ring-primary/40",
          )}
          onDragOver={isFolder && !node.disabled ? (e) => handleFolderDragOver(e, node) : undefined}
          onDrop={isFolder && !node.disabled ? (e) => handleFolderDrop(e, node) : undefined}
        >
          {level > 0 && (
            <div
              className="absolute left-0 top-0 bottom-0 w-px bg-border"
              style={{ left: `${level * 12 - 14}px`, height: isLastChild ? "1.25rem" : "100%" }}
            />
          )}
          {level > 0 && (
            <div
              className="absolute top-5 w-3 h-px bg-border"
              style={{ left: `${level * 12 - 14}px` }}
            />
          )}

          <div
            className={cn(
              "group flex items-center gap-1 min-w-0 px-2 rounded-md transition-colors relative",
              isSection ? "h-8" : "py-0.5",
              node.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:cursor-pointer",
              isDragging && "opacity-50",
              // Dentro de la caja ya resaltada del subárbol, la propia fila de la
              // carpeta destino marca el punto exacto donde caería el drop.
              isDropTarget && "bg-primary/10 text-primary",
              isActive && "bg-accent font-medium",
              isSelected && "bg-primary/5",
              isNodeLoading && "bg-accent/50",
              renderNodeClassName?.(node),
            )}
            style={{ paddingLeft: `${level * 12 + 6}px` }}
            draggable={!cascadeSelection && !node.disabled && !isSection && (canDragNode?.(node) ?? true)}
            onDragStart={(e) => handleDragStart(e, node.id, node)}
            onDragEnd={() => { setDraggedNode(null); setDropTarget(null); stopAutoScroll() }}
          >
            {selectionEnabled && isSelectable && (
              <Checkbox
                checked={cascadeSelection ? checkState === "indeterminate" ? "indeterminate" : checkState === "checked" : isSelected}
                onCheckedChange={() => (cascadeSelection ? toggleCascade(node) : toggleSelection(node.id))}
                onClick={(e) => e.stopPropagation()}
                disabled={node.disabled || isNodeLoading}
                className="shrink-0 border-muted-foreground/50 data-[state=unchecked]:bg-background"
                aria-label={node.name}
              />
            )}

            {isExpandable(node) && (
              <HuemulButton
                variant="ghost"
                size="icon"
                className={cn("h-3 w-3 p-0 hover:bg-transparent", isSection && "text-sidebar-foreground/70")}
                onClick={() => handleToggle(node)}
                disabled={node.disabled}
              >
                {node.isLoading ? (
                  <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                ) : isExpanded ? (
                  <ChevronDown className="h-2.5 w-2.5" />
                ) : (
                  <ChevronRight className="h-2.5 w-2.5" />
                )}
              </HuemulButton>
            )}

            <div
              className="flex items-center gap-1.5 flex-1 min-w-0"
              onClick={() => {
                if (cascadeSelection) {
                  isExpandable(node) ? handleToggle(node) : toggleCascade(node)
                } else if (selectable && isSelectable) {
                  toggleSelection(node.id)
                } else if (isFolder) {
                  handleFolderClick(node)
                } else {
                  handleFileClick(node)
                }
              }}
            >
              {isFolder
                ? (renderFolderIcon
                    ? renderFolderIcon(node, !!isExpanded)
                    : (isSection ? null : defaultFolderIcon(node, !!isExpanded)))
                : isNodeLoading
                  ? <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  : (renderLeafIcon ? renderLeafIcon(node) : defaultLeafIcon())}
              <p className={cn(
                isSection ? "text-xs font-medium text-sidebar-foreground/70" : "text-sm",
                "truncate",
                isNodeLoading && "text-muted-foreground",
              )}>{node.name}</p>
              {renderNodeSuffix?.(node)}
            </div>

            {!selectionEnabled && ((hasVisibleMenuActions && !node.disabled) || (hasCustomMenuActions && node.disabled)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <HuemulButton
                    variant="ghost"
                    size="icon"
                    icon={MoreVertical}
                    iconClassName="h-4 w-4"
                    className={cn(
                      "h-6 w-6 shrink-0 transition-opacity",
                      alwaysShowMenuActions && hasCustomMenuActions
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isFolder && showDefaultActions.create && (
                    <>
                      <DropdownMenuItem
                        onSelect={() => { setTimeout(() => handleCreate(node.id, "file"), 0) }}
                        className="hover:cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {labels.newFile}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => { setTimeout(() => handleCreate(node.id, "folder"), 0) }}
                        className="hover:cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {labels.newFolder}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {menuActions
                    .filter((action) => (action.show ? action.show(node) : true))
                    .map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onSelect={() => handleMenuAction(action, node.id)}
                        className={cn(
                          "hover:cursor-pointer",
                          action.variant === "destructive" && "text-destructive focus:text-destructive",
                        )}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    ))}

                  {menuActions.length > 0 && (showDefaultActions.share || showDefaultActions.delete) && (
                    <DropdownMenuSeparator />
                  )}

                  {showDefaultActions.share && (
                    <DropdownMenuItem
                      onSelect={() => { setTimeout(() => handleShare(node.id), 0) }}
                      className="hover:cursor-pointer"
                    >
                      <Share className="mr-2 h-4 w-4" />
                      {labels.shareLink}
                    </DropdownMenuItem>
                  )}

                  {showDefaultActions.delete && (
                    <DropdownMenuItem
                      onSelect={() => { setTimeout(() => handleDelete(node.id, node.type), 0) }}
                      className="text-destructive focus:text-destructive hover:cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isFolder ? labels.deleteFolder : labels.deleteFile}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isCreating && (
            <div
              className="flex items-center gap-1.5 py-0.5 px-2 ml-4 relative"
              style={{ paddingLeft: `${(level + 1) * 12 + 6}px` }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-border"
                style={{ left: `${(level + 1) * 12 - 14}px` }}
              />
              <div
                className="absolute top-5 w-3 h-px bg-border"
                style={{ left: `${(level + 1) * 12 - 14}px` }}
              />
              {creatingNode!.type === "folder" ? (
                <Folder className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
              )}
              <Input
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmCreate()
                  if (e.key === "Escape") handleCancelCreate()
                }}
                onBlur={handleConfirmCreate}
                placeholder={labels.inputPlaceholder}
                className="h-7 text-sm"
                autoFocus
              />
            </div>
          )}

          {isExpandable(node) && isExpanded && node.children && node.children.map((child, index) =>
            renderNode(child, level + 1, index === node.children!.length - 1)
          )}
        </div>
      )
    }

    // ─── Root render ────────────────────────────────────────────────────────────
    return (
      <div className="space-y-2 w-full min-w-0">
        {showRefreshButton && (
          <div className="flex justify-end">
            <HuemulButton
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              icon={RefreshCw}
              iconClassName={cn("h-4 w-4", isLoading && "animate-spin")}
              label="Refresh"
            />
          </div>
        )}

        <div
          ref={containerRef}
          className={cn(
            "relative w-full rounded-lg transition-colors overflow-hidden",
            showBorder && "border bg-card",
            !showBorder && "bg-transparent",
            // Zona raíz: solo se enciende cuando el cursor está de verdad sobre
            // espacio sin carpeta debajo (los wrappers de carpeta ya frenan la
            // propagación del evento con stopPropagation).
            dropTarget?.kind === "root" && "ring-1 ring-inset ring-primary/40 bg-primary/3",
          )}
          style={{ minHeight }}
          onDragOver={handleRootDragOver}
          onDragLeave={handleContainerDragLeave}
          onDrop={handleRootDrop}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">{labels.loading}</p>
              </div>
            </div>
          )}

          {showCreateButtons && (
            <div className="flex gap-2 mb-4">
              <HuemulButton
                variant="outline"
                size="sm"
                onClick={() => handleCreate(null, "file")}
                icon={Plus}
                iconClassName="h-4 w-4"
                label={labels.createFile}
              />
              <HuemulButton
                variant="outline"
                size="sm"
                onClick={() => handleCreate(null, "folder")}
                icon={Plus}
                iconClassName="h-4 w-4"
                label={labels.createFolder}
              />
            </div>
          )}

          {creatingNode?.parentId === null && (
            <div className="flex items-center gap-2 py-1 px-2 mb-2 relative">
              {creatingNode.type === "folder" ? (
                <Folder className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <Input
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmCreate()
                  if (e.key === "Escape") handleCancelCreate()
                }}
                onBlur={handleConfirmCreate}
                placeholder={labels.inputPlaceholder}
                className="h-7 text-sm"
                autoFocus
              />
            </div>
          )}

          <div className="space-y-0.5">
            {nodes.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-8">{labels.empty}</p>
            )}
            {nodes.map((node, index) => renderNode(node, 0, index === nodes.length - 1))}
          </div>
        </div>

        {activeDialog && customDialogs && (
          <>
            {activeDialog.type === "createFile" &&
              customDialogs.createFile &&
              customDialogs.createFile(activeDialog.nodeId, handleDialogSuccess)}
            {activeDialog.type === "createFolder" &&
              customDialogs.createFolder &&
              customDialogs.createFolder(activeDialog.nodeId, handleDialogSuccess)}
            {activeDialog.type === "delete" &&
              customDialogs.delete &&
              activeDialog.nodeType &&
              customDialogs.delete(activeDialog.nodeId!, activeDialog.nodeType, handleDialogSuccess)}
            {activeDialog.type === "share" &&
              customDialogs.share &&
              customDialogs.share(activeDialog.nodeId!, handleDialogSuccess)}
          </>
        )}
      </div>
    )
  },
)

HuemulFileTree.displayName = "HuemulFileTree"
