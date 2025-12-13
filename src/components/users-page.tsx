"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, MoreVertical } from "lucide-react"

interface User {
  id: string
  nombre: string
  apellido: string
  email: string
  estado: "Activo" | "Inactivo"
  fechaCreacion: string
}

const usersData: User[] = [
  {
    id: "1",
    nombre: "Ana",
    apellido: "García",
    email: "ana.garcia@wisecore.com",
    estado: "Activo",
    fechaCreacion: "2024-01-15",
  },
  {
    id: "2",
    nombre: "Carlos",
    apellido: "Mendoza",
    email: "carlos.mendoza@wisecore.com",
    estado: "Activo",
    fechaCreacion: "2024-02-20",
  },
  {
    id: "3",
    nombre: "María",
    apellido: "Rodríguez",
    email: "maria.rodriguez@wisecore.com",
    estado: "Inactivo",
    fechaCreacion: "2024-03-10",
  },
  {
    id: "4",
    nombre: "Juan",
    apellido: "López",
    email: "juan.lopez@wisecore.com",
    estado: "Activo",
    fechaCreacion: "2024-04-05",
  },
]

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")

  const filteredUsers = usersData.filter((user) => {
    const matchesSearch = `${user.nombre} ${user.apellido} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "todos" || user.estado.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
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
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Nombre</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Apellido</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Estado</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Fecha creación</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/20 transition">
                    <td className="w-12 px-4 py-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground font-medium">{user.nombre}</td>
                    <td className="px-4 py-4 text-sm text-blue-600 font-medium">{user.apellido}</td>
                    <td className="px-4 py-4 text-sm text-blue-600 font-medium">{user.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          user.estado === "Activo" ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700"
                        }`}
                      >
                        {user.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">{user.fechaCreacion}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 hover:bg-muted rounded-lg transition hover:cursor-pointer">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition hover:cursor-pointer">
                          <MoreVertical className="w-4 h-4 text-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
