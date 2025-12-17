"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuthTypes } from "@/hooks/useAuthTypes"
import { CreateAuthTypeDialog } from "@/components/create-auth-type-dialog"
import { EditAuthTypeDialog } from "@/components/edit-auth-type-dialog"
import { DeleteAuthTypeDialog } from "@/components/delete-auth-type-dialog"
import type { AuthType } from "@/services/auth-types"

export default function AuthTypesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage] = useState(1)
  const [editingAuthType, setEditingAuthType] = useState<AuthType | null>(null)
  const [deletingAuthType, setDeletingAuthType] = useState<AuthType | null>(null)

  const { data: authTypes = [], isLoading, error } = useAuthTypes()

  const filteredAuthTypes = authTypes.filter((auth) => 
    auth.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "internal":
        return "Internal"
      case "entra":
        return "Entra ID (SAML2)"
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Authentication Types</h1>
          <CreateAuthTypeDialog />
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search authentication type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">Loading authentication types...</div>
          </Card>
        )}

        {error && (
          <Card className="p-8 text-center border-destructive/50">
            <div className="text-destructive">Failed to load authentication types</div>
          </Card>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <Card className="overflow-hidden border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-4 text-left font-semibold text-foreground">Name</th>
                    <th className="px-4 py-4 text-left font-semibold text-foreground">Type</th>
                    <th className="px-4 py-4 text-left font-semibold text-foreground">Created</th>
                    <th className="px-4 py-4 text-left font-semibold text-foreground">Updated</th>
                    <th className="px-4 py-4 text-right font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuthTypes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        {searchTerm ? "No authentication types found matching your search" : "No authentication types found"}
                      </td>
                    </tr>
                  ) : (
                    filteredAuthTypes.map((auth) => (
                      <tr key={auth.id} className="border-b border-border hover:bg-muted/20 transition">
                        <td className="px-4 py-4 font-medium text-foreground">{auth.name}</td>
                        <td className="px-4 py-4 text-foreground">{getTypeDisplayName(auth.type)}</td>
                        <td className="px-4 py-4 text-muted-foreground text-sm">
                          {new Date(auth.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-sm">
                          {new Date(auth.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingAuthType(auth)}
                              className="p-2 hover:bg-muted rounded-lg transition hover:cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4 text-foreground" />
                            </button>
                            <button 
                              onClick={() => setDeletingAuthType(auth)}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition hover:cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination - Only show if there are auth types */}
        {!isLoading && !error && authTypes.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-4 py-4 bg-muted/20 rounded-lg text-sm text-muted-foreground">
            <span>
              Showing {filteredAuthTypes.length} of {authTypes.length} authentication types
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                className={currentPage === 1 ? "bg-blue-600" : ""}
              >
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <EditAuthTypeDialog
          open={!!editingAuthType}
          onOpenChange={(open) => !open && setEditingAuthType(null)}
          authType={editingAuthType}
        />

        <DeleteAuthTypeDialog
          open={!!deletingAuthType}
          onOpenChange={(open) => !open && setDeletingAuthType(null)}
          authType={deletingAuthType}
        />
      </div>
    </div>
  )
}
