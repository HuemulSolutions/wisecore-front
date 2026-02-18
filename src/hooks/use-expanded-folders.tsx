import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ExpandedFoldersContextType {
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  isExpanded: (folderId: string) => boolean;
  clearExpanded: () => void;
  // Para manejar la re-expansión automática después de refresh
  reExpandFolders: (folderIds: string[], loadChildren: (folderId: string) => Promise<any>, onChildrenLoaded?: (folderId: string, children: any[]) => void) => Promise<void>;
  // Para obtener la lista de carpetas expandidas que necesitan recargarse
  getExpandedFolderIds: () => string[];
  // Flag para indicar si está en proceso de re-expansión
  isReExpanding: boolean;
  // Para registrar callbacks de cuando se cargan children
  registerChildrenLoadedCallback: (folderId: string, callback: (children: any[]) => void) => void;
  unregisterChildrenLoadedCallback: (folderId: string) => void;
}

const ExpandedFoldersContext = createContext<ExpandedFoldersContextType | undefined>(undefined);

export const useExpandedFolders = () => {
  const context = useContext(ExpandedFoldersContext);
  if (!context) {
    throw new Error('useExpandedFolders must be used within an ExpandedFoldersProvider');
  }
  return context;
};

interface ExpandedFoldersProviderProps {
  children: ReactNode;
}

export const ExpandedFoldersProvider = ({ children }: ExpandedFoldersProviderProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isReExpanding, setIsReExpanding] = useState(false);
  const [childrenLoadedCallbacks, setChildrenLoadedCallbacks] = useState<Map<string, (children: any[]) => void>>(new Map());

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      console.log(`🔄 Toggled folder ${folderId}. Now expanded:`, Array.from(newSet));
      return newSet;
    });
  }, []);

  const expandFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.add(folderId);
      console.log(`➕ Expanded folder ${folderId}. All expanded:`, Array.from(newSet));
      return newSet;
    });
  }, []);

  const collapseFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.delete(folderId);
      console.log(`➖ Collapsed folder ${folderId}. Remaining expanded:`, Array.from(newSet));
      return newSet;
    });
  }, []);

  const isExpanded = useCallback((folderId: string) => {
    return expandedFolders.has(folderId);
  }, [expandedFolders]);

  const clearExpanded = useCallback(() => {
    console.log('🧹 Clearing all expanded folders');
    setExpandedFolders(new Set());
  }, []);

  const getExpandedFolderIds = useCallback(() => {
    return Array.from(expandedFolders);
  }, [expandedFolders]);

  const registerChildrenLoadedCallback = useCallback((folderId: string, callback: (children: any[]) => void) => {
    setChildrenLoadedCallbacks(prev => new Map(prev.set(folderId, callback)));
  }, []);

  const unregisterChildrenLoadedCallback = useCallback((folderId: string) => {
    setChildrenLoadedCallbacks(prev => {
      const newMap = new Map(prev);
      newMap.delete(folderId);
      return newMap;
    });
  }, []);

  const reExpandFolders = useCallback(async (folderIds: string[], loadChildren: (folderId: string) => Promise<any>, onChildrenLoaded?: (folderId: string, children: any[]) => void) => {
    console.log('🔄 Re-expanding folders after refresh:', folderIds);
    setIsReExpanding(true);
    
    try {
      // Primero, asegurar que todas las carpetas están marcadas como expandidas
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        folderIds.forEach(id => newSet.add(id));
        console.log('📁 Restored expanded state for all folders:', Array.from(newSet));
        return newSet;
      });

      // Luego, cargar el contenido de cada carpeta
      for (const folderId of folderIds) {
        try {
          console.log(`🔄 Loading children for folder: ${folderId}`);
          const loadedChildren = await loadChildren(folderId);
          console.log(`✅ Re-expanded folder ${folderId} with ${loadedChildren.length} children`);
          
          // Notificar que los children se han cargado usando callbacks registrados
          const callback = childrenLoadedCallbacks.get(folderId);
          if (callback && loadedChildren) {
            console.log(`🔄 Notifying component for folder ${folderId} with ${loadedChildren.length} children`);
            callback(loadedChildren);
          }
          
          // También usar el callback pasado como parámetro si existe
          if (onChildrenLoaded && loadedChildren) {
            onChildrenLoaded(folderId, loadedChildren);
          }
        } catch (error) {
          console.error(`❌ Failed to re-expand folder ${folderId}:`, error);
          // Si falla cargar una carpeta, la removemos del estado expandido
          setExpandedFolders(prev => {
            const newSet = new Set(prev);
            newSet.delete(folderId);
            return newSet;
          });
        }
      }
    } finally {
      setIsReExpanding(false);
    }
  }, [childrenLoadedCallbacks]);

  const value: ExpandedFoldersContextType = {
    expandedFolders,
    toggleFolder,
    expandFolder,
    collapseFolder,
    isExpanded,
    clearExpanded,
    reExpandFolders,
    getExpandedFolderIds,
    isReExpanding,
    registerChildrenLoadedCallback,
    unregisterChildrenLoadedCallback,
  };

  return (
    <ExpandedFoldersContext.Provider value={value}>
      {children}
    </ExpandedFoldersContext.Provider>
  );
};