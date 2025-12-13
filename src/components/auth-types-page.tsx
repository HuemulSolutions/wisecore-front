"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface AuthType {
  id: string
  nombre: string
  tipo: string
  tenantId: string
  appId: string
  samlUrl: string
}

const authTypesData: AuthType[] = [
  {
    id: "1",
    nombre: "Autenticación Interna",
    tipo: "Interno",
    tenantId: "-",
    appId: "-",
    samlUrl: "-",
  },
  {
    id: "2",
    nombre: "Microsoft Entra ID",
    tipo: "Entra ID (SAML2)",
    tenantId: "123e4567-e89b-12d3-a456-426614...",
    appId: "abc-def-ghi-jkl-mno-pqr",
    samlUrl: "https://login.microsoftonline.com/saml2/...",
  },
  {
    id: "3",
    nombre: "Azure Active Directory",
    tipo: "Entra ID (SAML2)",
    tenantId: "987f6543-a21b-43c2-d654-321098...",
    appId: "xyz-123-456-789-abc",
    samlUrl: "https://sts.windows.net/tenant-id/saml2",
  },
  {
    id: "4",
    nombre: "Sistema Legado",
    tipo: "Interno",
    tenantId: "-",
    appId: "-",
    samlUrl: "-",
  },
]

export default function AuthTypesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage] = useState(1)

  const filteredAuthTypes = authTypesData.filter((auth) => auth.nombre.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tipos de Autenticación</h1>
          <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer">
            + Crear tipo de autenticación
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Buscar tipo de autenticación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Table */}
        <Card className="overflow-hidden border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-4 text-left font-semibold text-foreground">Nombre</th>
                  <th className="px-4 py-4 text-left font-semibold text-foreground">Tipo</th>
                  <th className="px-4 py-4 text-left font-semibold text-foreground">Tenant ID</th>
                  <th className="px-4 py-4 text-left font-semibold text-foreground">App ID</th>
                  <th className="px-4 py-4 text-left font-semibold text-foreground">URL (SAML2)</th>
                  <th className="px-4 py-4 text-right font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthTypes.map((auth) => (
                  <tr key={auth.id} className="border-b border-border hover:bg-muted/20 transition">
                    <td className="px-4 py-4 font-medium text-foreground">{auth.nombre}</td>
                    <td className="px-4 py-4 text-foreground">{auth.tipo}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {auth.tenantId.length > 20 ? `${auth.tenantId.substring(0, 20)}...` : auth.tenantId}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{auth.appId}</td>
                    <td className="px-4 py-4 text-blue-600 text-xs">
                      {auth.samlUrl.length > 30 ? `${auth.samlUrl.substring(0, 30)}...` : auth.samlUrl}
                    </td>
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
              Mostrando {filteredAuthTypes.length} de {authTypesData.length} tipos de autenticación
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
