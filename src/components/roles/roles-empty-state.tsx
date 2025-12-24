import { Button } from "@/components/ui/button"
import { Plus, Shield } from "lucide-react"

interface RolesEmptyStateProps {
  hasSearchTerm: boolean
  onCreateRole: () => void
}

export default function RolesEmptyState({ hasSearchTerm, onCreateRole }: RolesEmptyStateProps) {
  return (
    <div className="text-center py-8">
      <Shield className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
      <h3 className="text-base font-medium text-foreground mb-2">No roles found</h3>
      <p className="text-sm text-muted-foreground mb-3">
        {hasSearchTerm 
          ? "Try adjusting your search criteria."
          : "No roles have been created yet."}
      </p>
      {!hasSearchTerm && (
        <Button 
          onClick={onCreateRole}
          className="hover:cursor-pointer"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create First Role
        </Button>
      )}
    </div>
  )
}