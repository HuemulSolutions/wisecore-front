"use client"

import { Plus, Settings2 } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

interface CustomFieldPageHeaderProps {
  customFieldCount: number
  onCreateCustomField: () => void
  onRefresh: () => void
  isLoading?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  canManage?: boolean
}

export function CustomFieldPageHeader({
  customFieldCount,
  onCreateCustomField,
  onRefresh,
  isLoading = false,
  searchTerm,
  onSearchChange,
  canManage = false
}: CustomFieldPageHeaderProps) {
  return (
    <PageHeader
      icon={Settings2}
      title="Custom Fields"
      badges={[
        { label: "", value: isLoading ? "..." : customFieldCount }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      primaryAction={canManage ? {
        label: "Create Custom Field",
        icon: Plus,
        onClick: onCreateCustomField
      } : undefined}
      searchConfig={{
        placeholder: "Search custom fields...",
        value: searchTerm,
        onChange: onSearchChange
      }}
    />
  )
}