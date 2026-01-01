import { Card } from "@/components/ui/card"
import type { AuthType } from "@/services/auth-types"
import { AuthTypeTableRow } from "./auth-type-table-row"

interface AuthTypesTableProps {
  authTypes: AuthType[]
  filteredAuthTypes: AuthType[]
  onEdit: (authType: AuthType) => void
  onDelete: (authType: AuthType) => void
}

export function AuthTypesTable({ 
  authTypes, 
  filteredAuthTypes, 
  onEdit, 
  onDelete 
}: AuthTypesTableProps) {
  return (
    <Card className="border border-border bg-card overflow-auto max-h-[70vh]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Type</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Created</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Updated</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAuthTypes.map((authType) => (
              <AuthTypeTableRow
                key={authType.id}
                authType={authType}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      {filteredAuthTypes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 py-2 sm:py-3 bg-muted/20 text-xs text-muted-foreground border-t gap-1 sm:gap-0">
          <span className="text-xs">
            Showing {filteredAuthTypes.length} of {authTypes.length} authentication types
          </span>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs">{authTypes.filter(a => a.type === 'internal').length} internal types</span>
          </div>
        </div>
      )}
    </Card>
  )
}