import { Card } from "@/components/ui/card"

interface AuthTypesEmptyStateProps {
  searchTerm: string
}

export function AuthTypesEmptyState({ searchTerm }: AuthTypesEmptyStateProps) {
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
            <tr>
              <td colSpan={5} className="px-3 py-12 text-center text-muted-foreground text-xs">
                {searchTerm ? "No authentication types found matching your search" : "No authentication types found"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}