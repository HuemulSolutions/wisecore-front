"use client"

import { Plus, Building2 } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

interface OrganizationPageHeaderProps {
  organizationCount: number
  onCreateOrganization: () => void
  onRefresh: () => void
  isLoading?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  canManage?: boolean
}

export function OrganizationPageHeader({
  organizationCount,
  onCreateOrganization,
  onRefresh,
  isLoading = false,
  searchTerm,
  onSearchChange,
  canManage = false
}: OrganizationPageHeaderProps) {
  return (
    <PageHeader
      icon={Building2}
      title="Organizations"
      badges={[
        { label: "", value: isLoading ? "..." : organizationCount }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      primaryAction={canManage ? {
        label: "Create Organization",
        icon: Plus,
        onClick: onCreateOrganization
      } : undefined}
      searchConfig={{
        placeholder: "Search organizations...",
        value: searchTerm,
        onChange: onSearchChange
      }}
    />
  )
}
