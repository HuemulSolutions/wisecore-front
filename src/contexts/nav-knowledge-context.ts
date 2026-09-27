import { createContext, useContext } from "react"
import type { NavKnowledgeContextValue } from "@/types/nav-knowledge"

// Contexto separado del componente NavKnowledgeProvider (ver nav-knowledge-provider.tsx)
// a propósito: un archivo que exporta un componente Y hooks no puede ser
// auto-aceptado por react-refresh (ver warning `react-refresh/only-export-components`).
// Eso hacía que un hot update re-evaluara este módulo y createContext(...)
// devolviera un objeto de contexto nuevo mientras el <NavKnowledgeProvider> ya
// montado seguía escribiendo en el viejo — NavKnowledgeHeader/Content leían
// undefined y useNavKnowledge (estricto) tiraba "must be used within NavKnowledgeProvider".
export const NavKnowledgeContext = createContext<NavKnowledgeContextValue | null>(null)

export function useNavKnowledge() {
  const context = useContext(NavKnowledgeContext)
  if (!context) {
    throw new Error('useNavKnowledge must be used within NavKnowledgeProvider')
  }
  return context
}

// Export hook for external use
export function useNavKnowledgeRefresh() {
  const context = useContext(NavKnowledgeContext)
  return context?.refreshFileTree || (() => {})
}

// Export hook for accessing dialog actions (create asset, create folder, etc.)
export function useNavKnowledgeActions() {
  const context = useContext(NavKnowledgeContext)
  return {
    handleCreateAsset: context?.handleCreateAsset || (() => {}),
    handleCreateFolder: context?.handleCreateFolder || (() => {}),
  }
}

// Export hook for accessing pagination state of the root file tree
export function useNavKnowledgePagination() {
  const context = useContext(NavKnowledgeContext)
  return {
    page: context?.rootPage ?? 1,
    pageSize: context?.rootPageSize ?? 50,
    hasNext: context?.hasNextRootPage ?? false,
    hasPrevious: (context?.rootPage ?? 1) > 1,
    setPage: context?.setRootPage ?? (() => {}),
    setPageSize: context?.setRootPageSize ?? (() => {}),
  }
}
