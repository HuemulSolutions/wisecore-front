"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface Role {
  id: string
  name: string
  description: string
  usersCount: number
}

const rolesData: Role[] = [
  {
    id: "1",
    name: "Admin",
    description: "Acceso completo al sistema con todos los permisos administrativos",
    usersCount: 5,
  },
  {
    id: "2",
    name: "Editor",
    description: "Puede crear y editar contenido en todos los tipos de activos",
    usersCount: 12,
  },
  {
    id: "3",
    name: "Revisor",
    description: "Puede revisar y aprobar contenido creado por otros usuarios",
    usersCount: 8,
  },
  {
    id: "4",
    name: "Lector",
    description: "Acceso de solo lectura a documentos y contenido del sistema",
    usersCount: 25,
  },
  {
    id: "5",
    name: "Invitado",
    description: "Acceso limitado temporal para usuarios externos",
    usersCount: 3,
  },
]

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage] = useState(1)

  const filteredRoles = rolesData.filter((role) => role.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Roles</h1>
          <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer">+ Crear rol</Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Buscar rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        <Card className="overflow-hidden border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-12 px-4 py-4 text-left">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Nombre del rol</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Usuarios asignados</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b border-border hover:bg-muted/20 transition">
                    <td className="w-12 px-4 py-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">{role.name}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">{role.usersCount} usuarios</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 hover:bg-muted rounded-lg transition hover:cursor-pointer">
                          <Edit2 className="w-4 h-4 text-foreground" />
                        </button>
                        <button className="p-2 hover:bg-destructive/10 rounded-lg transition hover:cursor-pointer">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 bg-muted/20 text-sm text-muted-foreground">
            <span>
              Mostrando {filteredRoles.length} de {rolesData.length} roles
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                className={currentPage === 1 ? "bg-blue-600" : ""}
              >
                1
              </Button>
              <Button variant="outline" size="sm">
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
