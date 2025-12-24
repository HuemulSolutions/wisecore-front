import { useMemo, useState, useCallback } from "react"
import { type Role } from "@/services/rbac"

export function useRoleFiltering(roles: Role[], searchTerm: string) {
  return useMemo(() => {
    if (!searchTerm.trim()) return roles
    
    const lowercaseSearch = searchTerm.toLowerCase()
    return roles.filter((role) =>
      role.name.toLowerCase().includes(lowercaseSearch) ||
      role.description.toLowerCase().includes(lowercaseSearch)
    )
  }, [roles, searchTerm])
}

export function useRoleSelection() {
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())

  const handleRoleSelection = useCallback((roleId: string) => {
    setSelectedRoles(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(roleId)) {
        newSelection.delete(roleId)
      } else {
        newSelection.add(roleId)
      }
      return newSelection
    })
  }, [])

  const handleSelectAll = useCallback((filteredRoles: Role[]) => {
    setSelectedRoles(prev => {
      if (prev.size === filteredRoles.length && filteredRoles.length > 0) {
        return new Set()
      } else {
        return new Set(filteredRoles.map(role => role.id))
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedRoles(new Set())
  }, [])

  return {
    selectedRoles,
    handleRoleSelection,
    handleSelectAll,
    clearSelection
  }
}